import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestbox-containerhandel.de";

/** L'allemand vit à la racine, l'anglais sous /en, voir src/i18n/routing.ts. */
function urlFor(locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}` || SITE_URL;
}

/** Chaque URL déclare ses équivalents dans l'autre langue (hreflang). */
function alternates(): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, urlFor(locale)]));
}

/** Chemins publics du site vitrine marketing (hors racine, ajoutée séparément). */
const PATHS = [
  "sortiment",
  "vermietung",
  "ueber-uns",
  "kontakt",
  "impressum",
  "datenschutz",
  "agb",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home = routing.locales.map((locale) => ({
    url: urlFor(locale),
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 1,
    alternates: { languages: alternates() },
  }));

  const pages = PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${urlFor(locale)}/${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [...home, ...pages];
}
