/**
 * Coupons : lecture, vérification, consommation.
 *
 * Toute la confiance est ici. Le navigateur envoie un code et un panier ; ni
 * l'un ni l'autre ne sont crus sur parole — le coupon est relu en base, le
 * panier rechiffré à partir des prix réels, et la remise recalculée avec la
 * même fonction que celle qui a servi à l'aperçu.
 */

import { prisma } from "@/server/prisma";
import {
  computeCouponDiscount,
  isCouponKind,
  normalizeCouponCode,
  type CouponBasis,
  type CouponKind,
  type CouponOutcome,
  type CouponRejection,
  type CouponRules,
} from "@/lib/coupon";

export interface CouponRecord extends CouponRules {
  id: string;
  label: string;
  enabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number;
  maxPerCustomer: number;
  redemptionCount: number;
  updatedAt: Date;
  updatedBy: string;
}

interface CouponRow {
  id: string;
  code: string;
  label: string;
  kind: string;
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number;
  enabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number;
  maxPerCustomer: number;
  redemptionCount: number;
  updatedAt: Date;
  updatedBy: string;
}

function toRecord(row: CouponRow): CouponRecord {
  return {
    ...row,
    kind: (isCouponKind(row.kind) ? row.kind : "percent") as CouponKind,
  };
}

export type CouponCheck =
  | { ok: true; coupon: CouponRecord; outcome: CouponOutcome }
  | { ok: false; reason: CouponRejection };

/**
 * Vérifie un code pour un panier donné.
 *
 * L'ordre des contrôles suit ce que la personne peut corriger : un code
 * inconnu ou expiré ne se rattrape pas, un panier trop petit si. Le message le
 * plus utile est donc celui d'un panier insuffisant, et il vient en dernier.
 *
 * `email` est facultatif : à l'étape du panier, on ne le connaît pas encore. La
 * limite par client n'est alors pas vérifiable, et elle le sera à la commande —
 * moment où elle compte vraiment.
 */
export async function checkCoupon(
  rawCode: string,
  basis: CouponBasis,
  email?: string,
): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, reason: "unknown" };

  const row = await prisma.coupon.findUnique({ where: { code } });
  if (!row) return { ok: false, reason: "unknown" };

  const coupon = toRecord(row);
  if (!coupon.enabled) return { ok: false, reason: "disabled" };

  const maintenant = new Date();
  if (coupon.startsAt && maintenant < coupon.startsAt) return { ok: false, reason: "not_started" };
  if (coupon.endsAt && maintenant > coupon.endsAt) return { ok: false, reason: "expired" };

  if (coupon.maxRedemptions > 0 && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, reason: "exhausted" };
  }

  if (email && coupon.maxPerCustomer > 0) {
    const dejaUtilise = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, email: email.trim().toLowerCase() },
    });
    if (dejaUtilise >= coupon.maxPerCustomer) return { ok: false, reason: "already_used" };
  }

  if (basis.subtotalCents < coupon.minSubtotalCents) {
    return { ok: false, reason: "min_subtotal" };
  }

  const outcome = computeCouponDiscount(coupon, basis);
  // Un coupon de livraison offerte sur une commande déjà en port gratuit ne
  // retire rien : mieux vaut le dire que d'afficher une remise de zéro euro.
  if (outcome.discountCents === 0 && !outcome.freeShipping) {
    return { ok: false, reason: "no_effect" };
  }

  return { ok: true, coupon, outcome };
}

/**
 * Enregistre l'utilisation d'un coupon par une commande.
 *
 * Le compteur global et la ligne de rachat sont écrits dans la même
 * transaction : un coupon limité à cent usages ne doit pas pouvoir être
 * consommé cent-une fois parce que deux commandes sont parties ensemble.
 *
 * `orderId` porte une contrainte d'unicité : rejouer la même commande ne
 * décompte pas deux fois.
 */
export async function redeemCoupon(
  couponId: string,
  orderId: string,
  email: string,
  discountCents: number,
): Promise<void> {
  await prisma.$transaction([
    prisma.couponRedemption.create({
      data: { couponId, orderId, email: email.trim().toLowerCase(), discountCents },
    }),
    prisma.coupon.update({
      where: { id: couponId },
      data: { redemptionCount: { increment: 1 } },
    }),
  ]);
}

// ---- Administration ----

export async function listCoupons(): Promise<CouponRecord[]> {
  const rows = await prisma.coupon.findMany({ orderBy: [{ enabled: "desc" }, { code: "asc" }] });
  return rows.map(toRecord);
}

export async function findCoupon(id: string): Promise<CouponRecord | null> {
  const row = await prisma.coupon.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export interface CouponInput {
  code: string;
  label: string;
  kind: CouponKind;
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number;
  maxPerCustomer: number;
  enabled: boolean;
}

export async function createCoupon(input: CouponInput, actor: string): Promise<CouponRecord> {
  const row = await prisma.coupon.create({
    data: { ...input, code: normalizeCouponCode(input.code), updatedBy: actor },
  });
  return toRecord(row);
}

export async function updateCoupon(
  id: string,
  input: CouponInput,
  actor: string,
): Promise<CouponRecord | null> {
  const existe = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return null;

  const row = await prisma.coupon.update({
    where: { id },
    data: { ...input, code: normalizeCouponCode(input.code), updatedBy: actor },
  });
  return toRecord(row);
}

export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    await prisma.coupon.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
