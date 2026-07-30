import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { Link } from "@/i18n/navigation";
import { searchProducts } from "@/server/search";
import type { Locale } from "@/i18n/routing";

type SearchPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const [{ locale }, { q }] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "search" });

  return {
    title: q ? t("metaTitleWithQuery", { query: q }) : t("metaTitle"),
    // Une page de résultats n'a rien à faire dans un index de recherche : son
    // contenu dépend d'un paramètre, et les fiches sont déjà indexées seules.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ locale }, { q }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const [t, common] = await Promise.all([
    getTranslations("search"),
    getTranslations("common"),
  ]);
  const [tHeader] = await Promise.all([getTranslations("header")]);

  const query = (q ?? "").trim();
  const hits = query.length >= 2 ? await searchProducts(query, locale) : [];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: common("home"), href: "/" }, { label: t("title") }]} />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {query ? t("resultsFor", { query }) : t("title")}
          </h1>

          {query.length >= 2 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("resultCount", { count: hits.length })}
            </p>
          )}

          {/* Reprise de la recherche sur place : renvoyer la personne vers la
              barre de l'en-tête pour corriger un terme est une friction inutile
              quand c'est ici qu'elle constate le résultat. */}
          <div className="mt-4 max-w-xl rounded-sm border border-border p-1">
            <SearchBar
              placeholder={common("searchPlaceholder")}
              label={tHeader("search")}
              defaultValue={query}
            />
          </div>

          {hits.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {hits.map((hit) => (
                <ProductCard key={hit.product.id ?? hit.product.href} product={hit.product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-sm border border-border p-8 text-center">
              <SearchX className="mx-auto mb-3 h-9 w-9 text-border" aria-hidden />
              <p className="font-bold text-foreground">
                {query.length >= 2 ? t("emptyTitle", { query }) : t("promptTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {query.length >= 2 ? t("emptyHint") : t("promptHint")}
              </p>
              <Link
                href="/"
                className="mt-5 inline-block rounded-sm bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
              >
                {t("backToShop")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
