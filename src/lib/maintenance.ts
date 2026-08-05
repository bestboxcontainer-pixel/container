/**
 * Mode maintenance.
 *
 * Tant qu'il est actif, la boutique répond une page d'attente en 503 à tout le
 * monde — sauf au back-office, qui reste ouvert pour se connecter, et à
 * l'administrateur déjà connecté, qui voit le site normalement et peut donc le
 * vérifier de bout en bout avant de l'ouvrir.
 *
 * L'interrupteur est une variable d'environnement et non un réglage en base :
 * on coupe souvent le site précisément parce que la base est en travaux, et une
 * page de maintenance qui dépend de la base ne s'afficherait pas ce jour-là.
 * Contrepartie assumée : changer la variable demande un redémarrage de
 * l'application.
 */

/** Valeurs qui ferment la boutique, au cas où l'hébergeur normalise la saisie. */
const VALEURS_FERMEES = new Set(["1", "true", "on", "yes"]);

/**
 * La boutique est ouverte **par défaut**, en production comme en développement.
 * Seul un `MAINTENANCE_MODE` explicitement positionné à 1 la ferme.
 *
 * Le sens inverse a été retenu à l'origine — fermer tant qu'on n'a pas demandé
 * l'ouverture — pour qu'une variable oubliée laisse le catalogue inachevé hors
 * de vue. La boutique étant désormais en ligne, cette prudence coûtait plus
 * qu'elle ne protégeait : chaque redéploiement, chaque migration d'hébergeur
 * refermait le site tant que la variable n'était pas ressaisie. Contrepartie
 * assumée : une variable perdue laisse maintenant la boutique ouverte.
 */
export function maintenanceActive(): boolean {
  const valeur = (process.env.MAINTENANCE_MODE ?? "").trim().toLowerCase();

  return VALEURS_FERMEES.has(valeur);
}

/**
 * Chemins qui restent joignables pendant la maintenance.
 *
 * `/admin` en fait partie sans condition : c'est la porte d'entrée, et exiger
 * une session pour l'atteindre enfermerait dehors la personne qui vient
 * justement se connecter.
 *
 * `/api/admin` suit, sinon le formulaire de connexion ne pourrait rien poster.
 * `/api/cron` reste ouvert car il porte déjà son propre secret et qu'une
 * campagne programmée n'a pas à être perdue parce que la vitrine est fermée.
 */
export function cheminToujoursAutorise(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/cron/")
  );
}

/**
 * Les requêtes de données attendent du JSON : leur renvoyer la page HTML
 * d'attente produirait une erreur d'analyse illisible côté navigateur.
 */
export function attendUneReponseJson(pathname: string): boolean {
  return pathname.startsWith("/api/");
}
