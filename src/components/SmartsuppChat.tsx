import { getLocale } from "next-intl/server";
import { SmartsuppLauncher } from "@/components/SmartsuppLauncher";
import { CLE_SMARTSUPP } from "@/lib/smartsupp";

/**
 * Chat en direct Smartsupp, en bas à droite de la boutique.
 *
 * La clé vit dans `@/lib/smartsupp`, qui dit pourquoi elle est écrite dans le
 * code et comment la vérifier avant d'en changer. Le bandeau de consentement et
 * le pied de page la lisent au même endroit.
 *
 * Ce composant ne fait que résoudre la langue et le libellé côté serveur ; le
 * chargement effectif est dans `SmartsuppLauncher` — automatique après accord au
 * bandeau, au clic sinon.
 *
 * Les libellés sont passés en propriété plutôt que lus dans les fichiers de
 * messages : deux chaînes ne justifient pas d'élargir le dictionnaire.
 */
export async function SmartsuppChat() {
  const key = CLE_SMARTSUPP;
  if (!key) return null;

  const locale = await getLocale();
  // Le tableau de bord Smartsupp n'attend que le code court de la langue.
  const language = locale === "en" ? "en" : "de";
  const label = locale === "en" ? "Chat with us" : "Schreiben Sie uns";

  return <SmartsuppLauncher chatKey={key} language={language} label={label} />;
}
