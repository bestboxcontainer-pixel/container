import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLegalMetadata("agb", locale);
}

export default async function AgbPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPageView slug="agb" locale={locale} />;
}
