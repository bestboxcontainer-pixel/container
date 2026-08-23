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

  return (
    <>
      <LegalPageView slug={SLUG} locale={locale} />
      {/* Étapes pour annoncer une rétractation : reprises telles quelles de
          la section "So melden Sie eine Rücksendung an" affichée plus haut. */}
      {page && <HowToJsonLd page={page} path={path} />}
    </>
  );
}
