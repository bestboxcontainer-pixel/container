/**
 * Tâches périodiques de la boutique.
 *
 * L'hébergement ne fournit pas de cron système : le rythme vit donc dans le
 * processus Node lui-même. Cela suppose un serveur qui tourne en continu
 * (`next dev`, `next start`) : c'est le cas sur l'hébergement actuel. En
 * serverless, l'intervalle ne se déclencherait pas et il faudrait appeler
 * /api/cron/recovery depuis l'extérieur ; la route existe pour cela.
 *
 * Ce module est le point d'entrée unique : un futur chantier de campagnes
 * automatisées y branchera son propre répartiteur, sans second intervalle.
 */

import { RECOVERY_TICK_MS } from "@/lib/checkoutRecovery";
import { runRecoveryTick } from "@/server/checkoutRecovery";

// Le rechargement à chaud réexécute les modules : sans ce drapeau, chaque
// enregistrement de fichier ajouterait un intervalle de plus. Même protection
// que celle du client Prisma dans src/server/prisma.ts.
const globalForScheduler = globalThis as unknown as { schedulerStarted?: boolean };

export function startScheduler(): void {
  if (globalForScheduler.schedulerStarted) return;
  globalForScheduler.schedulerStarted = true;

  setInterval(() => {
    void runRecoveryTick().catch((error) => {
      // Une erreur avalée ici, sinon un rejet non traité arrêterait le
      // processus et donc la boutique entière.
      console.error("[scheduler] tick de relance en échec:", error);
    });
  }, RECOVERY_TICK_MS);

  console.log(`[scheduler] relance des paniers active, tick de ${RECOVERY_TICK_MS / 1000} s`);
}
