import { NextResponse } from "next/server";
import { checkCoupon } from "@/server/coupons";
import { checkCouponRate } from "@/server/couponRate";
import { describeCoupon } from "@/lib/coupon";
import { computeTotals, DEFAULT_SHIPPING_METHOD_KEY, type CartLine } from "@/lib/cart";
import { prisma } from "@/server/prisma";
import type { ShippingMethodKey } from "@/lib/cart";

/**
 * Vérification d'un code de réduction, avant la commande.
 *
 * Rien de ce que le navigateur envoie n'est cru : il transmet des identifiants
 * de produit et des quantités, jamais des prix. Le panier est rechiffré à
 * partir de la base, exactement comme au moment de facturer — sans quoi il
 * suffirait d'annoncer un sous-total gonflé pour franchir le minimum d'un
 * coupon.
 *
 * La réponse ne dit jamais si un code existe quand il est refusé pour une autre
 * raison : un code inconnu et un code expiré se distinguent, mais aucun message
 * ne permet de deviner un code valable en tâtonnant, puisqu'il faut de toute
 * façon le connaître pour l'essayer.
 */

interface Corps {
  code?: unknown;
  items?: unknown;
  shippingMethodKey?: unknown;
  locale?: unknown;
}

/** Lignes de panier rechiffrées d'après la base. */
async function relireLePanier(items: unknown): Promise<CartLine[]> {
  if (!Array.isArray(items)) return [];

  const demandes = items
    .map((entree) => {
      if (!entree || typeof entree !== "object") return null;
      const brut = entree as { productId?: unknown; quantity?: unknown };
      const productId = typeof brut.productId === "string" ? brut.productId : "";
      const quantity = Number(brut.quantity);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { productId, quantity: Math.min(Math.floor(quantity), 20) };
    })
    .filter((entree): entree is { productId: string; quantity: number } => entree !== null)
    .slice(0, 50);

  if (demandes.length === 0) return [];

  const produits = await prisma.product.findMany({
    where: { id: { in: demandes.map((d) => d.productId) } },
    select: { id: true, slug: true, brand: true, name: true, image: true, priceCents: true, stock: true },
  });
  const parId = new Map(produits.map((p) => [p.id, p]));

  return demandes.flatMap((demande) => {
    const produit = parId.get(demande.productId);
    if (!produit) return [];
    return [
      {
        productId: produit.id,
        slug: produit.slug,
        brand: produit.brand,
        name: produit.name,
        // `image` est facultative en base ; le panier attend une chaîne.
        image: produit.image ?? "",
        path: "",
        priceCents: produit.priceCents,
        stock: produit.stock,
        quantity: demande.quantity,
      },
    ];
  });
}

export async function POST(request: Request) {
  // Un code se devine par essais successifs : dix par minute suffisent
  // largement à qui tape le sien, et rendent l'exploration inopérante.
  const appelant =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "inconnu";
  const cadence = checkCouponRate(appelant);
  if (!cadence.allowed) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(cadence.retryAfterSeconds) } },
    );
  }

  const corps = (await request.json().catch(() => null)) as Corps | null;
  if (!corps) {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 400 });
  }

  const code = typeof corps.code === "string" ? corps.code : "";
  const locale = corps.locale === "en" ? "en" : "de";

  const lines = await relireLePanier(corps.items);
  if (lines.length === 0) {
    return NextResponse.json({ ok: false, reason: "no_effect" }, { status: 200 });
  }

  const totals = computeTotals(lines, {
    shippingMethodKey:
      typeof corps.shippingMethodKey === "string"
        ? (corps.shippingMethodKey as ShippingMethodKey)
        : DEFAULT_SHIPPING_METHOD_KEY,
  });

  const verdict = await checkCoupon(code, {
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
  });

  if (!verdict.ok) {
    return NextResponse.json({ ok: false, reason: verdict.reason }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    code: verdict.coupon.code,
    label: describeCoupon(verdict.coupon, locale),
    discountCents: verdict.outcome.discountCents,
    freeShipping: verdict.outcome.freeShipping,
    // Le minimum est renvoyé pour que l'écran puisse l'afficher si le panier
    // repasse en dessous après un retrait d'article.
    minSubtotalCents: verdict.coupon.minSubtotalCents,
  });
}
