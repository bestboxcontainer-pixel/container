import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryProductBrowser } from "@/components/CategoryProductBrowser";
import { CategoryGuide } from "@/components/CategoryGuide";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getCategoryPage, listCategories } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPage } from "@/server/localizedContent";
import type { Locale } from "@/i18n/routing";

type CategoryPageParams = Promise<{ locale: Locale; group: string; category: string }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ group: category.group, category: category.slug }));
}

/** Charge la catégorie puis lui applique la traduction demandée. */
async function loadLocalizedCategory(locale: Locale, group: string, category: string) {
  const [data, translations] = await Promise.all([
    getCategoryPage(group, category),
    loadCatalogTranslations(locale),
  ]);
  return data ? localizeCategoryPage(data, translations) : undefined;
}

export async function generateMetadata({ params }: { params: CategoryPageParams }): Promise<Metadata> {
  const { locale, group, category } = await params;
  const data = await loadLocalizedCategory(locale, group, category);
  if (!data) return {};

  const t = await getTranslations({ locale, namespace: "category" });
  const title = t("metaTitle", { label: data.label });
  const description = data.description;
  // Une vraie photo de produit vend mieux la catégorie qu'un logo générique.
  const image = data.products[0]?.image;

  return {
    title,
    description,
    alternates: alternatesFor(`/${group}/${category}`, locale),
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl(`/${group}/${category}`, locale),
      locale,
      image,
    }),
  };
}

export default async function CategoryPage({ params }: { params: CategoryPageParams }) {
  const { locale, group, category } = await params;
  setRequestLocale(locale);

  const data = await loadLocalizedCategory(locale, group, category);

  if (!data) {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: t("home"), href: "/" },
                { label: data.groupLabel, href: `/${data.group}` },
                { label: data.label },
              ]}
            />
          </div>
        </div>

        <div id="produkte" className="mx-auto max-w-screen-xl scroll-mt-20 px-3 py-8">
          {/* Le bandeau de catégorie a été retiré : le fil d'Ariane porte déjà
              le nom, et le répéter en gros au-dessus des produits repoussait la
              grille sans rien apprendre. Le titre reste dans le balisage, sans
              quoi la page perdrait son seul h1. */}
          <h1 className="sr-only">{data.label}</h1>

          <CategoryProductBrowser products={data.products} />
        </div>

        <CategoryGuide label={data.label} guide={data.guide} />

        <div className="mx-auto max-w-screen-xl px-3 pb-10">
          <PaymentMethodsBar
            variant="inline"
            className="rounded-2xl border border-border bg-white p-5"
          />
        </div>
      </main>
      <Footer />

      {/* Fil d'Ariane et liste des produits : absents jusqu'ici sur les pages
          catégorie, alors que chaque fiche produit en a déjà beaucoup. */}
      <BreadcrumbJsonLd
        items={[
          { label: t("home"), href: "/" },
          { label: data.groupLabel, href: `/${data.group}` },
          { label: data.label },
        ]}
      />
      <ItemListJsonLd
        items={data.products.map((product) => ({
          name: `${product.brand} ${product.name}`,
          url: localizedUrl(product.href, locale),
        }))}
      />
    </>
  );
}
