import { COMPANY } from "@/content/legal";

// Porte d'entrée curée pour les moteurs génératifs (Perplexity, ChatGPT Search,
// AI Overviews) : convention llms.txt (https://llmstxt.org), un fichier texte
// listant les pages clés au lieu de s'en remettre au seul crawl.
//
// Route (et non fichier statique dans public/) pour rester alignée sur
// NEXT_PUBLIC_SITE_URL, comme robots.ts et sitemap.ts : un domaine de
// préproduction ne doit pas se retrouver avec des liens vers la prod.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestboxcontainer.de").replace(
  /\/+$/,
  "",
);

function contenu(): string {
  const url = (chemin: string) => `${SITE_URL}${chemin}`;

  return `# ${COMPANY.name}

> Handel mit neuen und gebrauchten Schiffscontainern: Kauf, Vermietung und Ankauf von Lager-, Büro-, Wohn- und Sanitärcontainern. Lieferung in Deutschland und Österreich.

${COMPANY.name} ist ein eingetragener Kaufmann (${COMPANY.register}, eingetragen seit ${COMPANY.registeredSince}) mit Sitz in ${COMPANY.locality}, Schleswig-Holstein.

## Kern

- [Startseite](${url("/")}): Sortiment, Ablauf einer Bestellung, Kauf und Vermietung im Überblick.
- [Vermietung](${url("/vermietung")}): Container flexibel mieten, für Baustellen, Events und Übergangslösungen.
- [Container-Ankauf](${url("/ankauf")}): Ankauf gebrauchter See-, Lager-, Büro- und Sanitärcontainer, Bewertung anhand von Fotos.

## Ratgeber

- [Häufige Fragen](${url("/faq")}): Genehmigung, Untergrund, Lieferzeit, Kauf oder Miete — sachlich beantwortet.
- [Container Maße & Typen](${url("/container-masse")}): Maße für 10, 20, 40 Fuß und High Cube, Außen-/Innenmaße, Leergewicht, Nutzlast, Volumen.
- [Zustandsklassen](${url("/zustandsklassen")}): Neu, One-Trip, cargo-worthy oder wind- und wasserdicht — Bedeutung und Einsatzzweck.

## Kontakt

- [Kontakt](${url("/kontakt")}): Anfrage zu Containerkauf oder -miete stellen.

## Optional

- [English](${url("/en")}): English version of the storefront.
`;
}

export function GET() {
  return new Response(contenu(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
