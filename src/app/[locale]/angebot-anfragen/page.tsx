import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "@/i18n/navigation";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { getProductBySlug } from "@/server/store";
import { PRODUCT_SHELL_TOKENS } from "@/lib/productLayoutTokens";
import type { Locale } from "@/i18n/routing";

type PageParams = Promise<{ locale: Locale }>;
type PageSearchParams = Promise<{ produkt?: string }>;

/** Retrouve la fiche produit depuis le chemin transmis par le bouton « Angebot anfragen ». */
async function findProduct(href: string | undefined) {
  if (!href) return undefined;
  const [group, category, slug] = href.split("/").filter(Boolean);
  if (!group || !category || !slug) return undefined;
  const found = await getProductBySlug(group, category, slug);
  return found?.product;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quoteRequest" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AngebotAnfragenPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { produkt } = await searchParams;

  const t = await getTranslations("quoteRequest");
  const common = await getTranslations("common");
  const product = await findProduct(produkt);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className={PRODUCT_SHELL_TOKENS.breadcrumbBand}>
          <div className={PRODUCT_SHELL_TOKENS.breadcrumbInner}>
            <Breadcrumb
              items={[{ label: common("home"), href: "/" }, { label: t("pageTitle") }]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-md px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t("intro")}</p>

          {product ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
              {/* Rappel du produit, non modifiable : le devis reçu doit porter
                  sur l'article que le client a réellement consulté. */}
              <div className="rounded-sm border border-border bg-white p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {t("summaryLabel")}
                </p>
                {product.image && (
                  <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-sm bg-muted">
                    <Image src={product.image} alt={product.alt} fill sizes="200px" className="object-cover" />
                  </div>
                )}
                <p className="text-sm font-bold text-foreground">
                  {product.brand} {product.name}
                </p>
                {product.sku && <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>}
                <p className="mt-1 text-sm font-black text-primary">{product.price}</p>
              </div>

              <QuoteRequestForm productHref={product.href} />
            </div>
          ) : (
            <div className="mt-8 rounded-sm border border-border bg-white p-6">
              <p className="font-black text-foreground">{t("productNotFoundTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("productNotFoundHint")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/kontakt"
                  className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
                >
                  {t("backToContact")}
                </Link>
                <Link
                  href="/container"
                  className="rounded-sm border border-border px-4 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
                >
                  {t("backToCatalog")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
