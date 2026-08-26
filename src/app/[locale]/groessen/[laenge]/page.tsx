import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "@/i18n/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { metresDepuisSlug, produitsDeLaTaille, TOLERANCE_METRES } from "@/lib/containerSize";
import { HOME_SIZE_GROUPS } from "@/lib/homeSections";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getCategoryPages } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPage } from "@/server/localizedContent";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/home";

type SizePageParams = Promise<{ locale: Locale; laenge: string }>;

/** Les tailles proposées sont celles de la section « Größenvielfalt ». */
const TAILLES = HOME_SIZE_GROUPS[0].options.map((option) => option.label);

export const dynamicParams = false;

export function generateStaticParams() {
  return TAILLES.map((laenge) => ({ laenge }));
}

/**
 * Catalogue complet, toutes familles confondues : une taille traverse les
 * familles, un 6 m peut être un bureau comme un conteneur maritime.
 */
async function catalogueComplet(locale: Locale): Promise<Product[]> {
  try {
    const [pages, translations] = await Promise.all([
      getCategoryPages(),
      loadCatalogTranslations(locale),
    ]);
    return pages.flatMap((page) => [...localizeCategoryPage(page, translations).products]);
  } catch (error) {
    console.error("[tailles] catalogue illisible", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: SizePageParams }): Promise<Metadata> {
  const { locale, laenge } = await params;
  const metres = metresDepuisSlug(laenge);
  if (metres === null) return {};

  const t = await getTranslations({ locale, namespace: "sizes" });
  const title = t("metaTitle", { size: metres });
  const description = t("metaDescription", { size: metres });

  return {
    title,
    description,
    alternates: alternatesFor(`/groessen/${laenge}`, locale),
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl(`/groessen/${laenge}`, locale),
      locale,
    }),
  };
}

export default async function SizePage({ params }: { params: SizePageParams }) {
  const { locale, laenge } = await params;
  setRequestLocale(locale);

  const metres = metresDepuisSlug(laenge);
  if (metres === null || !TAILLES.includes(laenge)) {
    notFound();
  }

  const [t, common] = await Promise.all([
    getTranslations("sizes"),
    getTranslations("common"),
  ]);

  const produits = produitsDeLaTaille(await catalogueComplet(locale), metres);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: common("home"), href: "/" },
                { label: t("breadcrumb"), href: "/container-masse" },
                { label: t("heading", { size: metres }) },
              ]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-8">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t("heading", { size: metres })}
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            {t("intro", { size: metres, count: produits.length })}
          </p>

          {produits.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produits.map((produit) => (
                <ProductCard key={produit.slug ?? produit.name} product={produit} />
              ))}
            </div>
          ) : (
            /* Une taille figure au catalogue général sans être en stock : mieux
               vaut le dire et renvoyer vers le sortiment que laisser une page
               vide. */
            <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-semibold text-foreground">{t("emptyTitle", { size: metres })}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p>
              <Link
                href="/container"
                className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
              >
                {t("emptyLink")}
              </Link>
            </div>
          )}

          {/* La tolérance n'est pas un détail : un 20 pieds mesure 6,10 m et
              figure ici sous 6 m. Le taire ferait passer la liste pour fausse. */}
          {produits.length > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              {t("tolerance", { tolerance: TOLERANCE_METRES * 100 })}
            </p>
          )}
        </div>
      </main>
      <Footer />

      <BreadcrumbJsonLd
        items={[
          { label: common("home"), href: "/" },
          { label: t("breadcrumb"), href: "/container-masse" },
          { label: t("heading", { size: metres }) },
        ]}
      />
      {produits.length > 0 && (
        <ItemListJsonLd
          items={produits.map((produit) => ({
            name: `${produit.brand} ${produit.name}`,
            url: localizedUrl(produit.href, locale),
          }))}
        />
      )}
    </>
  );
}
