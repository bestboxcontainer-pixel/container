import { getCategoryPages, type CategoryPageView } from "@/server/store";
import type { Product } from "@/types/home";

/**
 * Les catégories de la famille « container », telles qu'enregistrées en base.
 * Partagé entre la page d'accueil et ses maquettes de comparaison, pour ne
 * pas dupliquer la même requête trois fois.
 */
export async function categoriesDeLAccueil(): Promise<CategoryPageView[]> {
  try {
    const pages = await getCategoryPages();
    return pages.filter((page) => page.group === "container");
  } catch (error) {
    console.error("[accueil] catégories illisibles, section masquée", error);
    return [];
  }
}

/**
 * Extrait du catalogue pour la page d'accueil.
 *
 * Prélèvement à tour de rôle plutôt que les huit premiers : le catalogue est
 * trié par famille, et une simple troncature ne montrerait que des
 * Seecontainer. On fait donc un tour par famille avant d'en reprendre une.
 */
export async function extraitDuCatalogue(maximum = 8): Promise<Product[]> {
  let pages: Awaited<ReturnType<typeof getCategoryPages>>;
  try {
    pages = await getCategoryPages();
  } catch (error) {
    console.error("[accueil] catalogue illisible, section produits masquée", error);
    return [];
  }

  const files = pages.map((page) => [...page.products]).filter((file) => file.length > 0);

  const extrait: Product[] = [];
  for (let rang = 0; extrait.length < maximum; rang += 1) {
    const restantes = files.filter((file) => file.length > rang);
    if (restantes.length === 0) break;
    for (const file of restantes) {
      if (extrait.length >= maximum) break;
      extrait.push(file[rang]);
    }
  }

  return extrait;
}
