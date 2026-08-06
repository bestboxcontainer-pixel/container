import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchaseBox } from "@/components/ProductPurchaseBox";
import { ProductReviewSection } from "@/components/ProductReviewSection";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { ProductGrid } from "@/components/ProductGrid";
import { getCategoryPages, getProductBySlug, getRelatedProducts } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPage } from "@/server/localizedContent";
import { productLongText, productShortText } from "@/lib/productText";
import { formatRating } from "@/lib/formatRating";
import { alternatesFor } from "@/lib/hreflang";
import type { Locale } from "@/i18n/routing";

type ProductPageParams = Promise<{
  locale: Locale;
  group: string;
  category: string;
  product: string;
}>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategoryPages();
  return categories.flatMap((category) =>
    category.products.map((product) => ({
      group: category.group,
      category: category.slug,
      product: product.slug ?? "",
    })),
  );
}

/** Charge la fiche produit et sa catégorie, traduites dans la langue demandée. */
async function loadLocalizedProduct(
  locale: Locale,
  group: string,
  category: string,
  product: string,
) {
  const [data, translations] = await Promise.all([
    getProductBySlug(group, category, product),
    loadCatalogTranslations(locale),
  ]);
  if (!data) return undefined;

  const localizedCategory = localizeCategoryPage(data.category, translations);
  const localizedProduct = localizedCategory.products.find((item) => item.slug === product);

  return localizedProduct
    ? { category: localizedCategory, product: localizedProduct }
    : undefined;
}

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  const { locale, group, category, product } = await params;
  const data = await loadLocalizedProduct(locale, group, category, product);
  if (!data) return {};

  const t = await getTranslations({ locale, namespace: "product" });

  return {
    title: t("metaTitle", { name: `${data.product.brand} ${data.product.name}` }),
    description: data.product.bullets.join(" · "),
    alternates: alternatesFor(`/${group}/${category}/${product}`, locale),
  };
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { locale, group, category, product } = await params;
  setRequestLocale(locale);

  const data = await loadLocalizedProduct(locale, group, category, product);

  if (!data) {
    notFound();
  }

  const t = await getTranslations("product");
  const common = await getTranslations("common");

  const { category: categoryData, product: productData } = data;
  const relatedProducts = getRelatedProducts(categoryData, productData.slug ?? "", 6);

  const shortText = productShortText(productData, categoryData.label, locale);
  const description = productLongText(productData, categoryData.label, locale);

  // Nombre d'avis publiés : il commande l'affichage de l'étoile en tête de fiche.
  const avisPublies = productData.reviewCount ?? 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: common("home"), href: "/" },
                { label: categoryData.groupLabel, href: `/${categoryData.group}` },
                { label: categoryData.label, href: `/${categoryData.group}/${categoryData.slug}` },
                { label: productData.name },
              ]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ProductGallery
              image={productData.image}
              images={productData.images}
              alt={productData.alt}
            />

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {productData.brand}
                </p>
                <h1 className="text-2xl font-black text-foreground sm:text-3xl">{productData.name}</h1>
                {/* L'étoile suppose des avis : sans eux, elle affichait la note
                    rédactionnelle comme une moyenne de clients. Celle-ci reste
                    plus bas, sous son nom, dans la section des avis.
                    La référence article, elle, s'affiche toujours — elle était
                    jusqu'ici emportée avec la note sur les fiches non notées. */}
                <p className="mt-1 text-sm text-muted-foreground">
                  {typeof productData.rating === "number" && avisPublies > 0 && (
                    <>
                      ⭐ {t("ratingOf", { rating: formatRating(productData.rating, locale) })} ·{" "}
                      {t("reviewCount", { count: avisPublies })} ·{" "}
                    </>
                  )}
                  {t("sku")}: {productData.sku}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{shortText}</p>
              </div>

              <ProductPurchaseBox product={productData} />
              <PaymentMethodsBar />
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-screen-xl px-3 py-8">
          <h2 className="mb-4 text-xl font-black text-foreground">{t("details")}</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">{t("description")}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">{t("features")}</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {productData.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-primary">✓</span> {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {productData.id && (
          <div className="border-t border-border">
            <ProductReviewSection productId={productData.id} editorialRating={productData.rating} />
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="border-t border-border">
            <ProductGrid
              heading={t("related")}
              ctaLabel={common("showAll")}
              ctaHref={`/${categoryData.group}/${categoryData.slug}`}
              products={relatedProducts}
            />
          </div>
        )}
      </main>
      <Footer />

      {/* Données structurées : cohérentes avec le prix et la disponibilité affichés */}
      <ProductJsonLd product={productData} />
      <BreadcrumbJsonLd
        items={[
          { label: common("home"), href: "/" },
          { label: categoryData.groupLabel, href: `/${categoryData.group}` },
          { label: categoryData.label, href: `/${categoryData.group}/${categoryData.slug}` },
          { label: productData.name },
        ]}
      />
    </>
  );
}
