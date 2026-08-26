import type { Product } from "@/types/home";

/**
 * Longueur d'un container, déduite de son libellé.
 *
 * Le catalogue ne porte pas de champ de cote : les dimensions vivent dans le
 * nom (« Bürocontainer 6,00 x 2,44 ») et dans les caractéristiques. On les en
 * extrait plutôt que de les ressaisir, pour qu'une fiche corrigée à l'import
 * reste juste ici sans double saisie.
 */

const PIED_EN_METRES = 0.3048;

/** « 6,00 x 2,44 m » ou « 6.00 × 2.44 » : la première valeur est la longueur. */
const COTE = /(\d{1,2})[,.](\d{2})\s*[x×]/;

/** « 20 Fuß », « 40-Fuß » : mesure usuelle des conteneurs maritimes. */
const PIEDS = /(\d{1,2})\s*[-\s]?Fuß/i;

/**
 * Tolérance de rapprochement, en mètres.
 *
 * Un 20 pieds mesure 6,10 m et se range avec les 6 m ; un 10 pieds mesure
 * 3,05 m et se range avec les 3 m. Au-delà de 30 cm, deux tailles distinctes
 * se confondraient.
 */
export const TOLERANCE_METRES = 0.3;

/** Longueur en mètres, ou null si le libellé n'en porte aucune. */
export function longueurEnMetres(texte: string): number | null {
  const cote = COTE.exec(texte);
  if (cote) {
    return Number.parseFloat(`${cote[1]}.${cote[2]}`);
  }

  const pieds = PIEDS.exec(texte);
  if (pieds) {
    return Math.round(Number.parseInt(pieds[1], 10) * PIED_EN_METRES * 100) / 100;
  }

  return null;
}

/** Longueur d'une fiche : le nom d'abord, ses caractéristiques ensuite. */
export function longueurDuProduit(produit: Product): number | null {
  return longueurEnMetres([produit.name, ...(produit.bullets ?? [])].join(" "));
}

/** « 6m » -> 6. Les libellés de la section des tailles servent d'identifiants. */
export function metresDepuisSlug(slug: string): number | null {
  const trouve = /^(\d{1,2})m$/.exec(slug);
  return trouve ? Number.parseInt(trouve[1], 10) : null;
}

/** Identifiant d'URL d'une taille : « 6m » pour 6 mètres. */
export function slugDeTaille(metres: number): string {
  return `${Math.round(metres)}m`;
}

/** La fiche relève-t-elle de cette taille, à la tolérance près ? */
export function correspondALaTaille(produit: Product, metres: number): boolean {
  const longueur = longueurDuProduit(produit);
  return longueur !== null && Math.abs(longueur - metres) <= TOLERANCE_METRES;
}

/** Fiches de cette taille, dans l'ordre reçu. */
export function produitsDeLaTaille(produits: readonly Product[], metres: number): Product[] {
  return produits.filter((produit) => correspondALaTaille(produit, metres));
}

/**
 * Nombre de fiches par taille, indexé par identifiant d'URL.
 *
 * Sert à ne rendre cliquables que les tailles réellement en stock : un lien
 * vers une liste vide est pire que pas de lien.
 */
export function compterParTaille(
  produits: readonly Product[],
  tailles: readonly string[],
): Map<string, number> {
  const comptes = new Map<string, number>();

  for (const taille of tailles) {
    const metres = metresDepuisSlug(taille);
    comptes.set(taille, metres === null ? 0 : produitsDeLaTaille(produits, metres).length);
  }

  return comptes;
}
