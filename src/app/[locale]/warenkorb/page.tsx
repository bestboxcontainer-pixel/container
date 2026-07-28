import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartView } from "@/components/cart/CartView";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { routing } from "@/i18n/routing";

type CartPageParams = Promise<{ locale: string }>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: CartPageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return {
    title: t("metaTitle"),
    // Un panier est propre à chaque visiteur : rien à indexer.
    robots: { index: false, follow: true },
  };
}

export default async function CartPage({ params }: { params: CartPageParams }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "cart" });
  const common = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: common("home"), href: "/" }, { label: t("title") }]} />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <h1 className="mb-6 text-2xl font-black text-foreground sm:text-3xl">{t("title")}</h1>
          <CartView />

          {/* Les moyens de paiement rassurent avant le passage en caisse */}
          <PaymentMethodsBar
            variant="inline"
            className="mt-6 rounded-sm border border-border bg-white p-5"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
