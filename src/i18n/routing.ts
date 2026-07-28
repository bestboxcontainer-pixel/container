import { defineRouting } from "next-intl/routing";

// L'allemand reste à la racine (/), l'anglais vit sous /en :
// les URL existantes ne changent pas et le référencement acquis est préservé.
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  // Pas de redirection d'après la langue du navigateur : « / » sert toujours
  // l'allemand. Sinon un robot d'indexation anglophone serait renvoyé vers /en
  // et la version allemande, celle qui porte le référencement, ne serait plus
  // explorée. Le changement de langue reste un choix explicite du visiteur.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};
