import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Site vitrine minimal (marketing). Chaque page inclut elle-même <Header /> et
// <Footer /> (même convention que LegalPageView) plutôt que ce layout : une
// page comme /kontakt pourrait un jour vouloir un chrome différent, et ça
// évite un doublon avec les pages légales qui rendent déjà les deux.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
