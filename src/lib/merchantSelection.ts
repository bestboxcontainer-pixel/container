/**
 * Choix des produits transmis au flux Google Merchant.
 *
 * Le flux est publié à une adresse fixe que Merchant Center vient relire selon
 * son propre calendrier. La sélection doit donc être enregistrée, et non tenue
 * dans l'écran : cocher des cases sans les conserver n'aurait aucun effet sur
 * ce que Google finit par lire.
 *
 * Elle s'exprime par catégorie, pas par produit. Cocher « Waschmaschinen »
 * vaut pour la catégorie entière, y compris les articles qui y entreront plus
 * tard — un produit ajouté au catalogue se diffuse alors sans qu'on ait à y
 * repenser. À l'intérieur d'une catégorie retenue, on peut écarter un article
 * précis : c'est la liste des exclusions.
 *
 * Tant que rien n'est enregistré, tout le catalogue part. La boutique qui n'a
 * jamais ouvert cet écran garde donc le comportement d'avant.
 *
 * Ce fichier ne contient que la logique, sans accès à la base : elle se teste
 * seule, et c'est elle qui décide ce que Google voit.
 */

/** Réglage tel qu'il est enregistré. */
export interface MerchantSelection {
  /**
   * Faux : toutes les catégories partent, `categoryIds` est ignoré.
   * Vrai : seules les catégories retenues partent.
   * Dans les deux cas les exclusions produit s'appliquent.
   */
  restricted: boolean;
  /** Identifiants des catégories retenues. */
  categoryIds: string[];
  /** Identifiants des produits écartés, quelles que soient les catégories. */
  excludedProductIds: string[];
}

/** Aucun réglage enregistré : le catalogue entier alimente le flux. */
export const MERCHANT_SELECTION_DEFAULT: MerchantSelection = {
  restricted: false,
  categoryIds: [],
  excludedProductIds: [],
};

/** Produit réduit à ce dont le filtre a besoin. */
export interface SelectableProduct {
  id: string;
  categoryId: string;
}

/**
 * Relit un réglage stocké en JSON. Toute valeur douteuse ramène au défaut :
 * un réglage illisible ne doit pas vider le flux — un catalogue absent de
 * Google coûte plus cher qu'un catalogue trop large.
 */
export function parseMerchantSelection(value: unknown): MerchantSelection {
  if (!value || typeof value !== "object") return { ...MERCHANT_SELECTION_DEFAULT };

  const raw = value as Record<string, unknown>;
  const ids = (entry: unknown): string[] =>
    Array.isArray(entry)
      ? [...new Set(entry.filter((item): item is string => typeof item === "string" && item.trim() !== ""))]
      : [];

  const categoryIds = ids(raw.categoryIds);

  // « restreint » sans aucune catégorie viderait le flux. Le cas vient d'un
  // enregistrement fait sans rien cocher : on retombe sur le catalogue entier
  // plutôt que de retirer silencieusement la boutique de Google.
  const restricted = raw.restricted === true && categoryIds.length > 0;

  return {
    restricted,
    categoryIds,
    excludedProductIds: ids(raw.excludedProductIds),
  };
}

/**
 * Vrai si ce produit doit figurer dans le flux.
 *
 * Les deux réglages sont indépendants : `restricted` limite aux catégories
 * retenues, la liste d'exclusions écarte des articles précis. Un article
 * décoché sort du flux même quand tout le catalogue part — c'est le geste le
 * plus courant du back-office, et le compteur affiché à l'écran l'a toujours
 * compté ainsi.
 */
export function isInFeed(product: SelectableProduct, selection: MerchantSelection): boolean {
  if (selection.excludedProductIds.includes(product.id)) return false;
  if (!selection.restricted) return true;
  return selection.categoryIds.includes(product.categoryId);
}

/** Applique la sélection à une liste de produits. */
export function filterForFeed<T extends SelectableProduct>(
  products: T[],
  selection: MerchantSelection,
): T[] {
  if (!selection.restricted && selection.excludedProductIds.length === 0) return products;
  return products.filter((product) => isInFeed(product, selection));
}

/** Saisie de l'écran d'administration, avant contrôle. */
export interface MerchantSelectionInput {
  restricted?: unknown;
  categoryIds?: unknown;
  excludedProductIds?: unknown;
}

/**
 * Contrôle la saisie du back-office. Les identifiants inconnus sont écartés
 * plutôt que refusés : une catégorie supprimée entre l'affichage de l'écran et
 * l'enregistrement ne doit pas faire échouer la sauvegarde entière.
 */
export function parseMerchantSelectionInput(
  input: MerchantSelectionInput,
  known: { categoryIds: string[]; productIds: string[] },
): { ok: true; value: MerchantSelection } | { ok: false; error: string } {
  const brut = parseMerchantSelection({
    restricted: input.restricted,
    categoryIds: input.categoryIds,
    excludedProductIds: input.excludedProductIds,
  });

  const categoriesConnues = new Set(known.categoryIds);
  const produitsConnus = new Set(known.productIds);

  const categoryIds = brut.categoryIds.filter((id) => categoriesConnues.has(id));
  const excludedProductIds = brut.excludedProductIds.filter((id) => produitsConnus.has(id));

  // Restreindre à zéro catégorie retirerait la boutique de Google d'un clic,
  // sans que l'écran l'ait annoncé. On refuse et on le dit.
  if (input.restricted === true && categoryIds.length === 0) {
    return {
      ok: false,
      error: "Aucune catégorie retenue : le flux serait vide. Cochez au moins une catégorie, ou laissez tout le catalogue.",
    };
  }

  return { ok: true, value: { restricted: categoryIds.length > 0 && brut.restricted, categoryIds, excludedProductIds } };
}
