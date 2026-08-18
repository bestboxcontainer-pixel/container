import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/server/merchant";
import type { LegalPage } from "@/content/legal/types";

/**
 * Balisage HowTo d'une page légale/informative.
 *
 * Les étapes viennent telles quelles de la section qui porte déjà une liste
 * à l'écran (`section.list`) : rien n'est reformulé ni ajouté. Si une
 * réécriture depuis l'administration retire cette liste, `stepSection`
 * devient introuvable et le composant ne rend rien plutôt que de publier un
 * balisage qui ne correspondrait plus à la page affichée.
 */

interface HowToJsonLdProps {
  page: LegalPage;
  path: string;
}

export function HowToJsonLd({ page, path }: HowToJsonLdProps) {
  const stepSection = page.sections.find((section) => section.list && section.list.length > 0);
  if (!stepSection?.list) return null;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: stepSection.heading,
    description: stepSection.body || page.title,
    url: absoluteUrl(path),
    step: stepSection.list.map((text) => ({
      "@type": "HowToStep",
      text,
    })),
  };

  return <JsonLd data={data} />;
}
