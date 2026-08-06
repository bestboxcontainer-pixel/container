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
 * Réserve une utilisation du coupon, avant que la commande n'existe.
 *
 * POURQUOI RÉSERVER PLUTÔT QUE DÉCOMPTER APRÈS COUP.
 *
 * `checkCoupon` lit le compteur, la commande s'écrit, puis le compteur
 * s'incrémente : entre la lecture et l'écriture, une seconde commande peut
 * lire la même valeur et passer elle aussi. Un coupon limité à cent usages
 * part alors cent-une fois — autant de remises accordées hors quota, et le
 * défaut ne se voit qu'à la lecture des comptes.
 *
 * La réservation ferme cette fenêtre : le quota est vérifié par la base
 * elle-même, dans la clause WHERE de l'incrément. Si la condition n'est plus
 * vraie au moment d'écrire, aucune ligne n'est touchée et la fonction rend
 * false. Deux commandes simultanées ne peuvent donc pas obtenir la même
 * dernière utilisation.
 *
 * Le quota par client se vérifie dans la même transaction, sérialisable :
 * compter puis insérer sans isolation laisserait passer deux commandes lancées
 * ensemble par la même personne.
 *
 * Rend true si l'utilisation est acquise. Le compteur est alors déjà
 * incrémenté : `releaseCouponUse` doit être appelée si la commande échoue.
 */
export async function reserveCouponUse(coupon: CouponRecord, email: string): Promise<boolean> {
  const adresse = email.trim().toLowerCase();

  // Sans quota par client, un incrément conditionnel suffit : la clause WHERE
  // est évaluée par la base au moment d'écrire, ce qui est déjà atomique. Une
  // transaction sérialisable ne protégerait rien de plus et sérialiserait
  // inutilement toutes les commandes portant le même code — sous quelques
  // requêtes simultanées, certaines n'obtiennent même plus de transaction.
  if (coupon.maxPerCustomer === 0) {
    try {
      if (coupon.maxRedemptions > 0) {
        const { count } = await prisma.coupon.updateMany({
          where: { id: coupon.id, redemptionCount: { lt: coupon.maxRedemptions } },
          data: { redemptionCount: { increment: 1 } },
        });
        return count === 1;
      }
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { redemptionCount: { increment: 1 } },
      });
      return true;
    } catch (erreur) {
      console.error("[coupon] réservation impossible :", erreur);
      return false;
    }
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Quota global : la condition vit dans le WHERE, donc la base tranche.
        if (coupon.maxRedemptions > 0) {
          const { count } = await tx.coupon.updateMany({
            where: { id: coupon.id, redemptionCount: { lt: coupon.maxRedemptions } },
            data: { redemptionCount: { increment: 1 } },
          });
          if (count === 0) return false;
        } else {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { redemptionCount: { increment: 1 } },
          });
        }

        // Quota par client. Lever ici annule l'incrément ci-dessus : c'est tout
        // l'intérêt de les tenir dans la même transaction.
        if (coupon.maxPerCustomer > 0) {
          const dejaUtilise = await tx.couponRedemption.count({
            where: { couponId: coupon.id, email: adresse },
          });
          if (dejaUtilise >= coupon.maxPerCustomer) {
            throw new QuotaClientAtteint();
          }
        }

        return true;
      },
      { isolationLevel: "Serializable", timeout: 10_000, maxWait: 10_000 },
    );
  } catch (erreur) {
    if (erreur instanceof QuotaClientAtteint) return false;
    // Conflit de sérialisation : deux commandes se sont croisées. La base a
    // annulé l'une des deux — refuser la remise vaut mieux que l'accorder deux
    // fois. Le client paie plein tarif, la commande passe.
    console.error("[coupon] réservation impossible :", erreur);
    return false;
  }
}

/** Quota par client atteint, détecté à l'intérieur de la transaction. */
class QuotaClientAtteint extends Error {}

/**
 * Rend l'utilisation réservée, quand la commande n'a finalement pas abouti.
 * Le compteur ne descend jamais sous zéro.
 */
export async function releaseCouponUse(couponId: string): Promise<void> {
  try {
    await prisma.coupon.updateMany({
      where: { id: couponId, redemptionCount: { gt: 0 } },
      data: { redemptionCount: { decrement: 1 } },
    });
  } catch (erreur) {
    console.error("[coupon] libération impossible :", erreur);
  }
}

/**
 * Écrit la ligne de rachat, une fois la commande créée.
 *
 * Le compteur a déjà été incrémenté par `reserveCouponUse` : cette écriture ne
 * fait qu'attacher l'utilisation à une commande et à une adresse, pour que la
 * limite par client reste opposable même après anonymisation.
 *
 * `orderId` est unique : rejouer la même commande n'écrit pas deux lignes.
 */
export async function recordCouponRedemption(
  couponId: string,
  orderId: string,
  email: string,
  discountCents: number,
): Promise<void> {
  await prisma.couponRedemption.create({
    data: { couponId, orderId, email: email.trim().toLowerCase(), discountCents },
  });
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
