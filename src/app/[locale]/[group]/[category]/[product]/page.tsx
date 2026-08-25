import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Star } from "lucide-react";
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
import { getProductBySlug, getRelatedProducts } from "@/server/store";
import { listPublicReviews } from "@/server/reviews";
import { loadCatalogTranslations, localizeCategoryPage } from "@/server/localizedContent";
import { productLongText, productShortText, truncateAtWord } from "@/lib/productText";
import { formatRating } from "@/lib/formatRating";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import {
  PRODUCT_DETAIL_TOKENS,
  PRODUCT_HERO_TOKENS,
  PRODUCT_SHELL_TOKENS,
} from "@/lib/productLayoutTokens";
import type { Locale } from "@/i18n/routing";

type ProductPageParams = Promise<{
  locale: Locale;
  group: string;
  category: string;
  product: string;
}>;

/**
 * Aucune fiche produit n'est composée à la construction du site.
 *
 * Il y en a près de huit cents, deux langues comprises, et chacune lisait sa
 * propre ligne en base pendant le build. Next répartit ce travail sur des
 * dizaines de processus simultanés : autant de connexions qui, multipliées par
 * les déploiements d'une journée, ont fini par épuiser le quota de transfert de
 * la base et mettre la boutique à l'arrêt.
 *
 * L'absence de `generateStaticParams` suffit à obtenir ce résultat : la route
 * est servie à la demande, comme la page d'accueil, les groupes et les
 * catégories, et le build ne touche plus au catalogue.
 *
 * ATTENTION : ne pas rétablir un `generateStaticParams` qui rendrait une liste
 * vide. La mise en page racine lit `headers()` pour connaître la langue, ce qui
 * rend toute la boutique dynamique. Avec une liste de paramètres, même vide,
 * Next classe pourtant la route en pré-rendu : la première visite compose alors
 * la fiche en mode statique, tombe sur cette lecture d'en-têtes et répond 500
 * (`DYNAMIC_SERVER_USAGE`). C'est ce qui a mis toutes les fiches hors service.
 * La lecture reste bon marché : elle passe par le catalogue mis en cache sous le
 * tag « catalogue », purgé à chaque écriture du back-office.
 */

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

  // Le nom complet du produit (marque + modèle + caractéristiques) dépasse
  // souvent 100 caractères une fois le suffixe de marque ajouté ; Google
  // tronque autour de 60-70 et perd le suffixe. On coupe donc la partie
  // variable pour garder un <title> qui s'affiche entièrement dans les
  // résultats de recherche.
  const productName = truncateAtWord(`${data.product.brand} ${data.product.name}`, 45);
  const description = truncateAtWord(
    productShortText(data.product, data.category.label, locale),
    160,
  );

  const title = t("metaTitle", { name: productName });

  return {
    title,
    description,
    alternates: alternatesFor(`/${group}/${category}/${product}`, locale),
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl(`/${group}/${category}/${product}`, locale),
      locale,
      image: data.product.image,
      imageAlt: `${data.product.brand} ${data.product.name}`,
    }),
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
  // Quatre fiches : la grille en compte quatre par ligne sur grand écran, et
  // une cinquième repartait seule sur une deuxième rangée.
  const relatedProducts = getRelatedProducts(categoryData, productData.slug ?? "", 4);

  const shortText = productShortText(productData, categoryData.label, locale);
  const description = productLongText(productData, categoryData.label, locale);

  // Seuls les avis validés par la modération quittent la base pour la boutique,
  // et jamais les avis de démonstration. Chargés ici, une fois, puis partagés
  // entre l'affichage et le balisage JSON-LD : les deux doivent montrer
  // exactement la même chose à Google.
  const avis = productData.id ? await listPublicReviews(productData.id) : [];

  // Note et nombre d'avis en tête de fiche, tirés de ces mêmes avis plutôt que du
  // catalogue mis en cache : Google contrôle que la note balisée est bien celle
  // que la page montre, et les deux ne doivent pas pouvoir diverger, fût-ce le
  // temps d'une purge de cache.
  const avisPublies = avis.length;
  const noteMoyenne =
    avisPublies > 0 ? avis.reduce((somme, item) => somme + item.rating, 0) / avisPublies : undefined;

  // Sans équipement listé, le panneau marine se réduirait à un titre posé sur un
  // aplat : la description reprend alors toute la largeur de la bande.
  const aDesEquipements = productData.bullets.length > 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={PRODUCT_SHELL_TOKENS.breadcrumbBand}>
          <div className={PRODUCT_SHELL_TOKENS.breadcrumbInner}>
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

        <div className={PRODUCT_SHELL_TOKENS.heroBand}>
          <div className={PRODUCT_SHELL_TOKENS.heroInner}>
            {/* La galerie prend un peu plus de place que la colonne d'achat : à
                parts égales, le visuel d'un conteneur devenait trop petit pour
                qu'on juge de la finition, qui est ce que l'acheteur regarde. */}
            <div className={PRODUCT_SHELL_TOKENS.heroGrid}>
              <ProductGallery
                image={productData.image}
                images={productData.images}
                alt={productData.alt}
              />

              <div className={PRODUCT_HERO_TOKENS.buyColumn}>
                <div>
                  <p className={PRODUCT_HERO_TOKENS.brandPill}>{productData.brand}</p>
                  <h1 className={PRODUCT_HERO_TOKENS.title}>{productData.name}</h1>

                  {/* Note et référence en deux jetons distincts. Accolées sur une
                      même ligne de texte, elles se lisaient comme une seule
                      phrase, et la référence disparaissait dans la note.
                      La note n'apparaît qu'avec de vrais avis : sans eux, elle
                      affichait la note rédactionnelle comme une moyenne de
                      clients. Celle-ci reste plus bas, sous son nom, dans la
                      section des avis. */}
                  <div className={PRODUCT_HERO_TOKENS.metaRow}>
                    {typeof noteMoyenne === "number" && avisPublies > 0 && (
                      <a href="#bewertungen" className={PRODUCT_HERO_TOKENS.ratingChip}>
                        <Star className="h-3.5 w-3.5 fill-primary" aria-hidden />
                        {t("ratingOf", { rating: formatRating(noteMoyenne, locale) })}
                        <span className="font-semibold opacity-70">
                          {t("reviewCount", { count: avisPublies })}
                        </span>
                      </a>
                    )}
                    <span className={PRODUCT_HERO_TOKENS.skuChip}>
                      {t("sku")} {productData.sku}
                    </span>
                  </div>

                  <p className={PRODUCT_HERO_TOKENS.lede}>{shortText}</p>
                </div>

                <ProductPurchaseBox product={productData} />
                {/* Variante `inline` : la variante `section` posait une bande
                    pleine largeur, bord à bord et sur fond gris, à l'intérieur
                    d'une colonne large de quatre cents pixels. */}
                <PaymentMethodsBar variant="inline" className="px-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Deux blocs distincts plutôt que deux colonnes de texte nu : sur un
            conteneur, les caractéristiques chiffrées sont l'information qui
            décide de l'achat, et elles se lisent mieux en liste cadrée qu'en
            paragraphe. Le panneau marine leur donne le poids que deux cartes
            blanches identiques ne leur donnaient pas. */}
        <section className={PRODUCT_SHELL_TOKENS.detailBand}>
          <div className={PRODUCT_SHELL_TOKENS.detailInner}>
            <p className={PRODUCT_SHELL_TOKENS.eyebrow}>{categoryData.label}</p>
            <h2 className={PRODUCT_SHELL_TOKENS.sectionTitle}>{t("details")}</h2>

            <div className={aDesEquipements ? PRODUCT_DETAIL_TOKENS.grid : "mt-10"}>
              <div className={PRODUCT_DETAIL_TOKENS.descCard}>
                <h3 className={PRODUCT_DETAIL_TOKENS.label}>{t("description")}</h3>
                <p className={PRODUCT_DETAIL_TOKENS.descText}>{description}</p>
              </div>

              {aDesEquipements && (
                <div className={PRODUCT_DETAIL_TOKENS.specCard}>
                  <span className={PRODUCT_DETAIL_TOKENS.specHalo} aria-hidden />
                  <h3 className={PRODUCT_DETAIL_TOKENS.specLabel}>{t("features")}</h3>
                  <ul className={PRODUCT_DETAIL_TOKENS.specList}>
                    {productData.bullets.map((bullet) => (
                      <li key={bullet} className={PRODUCT_DETAIL_TOKENS.specItem}>
                        <Check className={PRODUCT_DETAIL_TOKENS.specIcon} aria-hidden />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {productData.id && (
          <div className={PRODUCT_SHELL_TOKENS.reviewBand}>
            <ProductReviewSection
              productId={productData.id}
              reviews={avis}
              editorialRating={productData.rating}
            />
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className={PRODUCT_SHELL_TOKENS.relatedBand}>
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
      <ProductJsonLd product={productData} reviews={avis} />
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
