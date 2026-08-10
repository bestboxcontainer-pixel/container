/**
 * Clé du chat de la boutique.
 *
 * Écrite ici plutôt que laissée à la seule variable d'environnement : c'est une
 * valeur publique par construction — elle figure dans le code d'installation que
 * Smartsupp destine au HTML de n'importe quel site, et part de toute façon dans
 * le navigateur de chaque visiteur. Rien à voir avec un jeton d'API, qui ouvre
 * l'accès aux conversations et n'a sa place ni dans un dépôt ni dans un bundle.
 *
 * Vérifiée le 8 août 2026 contre
 * `bootstrap.smartsuppchat.com/widget/<clé>.json` : réponse 200, compte non
 * bloqué, widget visible, aucune restriction de domaine. Une clé refusée y
 * répond 404 et le chat ne s'affiche jamais, quel que soit le code du bouton :
 * c'est la vérification à refaire avant de changer cette valeur.
 *
 * `NEXT_PUBLIC_SMARTSUPP_KEY` reste prioritaire, pour brancher un autre compte
 * sans toucher au code.
 *
 * POURQUOI CE FICHIER PLUTÔT QUE LE COMPOSANT. Trois endroits ont besoin de
 * savoir si un chat existe : le chat lui-même, le bandeau de consentement — qui
 * ne doit rien demander pour un service absent — et le lien « Cookie-
 * Einstellungen » du pied de page, qui n'aurait alors rien à rouvrir. Le
 * composant `SmartsuppChat` est un composant serveur : l'importer depuis le
 * bandeau, qui vit dans le navigateur, embarquerait `next-intl/server` avec lui.
 */

const CLE_PAR_DEFAUT = "68f9f508d7291022372070e0ba6f68bb963ad5f6";

export const CLE_SMARTSUPP = process.env.NEXT_PUBLIC_SMARTSUPP_KEY || CLE_PAR_DEFAUT;

/** Vrai si un chat est joignable — décide du bandeau et du lien de réglages. */
export const CHAT_CONFIGURE = CLE_SMARTSUPP.length > 0;
