import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getCategoryPages } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPages } from "@/server/localizedContent";
import type { Locale } from "@/i18n/routing";

// Page d'univers : « Haushalt », « Multimedia ». Le carrousel de l'accueil et
// le menu de l'en-tête y renvoient depuis le début ; sans cette route, les
// deux liens répondaient 404.

type GroupPageParams = Promise<{ locale: Locale; group: string }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await getCategoryPages();
  return [...new Set(pages.map((page) => page.group))].map((group) => ({ group }));
}

/** Catégories de l'univers demandé, traduites, dans l'ordre du back-office. */
async function loadGroup(locale: Locale, group: string) {
  const [pages, translations] = await Promise.all([
    getCategoryPages(),
    loadCatalogTranslations(locale),
  ]);

  const categories = localizeCategoryPages(pages, translations).filter(
    (page) => page.group === group,
  );
  return categories.length > 0 ? categories : undefined;
}

export async function generateMetadata({ params }: { params: GroupPageParams }): Promise<Metadata> {
  const { locale, group } = await params;
  const categories = await loadGroup(locale, group);
  if (!categories) return {};

  const t = await getTranslations({ locale, namespace: "group" });
  const label = categories[0].groupLabel;
  const title = t("metaTitle", { label });
  const description = t("metaDescription", { label });

  return {
    title,
    description,
    alternates: alternatesFor(`/${group}`, locale),
    ...buildSocialMetadata({ title, description, url: localizedUrl(`/${group}`, locale), locale }),
  };
}

export default async function GroupPage({ params }: { params: GroupPageParams }) {
  const { locale, group } = await params;
  setRequestLocale(locale);

  const categories = await loadGroup(locale, group);
  if (!categories) {
    notFound();
  }

  const [t, tGroup] = await Promise.all([getTranslations("common"), getTranslations("group")]);
  const label = categories[0].groupLabel;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: t("home"), href: "/" }, { label }]} />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{label}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {tGroup("intro", { label })}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/${group}/${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-sm border border-border bg-white transition-shadow hover:shadow-lg"
              >
                <span className="relative block aspect-4/3 w-full overflow-hidden bg-muted">
                  <Image
                    src={category.image}
                    alt={category.label}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-1 p-3">
                  <span className="font-bold text-foreground group-hover:text-primary">
                    {category.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tGroup("productCount", { count: category.products.length })}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <PaymentMethodsBar
            variant="inline"
            className="mt-8 rounded-sm border border-border bg-white p-5"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
