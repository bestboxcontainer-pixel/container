/**
 * Complète les caractéristiques des fiches dont les bullets sont restées en
 * pure prose (aucun fait chiffré exploitable par le nouveau tableau
 * « Technische Daten », voir productSpecs.ts) alors qu'un fait réel existe
 * déjà ailleurs sur la fiche : dans le nom, dans la description, ou dans un
 * bullet mal formaté (sans deux-points, coupé sur plusieurs lignes).
 *
 * Rien n'est inventé : chaque valeur ajoutée est recopiée d'un texte déjà
 * présent sur la même fiche. Trois fiches où aucun fait fiable n'a été
 * trouvé (BBC-BUE-001, BBC-BUE-004, BBC-SAN-007) et une fiche dont la
 * désignation contredit sa propre description (BBC-SON-001, 10 Fuß dans le
 * nom, 20 Fuß dans le texte) restent volontairement inchangées.
 *
 * IDEMPOTENT au sens propre : relancer sur une fiche déjà enrichie
 * dupliquerait les ajouts, donc à exécuter une seule fois. Chaque entrée
 * décrit soit un ajout en tête de liste (prepend), soit un remplacement
 * complet quand les bullets d'origine sont trop fragmentés pour être
 * conservés tels quels (remplace uniquement des fragments de mesure, jamais
 * le contenu narratif).
 *
 * Usage : npx tsx --env-file=.env.local scripts/enrich-prose-only-specs.ts
 */
import { prisma } from "../src/server/prisma";

interface Enrichissement {
  sku: string;
  /** Nouvelles lignes ajoutées en tête, faits repris tels quels de la fiche. */
  prepend?: string[];
  /** Bullets d'origine à retirer (mesures dupliquées ou mal formatées). */
  remove?: string[];
  /** Remplace entièrement les bullets (fiches dont la mesure était coupée sur plusieurs lignes). */
  replaceAll?: string[];
}

