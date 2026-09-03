/**
 * Clé du chat de la boutique.
 *
 * Écrite ici plutôt que dans une variable d'environnement : c'est une valeur
 * publique par construction : elle figure dans le code d'installation que
 * Smartsupp destine au HTML de n'importe quel site, et part de toute façon dans
 * le navigateur de chaque visiteur. Rien à voir avec un jeton d'API, qui ouvre
 * l'accès aux conversations et n'a sa place ni dans un dépôt ni dans un bundle.
 *
 * Vérifiée le 10 août 2026 contre
 * `bootstrap.smartsuppchat.com/widget/<clé>.json` : réponse 200, compte non
 * bloqué, widget visible, aucune restriction de domaine. Une clé refusée y
 * répond 404 et le chat ne s'affiche jamais, quel que soit le code du bouton :
 * c'est la vérification à refaire avant de changer cette valeur.
 *
 * POURQUOI PLUS DE VARIABLE D'ENVIRONNEMENT. `NEXT_PUBLIC_SMARTSUPP_KEY` était
 * lue en priorité, pour brancher un autre compte sans toucher au code. Elle n'a
 * jamais servi à cela : elle a servi deux fois à recevoir un jeton d'API REST à
 * la place de la clé du widget, et à écraser silencieusement une valeur juste
 * par une valeur refusée. Le piège est double, la variable est `NEXT_PUBLIC_`,
 * donc figée dans le bundle à la compilation : la retirer de l'hébergeur puis
 * redémarrer ne change rien tant que le site n'est pas reconstruit, et l'on
 * cherche l'erreur là où elle n'est plus.
 *
 * DÉSACTIVÉ le 3 septembre 2026 : la clé précédente appartenait au compte
 * Smartsupp du site d'origine (Hausgeräte Pfeffer), pas à BBC Best Box
 * Containerhandel. En attente de la vraie clé du client avant de la remettre.
 *
 * Changer de compte se fait donc en changeant cette constante, sous revue, avec
 * la vérification ci-dessus. C'est une ligne de code pour un événement rare,
 * contre un mode de panne silencieux à chaque déploiement.
 *
 * POURQUOI CE FICHIER PLUTÔT QUE LE COMPOSANT. Trois endroits ont besoin de
 * savoir si un chat existe : le chat lui-même, le bandeau de consentement, qui
 * ne doit rien demander pour un service absent : et le lien « Cookie-
 * Einstellungen » du pied de page, qui n'aurait alors rien à rouvrir. Le
 * composant `SmartsuppChat` est un composant serveur : l'importer depuis le
 * bandeau, qui vit dans le navigateur, embarquerait `next-intl/server` avec lui.
 */
export const CLE_SMARTSUPP = "";

/** Vrai si un chat est joignable : décide du bandeau et du lien de réglages. */
export const CHAT_CONFIGURE = CLE_SMARTSUPP.length > 0;
