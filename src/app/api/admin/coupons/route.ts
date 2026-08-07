import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { adminActorLabel } from "@/server/admins";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from "@/server/coupons";
import { isCouponKind, normalizeCouponCode, type CouponKind } from "@/lib/coupon";

/**
 * Codes de réduction.
 *
 *   GET    …/coupons        liste complète
 *   POST   …/coupons        crée un coupon
 *   PUT    …/coupons?id=…   remplace un coupon
 *   DELETE …/coupons?id=…   supprime un coupon
 *
 * Le contrôle des valeurs est refait ici. Un pourcentage à 500 ou un montant
 * négatif saisis par mégarde ne doivent pas atteindre la base : le calcul de
 * remise les borne déjà, mais un coupon dont l'intitulé annonce autre chose que
 * ce qu'il applique est une réclamation client assurée.
 */

interface Corps {
  code?: unknown;
  label?: unknown;
  kind?: unknown;
  value?: unknown;
  minSubtotalCents?: unknown;
  maxDiscountCents?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  maxRedemptions?: unknown;
  maxPerCustomer?: unknown;
  enabled?: unknown;
}

type Verdict =
  | { ok: true; input: Parameters<typeof createCoupon>[0] }
  | { ok: false; error: string };

function entier(valeur: unknown, defaut = 0): number {
  const n = Number(valeur);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : defaut;
}

function date(valeur: unknown): Date | null {
  if (typeof valeur !== "string" || !valeur.trim()) return null;
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d;
}

function controler(raw: unknown): Verdict {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Requête illisible." };
  const input = raw as Corps;

  const code = normalizeCouponCode(input.code);
  if (code.length < 3) {
    return { ok: false, error: "Le code doit compter au moins trois caractères." };
  }

  const kind: CouponKind = isCouponKind(input.kind) ? input.kind : "percent";

  const value = entier(input.value);
  if (kind === "percent" && (value < 1 || value > 100)) {
    return { ok: false, error: "Un pourcentage doit être compris entre 1 et 100." };
  }
  if (kind === "fixed" && value < 1) {
    return { ok: false, error: "Le montant de la remise doit être supérieur à zéro." };
  }

  const startsAt = date(input.startsAt);
  const endsAt = date(input.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) {
    return { ok: false, error: "La fin de validité ne peut pas précéder le début." };
  }

  return {
    ok: true,
    input: {
      code,
      label: typeof input.label === "string" ? input.label.trim().slice(0, 120) : "",
      kind,
      // La livraison offerte n'a pas de valeur propre : la retenir sèmerait le
      // doute dans la liste, où l'on lirait « −0 % ».
      value: kind === "freeShipping" ? 0 : value,
      minSubtotalCents: entier(input.minSubtotalCents),
      maxDiscountCents: kind === "percent" ? entier(input.maxDiscountCents) : 0,
      startsAt,
      endsAt,
      maxRedemptions: entier(input.maxRedemptions),
      maxPerCustomer: entier(input.maxPerCustomer),
      enabled: input.enabled === true,
    },
  };
}

export async function GET() {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  return NextResponse.json({ coupons: await listCoupons() });
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const verdict = controler(await request.json().catch(() => null));
  if (!verdict.ok) return NextResponse.json({ error: verdict.error }, { status: 400 });

  try {
    const coupon = await createCoupon(verdict.input, await adminActorLabel(session));
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (erreur) {
    // Contrainte d'unicité sur le code : deux coupons homonymes rendraient le
    // second inatteignable.
    if ((erreur as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce code existe déjà." }, { status: 409 });
    }
    throw erreur;
  }
}

export async function PUT(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const verdict = controler(await request.json().catch(() => null));
  if (!verdict.ok) return NextResponse.json({ error: verdict.error }, { status: 400 });

  try {
    const coupon = await updateCoupon(id, verdict.input, await adminActorLabel(session));
    if (!coupon) return NextResponse.json({ error: "Coupon introuvable." }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (erreur) {
    if ((erreur as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce code existe déjà." }, { status: 409 });
    }
    throw erreur;
  }
}

export async function DELETE(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const supprime = await deleteCoupon(id);
  if (!supprime) return NextResponse.json({ error: "Coupon introuvable." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