const ENRICHISSEMENTS: Enrichissement[] = [
  {
    sku: "BBC-BUE-002",
    prepend: ["Außenmaß: 6.058 × 2.438 × 2.591 mm"],
  },
  {
    sku: "BBC-BUE-003",
    prepend: ["Wohnfläche: 18 m²"],
  },
  {
    sku: "BBC-BUE-009",
    prepend: ["Länge: 3,50 m", "Breite: 2,20 m", "Höhe: 2,70 m"],
  },
  {
    sku: "BBC-BUE-010",
    prepend: ["Abmessungen: 8 × 3,0 m", "Wohnfläche: 24 m²"],
    remove: ["DALÍ MODULARPROJEKT 8 x 3,0 m", "24 m² WOHNFLÄCHE"],
  },
  {
    sku: "BBC-BUE-012",
    prepend: ["Abmessungen: 6 × 3 m"],
  },
  {
    sku: "BBC-BUE-013",
    prepend: ["Länge: 6 m", "Breite: 2,40 m", "Höhe: 2,70 m"],
  },
  {
    sku: "BBC-BUE-014",
    prepend: ["Länge: 6,00 m", "Breite: 2,40 m", "Höhe: 2,62 m", "Gewicht: 2.500 kg"],
    remove: ["Abmessungen 6000x2400x2620", "Gewicht 2500KG"],
  },
  {
    sku: "BBC-BUE-015",
    prepend: ["Länge: 6,00 m", "Breite: 2,40 m", "Höhe: 2,62 m", "Gewicht: 2.000 kg"],
    remove: ["Abmessungen 6000x2400x2620", "Gewicht 2000KG"],
  },
  {
    sku: "BBC-LAG-001",
    prepend: ["Abmessungen: 2 × 2 m"],
  },
  {
    sku: "BBC-LAG-002",
    prepend: ["Abmessungen: 8 × 2 m"],
  },
  {
    sku: "BBC-SAN-002",
    prepend: ["Abmessungen: 3 × 2 m"],
  },
  {
    sku: "BBC-SAN-004",
    prepend: ["Länge: 2,00 m", "Breite: 2,00 m", "Höhe: 2,50 m"],
    remove: ["Höhe 2,50m"],
  },
  {
    sku: "BBC-SAN-005",
    prepend: [
      "Außenmaße (L×B×H): 125 × 240 × 235 cm",
      "Gewicht: ca. 310 kg",
      "Farbe: RAL 7016 (Anthrazitgrau)",
      "Wasseranschluss: 1/2\" Außengewinde",
    ],
  },
  {
    sku: "BBC-SAN-006",
    prepend: ["Abmessungen: 3 × 2 m"],
  },
  {
    sku: "BBC-SEE-008",
    prepend: [
      "Außenmaß: 6.058 × 2.438 × 2.896 mm",
      "Innenvolumen: ca. 37 m³",
      "Nutzlast: ca. 28.130 kg",
    ],
  },
  {
    sku: "BBC-SEE-009",
    prepend: [
      "Außenmaß: 6.058 × 2.438 × 2.896 mm",
      "Innenvolumen: ca. 37 m³",
      "Nutzlast: ca. 28.130 kg",
    ],
  },
  {
    sku: "BBC-SEE-015",
    prepend: [
      "Außenmaß: 12.192 × 2.438 × 2.896 mm",
      "Innenvolumen: ca. 76 m³",
      "Nutzlast: ca. 26.520 kg",
    ],
  },
  {
    sku: "BBC-SEE-019",
    prepend: [
      "Außenmaß: 12.192 × 2.438 × 2.591 mm",
      "Innenvolumen: ca. 67 m³",
      "Nutzlast: ca. 26.700 kg",
    ],
    remove: ["Länge 12,20m", "Breite 2,4 m"],
  },
  {
    sku: "BBC-SON-006",
    replaceAll: [
      "Außenmaß: 6.058 × 2.438 × 2.591 mm",
      "Innenmaß: 5.898 × 2.224 × 2.302 mm",
    ],
  },
  {
    sku: "BBC-SON-008",
    replaceAll: [
      "40'HC-Containereinheit (vollständig entworfen) – NEU",
      "Außenmaß: 12.192 × 2.438 × 2.896 mm",
      "Innenmaß (L×B): 12.032 × 2.353 mm",
    ],
  },
  {
    sku: "BBC-SON-010",
    prepend: ["Außenlänge: 12,19 m", "Außenbreite: 2,44 m"],
    remove: ["Außenlänge (m)", "12.19", "Außenbreite (m)", "2,44"],
  },
  {
    sku: "BBC-SON-013",
    // « Länge/Breite/Höhe » du corps du texte (2,83×2,32×2,41 m) se
    // rapproche des cotes intérieures ISO d'un 10 Fuß (2,831×2,352×2,393 m),
    // celles du résumé (2,98×2,44×2,50 m) des cotes extérieures
    // (2,991×2,438×2,591 m) : le texte d'origine ne les distinguait pas.
    prepend: [
      "Außenmaß: 2,98 × 2,44 × 2,50 m",
      "Innenmaß: 2,83 × 2,32 × 2,41 m",
      "Gewicht: ca. 825 kg",
    ],
  },
];

async function main() {
  for (const item of ENRICHISSEMENTS) {
    const produit = await prisma.product.findFirst({ where: { sku: item.sku } });
    if (!produit) {
      console.log(`! ${item.sku} introuvable, ignoré`);
      continue;
    }

    const bulletsActuels: string[] = JSON.parse(produit.bullets || "[]");
    let bulletsFinaux: string[];

    if (item.replaceAll) {
      bulletsFinaux = item.replaceAll;
    } else {
      const restants = bulletsActuels.filter((b) => !(item.remove ?? []).includes(b));
      bulletsFinaux = [...(item.prepend ?? []), ...restants];
    }

    await prisma.product.update({
      where: { id: produit.id },
      data: { bullets: JSON.stringify(bulletsFinaux) },
    });
    console.log(`✓ ${item.sku} : ${bulletsActuels.length} -> ${bulletsFinaux.length} bullets`);
  }

  await prisma.$disconnect();
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
