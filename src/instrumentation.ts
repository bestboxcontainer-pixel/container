/**
 * Point d'entrée appelé une fois au démarrage de chaque instance du serveur
 * Next. Le fichier vit dans src/ parce que le projet utilise un dossier src —
 * voir node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
 *
 * La documentation précise que `register` doit se terminer avant que le serveur
 * accepte des requêtes : on démarre donc l'intervalle et on rend la main
 * aussitôt, sans jamais attendre un tick.
 */

export function register(): void {
  // Le fichier est aussi chargé dans le runtime Edge, où setInterval et Prisma
  // n'ont pas leur place.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import différé : charger le planificateur — et donc Prisma — au niveau du
  // module ferait échouer la compilation du bundle Edge.
  void import("@/server/scheduler").then(({ startScheduler }) => startScheduler());
}
