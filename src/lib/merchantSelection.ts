/**
 * Choix des produits transmis au flux Google Merchant.
 *
 * Le flux est publié à une adresse fixe que Merchant Center vient relire selon
 * son propre calendrier. La sélection doit donc être enregistrée, et non tenue
 * dans l'écran : cocher des cases sans les conserver n'aurait aucun effet sur
 * ce que Google finit par lire.
 *
 * Elle s'exprime produit par produit : cocher un article l'ajoute au flux,
 * indépendamment de sa catégorie. Contrepartie de ce choix : un produit ajouté
 * plus tard au catalogue ne part pas tout seul, il faut revenir cocher la case.
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
   * Faux : tout le catalogue actif part, `includedProductIds` est ignoré.
   * Vrai : seuls les produits retenus partent.
   */
  restricted: boolean;
  /** Identifiants des produits retenus. */
  includedProductIds: string[];
}

/** Aucun réglage enregistré : le catalogue entier alimente le flux. */
export const MERCHANT_SELECTION_DEFAULT: MerchantSelection = {
  restricted: false,
  includedProductIds: [],
};

/** Produit réduit à ce dont le filtre a besoin. */
export interface SelectableProduct {
  id: string;
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

  const includedProductIds = ids(raw.includedProductIds);

  // « restreint » sans aucun produit viderait le flux. Le cas vient d'un
  // enregistrement fait sans rien cocher : on retombe sur le catalogue entier
  // plutôt que de retirer silencieusement la boutique de Google.
  const restricted = raw.restricted === true && includedProductIds.length > 0;

  return { restricted, includedProductIds };
}

/**
 * Vrai si ce produit doit figurer dans le flux.
 */
export function isInFeed(product: SelectableProduct, selection: MerchantSelection): boolean {
  if (!selection.restricted) return true;
  return selection.includedProductIds.includes(product.id);
}

/** Applique la sélection à une liste de produits. */
export function filterForFeed<T extends SelectableProduct>(
  products: T[],
  selection: MerchantSelection,
): T[] {
  if (!selection.restricted) return products;
  return products.filter((product) => isInFeed(product, selection));
}

/** Saisie de l'écran d'administration, avant contrôle. */
export interface MerchantSelectionInput {
  restricted?: unknown;
  includedProductIds?: unknown;
}

/**
 * Contrôle la saisie du back-office. Les identifiants inconnus sont écartés
 * plutôt que refusés : un produit supprimé entre l'affichage de l'écran et
 * l'enregistrement ne doit pas faire échouer la sauvegarde entière.
 */
export function parseMerchantSelectionInput(
  input: MerchantSelectionInput,
  known: { productIds: string[] },
): { ok: true; value: MerchantSelection } | { ok: false; error: string } {
  const brut = parseMerchantSelection({
    restricted: input.restricted,
    includedProductIds: input.includedProductIds,
  });

  const produitsConnus = new Set(known.productIds);
  const includedProductIds = brut.includedProductIds.filter((id) => produitsConnus.has(id));

  // Restreindre à zéro produit retirerait la boutique de Google d'un clic,
  // sans que l'écran l'ait annoncé. On refuse et on le dit.
  if (input.restricted === true && includedProductIds.length === 0) {
    return {
      ok: false,
      error: "Aucun produit retenu : le flux serait vide. Cochez au moins un produit, ou laissez tout le catalogue.",
    };
  }

  return {
    ok: true,
    value: { restricted: includedProductIds.length > 0 && brut.restricted, includedProductIds },
  };
}
