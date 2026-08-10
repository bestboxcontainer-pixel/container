"use client";

import { ouvrirReglagesConsentement } from "@/lib/consent";

/**
 * « Cookie-Einstellungen » dans le pied de page.
 *
 * Rouvre le bandeau pour revenir sur un choix déjà fait. C'est l'article 7
 * alinéa 3 RGPD : retirer son accord doit être aussi facile que de le donner —
 * sans ce lien, un « Akzeptieren » serait définitif, ce qui invaliderait le
 * consentement lui-même.
 *
 * Un bouton, pas un lien : il n'y a pas de page derrière, seulement une action.
 * Il prend l'allure des autres entrées du pied de page pour ne pas dénoter.
 */
export function ConsentSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" onClick={ouvrirReglagesConsentement} className="hover:underline">
      {label}
    </button>
  );
}
