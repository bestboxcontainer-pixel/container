import { getLocale } from "next-intl/server";
import { SmartsuppLauncher } from "@/components/SmartsuppLauncher";

/**
 * Chat en direct Smartsupp, en bas à droite de la boutique.
 *
 * Rien n'est rendu tant que la clé n'est pas fournie via
 * NEXT_PUBLIC_SMARTSUPP_KEY : pas de bouton mort en développement, activation
 * par simple variable d'environnement en production. Attention, c'est une
 * variable `NEXT_PUBLIC_` : elle est figée dans le bundle à la compilation, un
 * redémarrage sans reconstruction ne la prend pas en compte.
 *
 * La clé se trouve dans le tableau de bord Smartsupp, rubrique « Paramètres →
 * Chat box → Code d'installation » (valeur après `_smartsupp.key`). Ce n'est
 * pas le jeton de l'API REST, qui donne accès aux conversations et ne doit
 * jamais atteindre le navigateur.
 *
 * Ce composant ne fait que résoudre la langue et le libellé côté serveur ; le
 * chargement effectif, déclenché par le visiteur, est dans `SmartsuppLauncher`.
 *
 * Les libellés sont passés en propriété plutôt que lus dans les fichiers de
 * messages : deux chaînes ne justifient pas d'élargir le dictionnaire.
 */
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
 * bloqué, widget visible, aucune restriction de domaine.
 *
 * `NEXT_PUBLIC_SMARTSUPP_KEY` reste prioritaire, pour brancher un autre compte
 * sans toucher au code.
 */
const CLE_PAR_DEFAUT = "68f9f508d7291022372070e0ba6f68bb963ad5f6";

export async function SmartsuppChat() {
  const key = process.env.NEXT_PUBLIC_SMARTSUPP_KEY || CLE_PAR_DEFAUT;
  if (!key) return null;

  const locale = await getLocale();
  // Le tableau de bord Smartsupp n'attend que le code court de la langue.
  const language = locale === "en" ? "en" : "de";
  const label = locale === "en" ? "Chat with us" : "Schreiben Sie uns";

  return <SmartsuppLauncher chatKey={key} language={language} label={label} />;
}
