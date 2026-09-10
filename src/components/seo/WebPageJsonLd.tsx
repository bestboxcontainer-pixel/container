import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { MERCHANT_LANGUAGE, siteUrl } from "@/server/merchant";

/**
 * Balisage WebPage minimal pour les pages éditoriales statiques (pas de
 * source de vérité en base, contrairement aux pages légales éditables).
 *
 * `datePublished`/`dateModified` sont donc à la charge de qui édite le texte
 * de la page : mettre à jour `dateModified` fait partie du changement, au même
 * titre que le texte lui-même. Une date qui ne bouge jamais n'aide personne,
 * mais une date qui suit le rendu au lieu du contenu (ex. `new Date()` à
 * chaque requête) est un signal de fraîcheur fabriqué, pas un vrai — Google et
 * les moteurs génératifs le traitent comme un abus s'il est détecté.
 */
interface WebPageJsonLdProps {
  /** Chemin sans langue, ex. "/ueber-uns". */
  path: string;
  name: string;
  /** Date de mise en ligne d'origine, format ISO ("2026-07-28"). */
  datePublished: string;
  /** Date de la dernière modification du texte, format ISO. À bumper à la main. */
  dateModified: string;
}

export function WebPageJsonLd({ path, name, datePublished, dateModified }: WebPageJsonLdProps) {
  const base = siteUrl();
  const url = `${base}${path}`;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    inLanguage: MERCHANT_LANGUAGE,
    isPartOf: { "@id": `${base}#website` },
    datePublished,
    dateModified,
  };

  return <JsonLd data={data} />;
}
