import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidation du catalogue.
 *
 * Deux lectures ramènent le catalogue entier : `getCategoryPages()` et les
 * traductions anglaises : et presque chaque page de la boutique en dépend.
 * Sans cache, le build les rejouait pour chacune des 919 pages : quinze
 * secondes par appel contre la base Neon, soit des heures de requêtes pour lire
 * 392 fois la même chose. Le build dépassait le délai de soixante secondes par
 * page et s'arrêtait.
 *
 * Elles sont donc mises en cache sous ce tag, et toute écriture du back-office
 * doit le purger : sans ça, un prix modifié ne s'afficherait jamais.
 */
export const TAG_CATALOGUE = "catalogue";

/**
 * Purge le catalogue après une écriture.
 *
 * `revalidatePath("/", "layout")` seul ne suffit pas : il vide le rendu des
 * pages, pas les entrées `unstable_cache`, qui ne se purgent que par tag. Les
 * deux sont donc appelés ensemble : l'un pour le HTML, l'autre pour les données
 * qui l'alimentent.
 *
 * `expire: 0` plutôt que le profil « max » : ce dernier sert la version périmée
 * pendant qu'il recharge en arrière-plan, et l'administrateur qui vient
 * d'enregistrer un prix reverrait l'ancien. Ici l'écriture doit être relue
 * immédiatement, quitte à payer un rechargement bloquant, c'est une action
 * manuelle et rare, pas un trafic de visiteurs.
 *
 * À n'appeler que depuis une Route Handler ou une Server Action. `updateTag`,
 * qui aurait la même sémantique, est réservé aux Server Actions, or toutes les
 * écritures du back-office passent ici par des Route Handlers.
 */
export function invaliderCatalogue(): void {
  revalidateTag(TAG_CATALOGUE, { expire: 0 });
  revalidatePath("/", "layout");
}
