import { getCategoryPages } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPages } from "@/server/localizedContent";
import type { Product } from "@/types/home";
import type { Locale } from "@/i18n/routing";

/**
 * Recherche dans le catalogue.
 *
 * Le tri se fait en mémoire sur le catalogue déjà chargé, et non par une
 * requête SQL. Trois raisons : le catalogue tient en quelques centaines de
 * fiches, les prix promotionnels des campagnes sont déjà appliqués à ce
 * stade (une requête directe les ignorerait et afficherait des prix faux),
 * et la recherche porte sur les textes traduits, qui ne vivent pas dans les
 * colonnes interrogées.
 */

export interface SearchHit {
  product: Product;
  categoryLabel: string;
  categoryHref: string;
}

/** Découpe la saisie en termes, sans les accents ni la casse. */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Score d'un produit pour un terme donné, ou 0 s'il ne correspond pas.
 *
 * La marque et le nom pèsent plus lourd que la description : qui tape
 * « Bosch » cherche la marque, pas les fiches qui la citent en passant.
 */
function score(champs: { marque: string; nom: string; reste: string }, terme: string): number {
  if (champs.marque.includes(terme)) return 6;
  if (champs.nom.includes(terme)) return 4;
  if (champs.reste.includes(terme)) return 1;
  return 0;
}

export async function searchProducts(query: string, locale: Locale): Promise<SearchHit[]> {
  const termes = normaliser(query).split(" ").filter((t) => t.length >= 2);
  if (termes.length === 0) return [];

  const [pages, translations] = await Promise.all([
    getCategoryPages(),
    loadCatalogTranslations(locale),
  ]);

  const resultats: { hit: SearchHit; points: number }[] = [];

  for (const page of localizeCategoryPages(pages, translations)) {
    for (const product of page.products) {
      const champs = {
        marque: normaliser(product.brand),
        nom: normaliser(product.name),
        reste: normaliser(
          [product.shortDescription, product.description, product.sku, page.label]
            .filter(Boolean)
            .join(" "),
        ),
      };

      // Tous les termes doivent correspondre : « bosch waschmaschine » ne doit
      // pas ramener toute la marque, ni tous les lave-linge.
      let points = 0;
      for (const terme of termes) {
        const gagnes = score(champs, terme);
        if (gagnes === 0) {
          points = 0;
          break;
        }
        points += gagnes;
      }

      if (points > 0) {
        resultats.push({
          points,
          hit: {
            product,
            categoryLabel: page.label,
            categoryHref: `/${page.group}/${page.slug}`,
          },
        });
      }
    }
  }

  return resultats
    .sort((a, b) => b.points - a.points || a.hit.product.name.localeCompare(b.hit.product.name))
    .map((entree) => entree.hit);
}
