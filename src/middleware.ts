import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Le back-office, les API, le flux Merchant et les fichiers statiques
  // restent hors du routage multilingue.
  //
  // Les trois routes de campagne en font partie. Elles sont volontairement
  // courtes — un lien de message doit rester lisible et tenir sur une ligne —
  // et elles n'ont pas de version par langue : /c et /p ne renvoient qu'une
  // redirection ou une image, et /abmelden choisit sa langue d'après le
  // destinataire enregistré, pas d'après l'URL. Les laisser passer par le
  // routage multilingue les ferait réécrire en /de/c/... et casserait tous les
  // liens déjà partis dans les boîtes des clients.
  matcher: ["/((?!api|admin|feed|c/|p/|abmelden/|_next|_vercel|.*\\..*).*)"],
};
