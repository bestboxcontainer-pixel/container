import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { speakableSpecification } from "@/components/seo/speakable";
import { absoluteUrl, siteUrl } from "@/server/merchant";

/**
 * Balisage HowTo générique : au composant de rendre un schéma correct, à
 * l'appelant de fournir des étapes déjà affichées à l'écran, telles quelles.
 * Rien n'est reformulé ni ajouté ici, pour que le balisage ne puisse pas
 * diverger de ce que la page montre.
 */

interface HowToStepInput {
  /** Repris tel quel d'un intitulé déjà affiché (ex. le titre d'une étape numérotée). */
  name?: string;
  text: string;
}

interface HowToJsonLdProps {
  name: string;
  description?: string;
  path: string;
  steps: readonly HowToStepInput[];
  /** Matériel cité dans le texte de la page (ex. Schotter, Betonplatten). */
  supply?: readonly string[];
  /** Outillage ou véhicule cité dans le texte de la page (ex. Kranfahrzeug). */
  tool?: readonly string[];
  /** Marque le titre et le chapô (data-speakable) comme lisibles à voix haute. */
  speakable?: boolean;
}

export function HowToJsonLd({ name, description, path, steps, supply, tool, speakable }: HowToJsonLdProps) {
  if (steps.length === 0) return null;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url: absoluteUrl(path),
    author: { "@id": `${siteUrl()}#organization` },
    speakable: speakable ? speakableSpecification : undefined,
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.text,
    })),
    supply: supply && supply.length > 0 ? supply.map((name) => ({ "@type": "HowToSupply", name })) : undefined,
    tool: tool && tool.length > 0 ? tool.map((name) => ({ "@type": "HowToTool", name })) : undefined,
  };

  return <JsonLd data={data} />;
}
