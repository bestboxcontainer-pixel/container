import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { listEnabledPaymentMethods } from "@/server/payments";
import { getCurrentCustomer } from "@/server/customerSession";
import { routing } from "@/i18n/routing";

type CheckoutPageParams = Promise<{ locale: string }>;

// Les moyens de paiement viennent du back-office : la page doit être rendue à
// la demande, sinon une modification dans l'administration ne serait pas
// répercutée.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: CheckoutPageParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: { params: CheckoutPageParams }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, common, cart, methods, customer] = await Promise.all([
    getTranslations({ locale, namespace: "checkout" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "cart" }),
    listEnabledPaymentMethods(),
    // Facultatif : sans compte connecté, le tunnel reste identique. La commande
    // en tant qu'invité n'est jamais conditionnée à une inscription.
    getCurrentCustomer(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: common("home"), href: "/" },
                { label: cart("title"), href: "/warenkorb" },
                { label: t("title") },
              ]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <h1 className="mb-6 text-2xl font-black text-foreground sm:text-3xl">{t("title")}</h1>
          <CheckoutFlow
            methods={methods}
            customer={
              customer
                ? {
                    email: customer.email,
                    phone: customer.phone,
                    billing: customer.billing,
                    shippingSameAsBilling: customer.shippingSameAsBilling,
                    shipping: customer.shipping,
                  }
                : null
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
