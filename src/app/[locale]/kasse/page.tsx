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
import { findRecoveryByToken } from "@/server/checkoutRecovery";
import { decodeCart, RESUME_QUERY_PARAM, type RecoveryStep } from "@/lib/checkoutRecovery";
import { routing } from "@/i18n/routing";

type CheckoutPageParams = Promise<{ locale: string }>;
type CheckoutSearchParams = Promise<Record<string, string | string[] | undefined>>;

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

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: CheckoutPageParams;
  searchParams: CheckoutSearchParams;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, common, cart, methods, customer, query] = await Promise.all([
    getTranslations({ locale, namespace: "checkout" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "cart" }),
    listEnabledPaymentMethods(),
    // Facultatif : sans compte connecté, le tunnel reste identique. La commande
    // en tant qu'invité n'est jamais conditionnée à une inscription.
    getCurrentCustomer(),
    searchParams,
  ]);

  // Reprise depuis un message de relance. Un jeton inconnu ou une session
  // purgée n'affiche aucune erreur : un lien vieux de six semaines doit ouvrir
  // la caisse normalement, pas une page cassée.
  const rawToken = query[RESUME_QUERY_PARAM];
  const token = typeof rawToken === "string" ? rawToken : "";
  const recovery = token ? await findRecoveryByToken(token) : null;
  const resumed = recovery
    ? {
        email: recovery.email,
        step: recovery.lastStep as RecoveryStep,
        lines: decodeCart(recovery.cartJson).map((line) => ({
          productId: line.productId,
          slug: line.path.split("/").pop() ?? "",
          brand: line.brand,
          name: line.name,
          image: line.image,
          path: `/${line.path}`,
          priceCents: line.unitPriceCents,
          quantity: line.quantity,
          stock: line.stock,
        })),
      }
    : undefined;

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
            resumed={resumed}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
