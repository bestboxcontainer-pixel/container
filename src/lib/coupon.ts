/**
 * Calcul d'une remise de coupon.
 *
 * Ce module ne connaît ni la base ni le réseau : il prend un coupon déjà lu et
 * un panier déjà chiffré, et rend la remise. C'est volontaire, la même
 * fonction sert à l'aperçu affiché au client et au montant réellement facturé,
 * de sorte qu'aucun des deux ne puisse dériver de l'autre.
 *
 * Le navigateur n'intervient jamais dans ce calcul : il transmet un code, rien
 * de plus. Le serveur relit le coupon en base et refait l'opération avant
 * d'écrire la commande.
 */

/** Nature de la remise. */
export type CouponKind = "percent" | "fixed" | "freeShipping";

export const COUPON_KINDS: readonly CouponKind[] = ["percent", "fixed", "freeShipping"];

export function isCouponKind(value: unknown): value is CouponKind {
  return typeof value === "string" && (COUPON_KINDS as readonly string[]).includes(value);
}

/** Ce dont le calcul a besoin, et rien de plus. */
export interface CouponRules {
  code: string;
  kind: CouponKind;
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number;
}

/** Panier sur lequel appliquer la remise. */
export interface CouponBasis {
  subtotalCents: number;
  shippingCents: number;
}

export interface CouponOutcome {
  /** Remise appliquée aux articles, en centimes. */
  discountCents: number;
  /** Vrai si le coupon offre la livraison. */
  freeShipping: boolean;
}

/**
 * Remise accordée par un coupon, plafonnée par construction.
 *
 * Trois garde-fous, chacun pour une erreur qui coûte cher :
 *   - jamais plus que le sous-total, sinon un coupon de 50 € sur un panier de
 *     30 € rendrait un total négatif, c'est-à-dire un remboursement ;
 *   - jamais moins de zéro, pour qu'une valeur négative saisie par erreur en
 *     administration ne se transforme pas en majoration ;
 *   - plafond facultatif sur les pourcentages, pour qu'un « -20 % » ne suive
 *     pas un panier exceptionnel sans limite.
 *
 * La livraison n'est jamais entamée par une remise en argent : elle est due au
 * transporteur quoi qu'il arrive. Seul un coupon de type « livraison offerte »
 * l'annule, et il le fait entièrement.
 */
export function computeCouponDiscount(rules: CouponRules, basis: CouponBasis): CouponOutcome {
  if (basis.subtotalCents <= 0) return { discountCents: 0, freeShipping: false };
  if (basis.subtotalCents < rules.minSubtotalCents) {
    return { discountCents: 0, freeShipping: false };
  }

  if (rules.kind === "freeShipping") {
    return { discountCents: 0, freeShipping: basis.shippingCents > 0 };
  }

  let discount =
    rules.kind === "percent"
      ? Math.round((basis.subtotalCents * clamp(rules.value, 0, 100)) / 100)
      : Math.max(0, Math.round(rules.value));

  if (rules.kind === "percent" && rules.maxDiscountCents > 0) {
    discount = Math.min(discount, rules.maxDiscountCents);
  }

  discount = clamp(discount, 0, basis.subtotalCents);
  return { discountCents: discount, freeShipping: false };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** Normalise un code saisi : sans espaces superflus, en majuscules. */
export function normalizeCouponCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase().slice(0, 40) : "";
}

/** Motifs de refus, traduits côté client à partir du code. */
export type CouponRejection =
  | "unknown"
  | "disabled"
  | "not_started"
  | "expired"
  | "exhausted"
  | "already_used"
  | "min_subtotal"
  | "no_effect"
  | "rate_limited";

/** Libellé lisible d'une remise, pour le récapitulatif. */
export function describeCoupon(rules: CouponRules, locale: "de" | "en"): string {
  if (rules.kind === "freeShipping") {
    return locale === "en" ? "Free shipping" : "Versandkostenfrei";
  }
  if (rules.kind === "percent") return `−${rules.value} %`;
  const montant = (rules.value / 100).toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    style: "currency",
    currency: "EUR",
  });
  return `−${montant}`;
}
