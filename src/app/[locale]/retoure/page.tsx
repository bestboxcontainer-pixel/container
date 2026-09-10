import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { findLegalPage } from "@/server/legalPages";

const SLUG = "retoure" as const;

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  return await buildLegalMetadata(SLUG, locale);
}

export default async function RetourePage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const path = locale === "en" ? "/en/retoure" : "/retoure";
  const page = await findLegalPage(SLUG, locale);

  // Étapes pour annoncer une rétractation : reprises telles quelles de la
  // section qui porte déjà une liste à l'écran. Si une réécriture depuis
  // l'administration retire cette liste, il n'y a pas de balisage plutôt
  // qu'un balisage qui ne correspondrait plus à la page.
  const stepSection = page?.sections.find((section) => section.list && section.list.length > 0);

  return (
    <>
      <LegalPageView slug={SLUG} locale={locale} />
      {page && stepSection?.list && (
        <HowToJsonLd
          name={stepSection.heading}
          description={stepSection.body || page.title}
          path={path}
          steps={stepSection.list.map((text) => ({ text }))}
        />
      )}
    </>
  );
}
