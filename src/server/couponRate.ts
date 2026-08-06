/**
 * Limitation des essais de codes de réduction.
 *
 * Sans elle, l'écran de vérification devient un banc d'essai : on y enchaîne
 * les codes jusqu'à en trouver un qui répond « ok ». Les codes courts et
 * devinables — SOMMER20, WELCOME10 — tombent en quelques minutes.
 *
 * Le compteur vit en mémoire, comme celui des connexions administrateur : un
 * redémarrage le remet à zéro, ce qui est acceptable pour ralentir une
 * exploration sans monter une table de plus.
 */

const FENETRE_MS = 60_000;
const ESSAIS_PAR_FENETRE = 10;

interface Compteur {
  essais: number;
  depuis: number;
}

const compteurs = new Map<string, Compteur>();

/** Purge les compteurs échus, pour que la carte ne grossisse pas sans fin. */
function nettoyer(maintenant: number): void {
  for (const [cle, compteur] of compteurs) {
    if (maintenant - compteur.depuis > FENETRE_MS) compteurs.delete(cle);
  }
}

/**
 * Enregistre un essai et dit s'il est permis.
 *
 * La clé est l'empreinte de l'appelant — adresse IP pour un visiteur non
 * identifié. Elle n'est jamais journalisée telle quelle.
 */
export function checkCouponRate(cle: string): { allowed: boolean; retryAfterSeconds: number } {
  const maintenant = Date.now();
  nettoyer(maintenant);

  const compteur = compteurs.get(cle);
  if (!compteur || maintenant - compteur.depuis > FENETRE_MS) {
    compteurs.set(cle, { essais: 1, depuis: maintenant });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  compteur.essais += 1;
  if (compteur.essais > ESSAIS_PAR_FENETRE) {
    const reste = Math.ceil((FENETRE_MS - (maintenant - compteur.depuis)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, reste) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
