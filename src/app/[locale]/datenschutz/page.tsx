import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLegalMetadata("datenschutz", locale);
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPageView slug="datenschutz" locale={locale} />;
}
