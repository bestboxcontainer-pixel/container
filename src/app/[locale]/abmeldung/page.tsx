import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { UnsubscribeForm } from "@/components/legal/UnsubscribeForm";
import { findRecoveryByToken } from "@/server/checkoutRecovery";
import { routing } from "@/i18n/routing";

type PageParams = Promise<{ locale: string }>;
type PageSearchParams = Promise<{ token?: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "unsubscribe" });
  return {
    title: t("metaTitle"),
    // Aucune raison d'indexer une page de désabonnement portant un jeton.
    robots: { index: false, follow: false },
  };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, common, { token: rawToken }] = await Promise.all([
    getTranslations({ locale, namespace: "unsubscribe" }),
    getTranslations({ locale, namespace: "common" }),
    searchParams,
  ]);

  const token = rawToken?.trim() ?? "";
  // Un jeton lisible seulement : la vérification d'existence est faite à la
  // confirmation, pas ici : charger la page ne doit rien écrire ni révéler.
  const validShape = /^[0-9a-f]{64}$/.test(token);
  const recovery = validShape ? await findRecoveryByToken(token) : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: common("home"), href: "/" }, { label: t("heading") }]} />
          </div>
        </div>

        <article className="mx-auto max-w-screen-sm px-3 py-10">
          <h1 className="mb-4 text-2xl font-black text-foreground sm:text-3xl">{t("heading")}</h1>

          {recovery ? (
            <>
              <p className="mb-6 text-sm text-muted-foreground">{t("intro")}</p>
              <UnsubscribeForm
                token={token}
                labels={{
                  confirm: t("confirm"),
                  sending: t("sending"),
                  done: t("done"),
                  error: t("error"),
                }}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("invalidToken")}</p>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
