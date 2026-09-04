import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getCategoryPages } from "@/server/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestboxcontainer.de";

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
  "vermietung",
  "ueber-uns",
  "kontakt",
  "impressum",
  "datenschutz",
  "agb",
] as const;

/**
 * Le catalogue n'y figurait pas : le plan de site ne déclarait que les pages
 * vitrine, laissant les catégories et les fiches produit à la seule découverte
 * par les liens. Elles sont lues en base, donc toujours à jour.
 *
 * Une base injoignable ne doit pas faire tomber le plan de site : les pages
 * vitrine restent servies, sans le catalogue.
 */
async function urlsDuCatalogue(now: Date): Promise<MetadataRoute.Sitemap> {
  let pages: Awaited<ReturnType<typeof getCategoryPages>>;
  try {
    pages = await getCategoryPages();
  } catch (error) {
    console.error("[sitemap] catalogue illisible, seules les pages vitrine sont déclarées", error);
    return [];
  }

  const groupes = [...new Set(pages.map((page) => page.group))];

  const entrees = (chemin: string, priority: number, changeFrequency: "weekly" | "monthly") =>
    routing.locales.map((locale) => ({
      url: `${urlFor(locale)}${chemin}`,
      lastModified: now,
      changeFrequency,
      priority,
    }));

  return [
    ...groupes.flatMap((groupe) => entrees(`/${groupe}`, 0.9, "weekly")),
    ...pages.flatMap((page) => entrees(`/${page.group}/${page.slug}`, 0.8, "weekly")),
    ...pages.flatMap((page) =>
      page.products.flatMap((produit) =>
        entrees(`/${page.group}/${page.slug}/${produit.slug}`, 0.6, "monthly"),
      ),
    ),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  return [...home, ...pages, ...(await urlsDuCatalogue(now))];
}
