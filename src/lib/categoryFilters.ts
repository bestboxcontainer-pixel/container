/**
 * Données des filtres de catégorie, hors de tout composant.
 *
 * Les tranches de prix et les seuils de note décrivent le catalogue, pas son
 * affichage : ils se testent seuls et ne dépendent d'aucun rendu. Ils vivaient
 * dans la colonne latérale, qui a laissé place à une barre horizontale.
 */

/** L'identifiant est stable et sert d'état ; le libellé vient de « category.priceRanges.<id> ». */
export interface PriceRange {
  id: string;
  min: number;
  max: number;
}

/**
 * Tranches calées sur le catalogue de conteneurs : il s'étale de 925 € à
 * 4.100 €, et des paliers à 100 € ou 1.000 € rangeraient tout dans la même
 * case. Elles restent ouvertes vers le haut pour les Sonderbauten.
 */
export const PRICE_RANGES: PriceRange[] = [
  { id: "under2500", min: 0, max: 2500 },
  { id: "from2500", min: 2500, max: 5000 },
  { id: "from5000", min: 5000, max: 10000 },
  { id: "from10000", min: 10000, max: 25000 },
  { id: "over25000", min: 25000, max: Infinity },
];

export const RATING_THRESHOLDS = [4.5, 4, 3];
