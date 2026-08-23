/**
 * Prix annoncés dans le flux Google Merchant.
 *
 * `sale_price` ne dit pas « ce produit est moins cher qu'ailleurs » : il déclare
 * une promotion, c'est-à-dire une baisse temporaire par rapport à un prix que la
 * boutique pratiquait avant. Une promotion sans terme est une contradiction, et
 * c'est l'un des motifs qui font basculer un compte en contrôle manuel pour
 * promotion trompeuse.
 *
 * Or deux prix de référence coexistent dans le catalogue. Celui d'une campagne
 * est figé à l'entrée du produit dans l'opération et porte ses dates : c'est une
 * promotion au sens strict. L'ancien prix saisi à la main dans la fiche, lui,
 * n'a ni début, ni fin, ni prix antérieurement pratiqué, c'est une référence
 * fabricant, que la fiche affiche comme telle. Le flux ne l'annonce donc pas
 * comme une remise et se contente du prix réellement facturé.
 *
 * Ce fichier ne contient que la décision, sans accès à la base : elle se teste
 * seule, et c'est elle qui décide de ce que Google lit du prix.
 */

/** Ce que le flux annonce d'un produit, en centimes. */
export interface PrixFlux {
  /** Attribut `price` : prix de référence sous campagne, prix pratiqué sinon. */
  priceCents: number;
  /** Attribut `sale_price`. Absent hors campagne : aucune remise n'est déclarée. */
  salePriceCents?: number;
  /** La remise est-elle déclarée ? Commande aussi la fenêtre de validité. */
  remiseDeclaree: boolean;
}

export interface EntreePrix {
  /** Prix effectivement facturé, celui qu'affiche le bloc d'achat. */
  prixCourantCents: number;
  /** Prix barré : référence figée de campagne, ou ancien prix de la fiche. */
  prixReferenceCents: number;
  /**
   * La référence vient-elle d'une campagne datée ?
   *
   * C'est la seule question qui compte : elle seule distingue une promotion
   * d'un comparatif avec le prix conseillé du fabricant.
   */
  campagneDatee: boolean;
}

export function prixDuFlux({
  prixCourantCents,
  prixReferenceCents,
  campagneDatee,
}: EntreePrix): PrixFlux {
  // Une référence inférieure ou égale au prix pratiqué ne remise rien. Le cas
  // vient d'une saisie incohérente ; l'annoncer produirait une remise négative.
  const remiseDeclaree = campagneDatee && prixReferenceCents > prixCourantCents;

  return remiseDeclaree
    ? { priceCents: prixReferenceCents, salePriceCents: prixCourantCents, remiseDeclaree: true }
    : { priceCents: prixCourantCents, remiseDeclaree: false };
}
