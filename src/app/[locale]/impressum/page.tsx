import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLegalMetadata("impressum", locale);
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPageView slug="impressum" locale={locale} />;
}
