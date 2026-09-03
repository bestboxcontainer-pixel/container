// Correspondance entre les catégories de la boutique et la taxonomie officielle
// Google (version 2021-09-21, fichier taxonomy-with-ids.fr-FR.txt).
//
// Ce module ne dépend ni de Prisma ni du serveur : il est utilisable aussi bien
// dans le flux produits que dans les composants du back-office.

export interface GoogleCategory {
  /** Identifiant numérique : recommandé par Google, indépendant de la langue. */
  id: string;
  /** Chemin complet traduit, pour l'affichage dans le back-office. */
  path: string;
}

/**
 * Google ne propose aucune sous-catégorie dédiée par usage de container
 * (bureau, sanitaire, stockage…) : toutes nos catégories pointent donc vers
 * la même entrée officielle, la plus proche de notre activité réelle.
 */
const SHIPPING_CONTAINERS: GoogleCategory = {
  id: "5831",
  path: "Entreprise et industrie > Stockage industriel > Conteneurs",
};

export const GOOGLE_CATEGORY_BY_SLUG: Record<string, GoogleCategory> = {
  seecontainer: SHIPPING_CONTAINERS,
  lagercontainer: SHIPPING_CONTAINERS,
  buerocontainer: SHIPPING_CONTAINERS,
  sanitaercontainer: SHIPPING_CONTAINERS,
  sondercontainer: SHIPPING_CONTAINERS,
};

/** Retrouve le chemin lisible d'un identifiant de catégorie Google. */
export function googleCategoryPath(id: string): string | undefined {
  return Object.values(GOOGLE_CATEGORY_BY_SLUG).find((entry) => entry.id === id)?.path;
}

/**
 * Catégories rattachées à « Bekleidung & Accessoires » : Google y exige
 * age_group, gender, color et size pour l'Allemagne. Aucune de nos catégories
 * de containers n'en relève.
 */
export const APPAREL_CATEGORY_IDS = new Set<string>([]);

/**
 * Catégories soumises à l'étiquette énergie européenne (electroménager,
 * climatiseurs, téléviseurs…). Un container n'est pas un appareil couvert par
 * le règlement énergie UE : aucune de nos catégories n'y figure.
 */
export const EU_ENERGY_LABEL_SLUGS = new Set<string>([]);
