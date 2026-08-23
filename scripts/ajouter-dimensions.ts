/**
 * Complète les fiches produits avec les cotes de l'appareil.
 *
 * Pourquoi c'est nécessaire : la FAQ de la boutique promet noir sur blanc
 * « Alle Geräte- und Nischenmaße finden Sie in den technischen Daten auf der
 * Produktseite ». Une fiche sans cotes contredit cette promesse, et un
 * lave-linge qui n'entre pas dans la niche revient aux frais de la boutique.
 *
 * Chaque cote ci-dessous est relevée sur la fiche du fabricant, l'URL figure
 * en regard. AUCUNE valeur n'est estimée ni déduite d'un modèle voisin : un
 * chiffre approximatif sur une niche de cuisine coûte un retour de
 * marchandise. Un modèle absent de cette table reste sans cotes, et le script
 * le signale pour qu'on aille chercher la donnée.
 *
 *   Simulation :  npx tsx --env-file=.env.local scripts/ajouter-dimensions.ts --essai
 *   Écriture   :  npx tsx --env-file=.env.local scripts/ajouter-dimensions.ts
 *
 * Les fiches dont la cote n'a pas été trouvée sont exportées dans
 * docs/dimensions-a-completer.csv. Le commerçant relève les cotes sur la
 * plaque signalétique ou la fiche fabricant, remplit les trois colonnes, et
 * le tableau revient en base :
 *
 *   npx tsx --env-file=.env.local scripts/ajouter-dimensions.ts --importer
 *
 * Le script est idempotent : une fiche qui porte déjà ses cotes est laissée
 * telle quelle.
 */

import { readFile, writeFile } from "node:fs/promises";
import { prisma } from "../src/server/prisma";

/** Tableau des cotes qui restent à relever, à faire remplir puis réimporter. */
const FICHIER_CSV = "docs/dimensions-a-completer.csv";

interface Cote {
  /** Référence du modèle, telle qu'elle figure dans le nom du produit. */
  ref: string;
  /** Hauteur, largeur, profondeur en millimètres, dans cet ordre. */
  h: number;
  b: number;
  t: number;
  /** Page du fabricant d'où la cote est relevée. */
  source: string;
  /** Précision utile au client, par exemple la profondeur porte ouverte. */
  note?: string;
}

/**
 * Lave-linge. Les cotes Siemens et Bosch du catalogue proviennent déjà de
 * l'import d'origine ; seuls les modèles restés sans cotes figurent ici.
 */
const LAVE_LINGE: Cote[] = [
  {
    ref: "F4WV708P1E",
    h: 850, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wv708p1e/",
  },
  {
    ref: "F4WR701Y",
    h: 850, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wr701y/",
    note: "Türöffnung 90°: 1.100 mm Tiefe",
  },
  {
    ref: "F4WR703Y",
    h: 850, b: 600, t: 615,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wr703y/",
    note: "Türöffnung 90°: 1.135 mm Tiefe",
  },
  {
    ref: "F4WR7012",
    h: 850, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wr7012/",
    note: "Türöffnung 90°: 1.100 mm Tiefe",
  },
  {
    ref: "F4WX808YC",
    h: 890, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wx808yc/",
  },
  {
    ref: "F4WX809YC",
    h: 890, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f4wx809yc/",
    note: "Türöffnung 90°: 1.100 mm Tiefe",
  },
  {
    ref: "F6WV710P2S",
    h: 850, b: 600, t: 565,
    source: "https://www.lg.com/de/waeschepflege/waschmaschinen/f6wv710p2s/",
    note: "Türöffnung 90°: 1.100 mm Tiefe",
  },
  {
    ref: "L6FBF56490",
    h: 847, b: 597, t: 660,
    source: "https://www.aeg.de/laundry/laundry/washing-machines/9-kg-washing-machine/l6fbf56490/",
  },
  {
    ref: "L6FBF57480",
    h: 847, b: 596, t: 577,
    source: "https://www.aeg.de/laundry/laundry/washing-machines/8-kg-washing-machine/l6fbf57480/",
  },
  {
    ref: "L6FBG51470",
    h: 847, b: 597, t: 577,
    source: "https://www.aeg.de/laundry/laundry/washing-machines/front-loader-washing-machine/l6fbg51470/",
  },
  {
    ref: "LR8E75495",
    h: 847, b: 597, t: 660,
    source: "https://www.aeg.de/laundry/laundry/washing-machines/9-kg-washing-machine/lr8e75495/",
  },
  {
    ref: "WW1EDG5B25AEEG",
    h: 850, b: 600, t: 600,
    source: "https://www.samsung.com/de/support/model/WW1EDG5B25AEEG/",
  },
];

/**
 * Climatiseurs. Un appareil split occupe deux boîtiers : la cote portée ici
 * est celle de l'unité intérieure, celle qui décide de la place au mur ou au
 * sol. Les marques secondaires du catalogue ne publient pas toutes leurs
 * cotes ; celles qui manquent sont laissées vides plutôt qu'estimées.
 */
const CLIMATISEURS: Cote[] = [
  {
    ref: "Easy Cool 7000",
    h: 634, b: 329, t: 318,
    source: "https://www.otto.de/p/comfee-3-in-1-klimageraet-easy-cool-7000-1918953567/",
  },
  {
    ref: "AXP26U339CW",
    h: 705, b: 472, t: 383,
    source: "https://www.aeg.de/vacuums-home-comfort/air-comfort/air-conditioners/portable-air-conditioner/axp26u339cw/",
  },
  {
    ref: "Cool 4000",
    h: 800, b: 460, t: 400,
    source: "https://www.bosch-homecomfort.com/de/de/ocs/wohngebaeude/cool-4000-19814379-p/",
  },
  {
    // Le PortaSplit Cool (8.000 BTU) n'est volontairement pas visé par cette
    // entrée : Midea n'en publie pas les cotes, et rien ne dit qu'il partage
    // le châssis du 12.000.
    ref: "PortaSplit mobiles Split-Klimagerät 12000 BTU",
    h: 646, b: 518, t: 340,
    source: "https://www.midea.com/de/klimatisieren-heizen/portasplit/produktinfos.portasplit",
    note: "Außengerät (H × B × T): 438 × 500 × 260 mm",
  },
  {
    ref: "PortaSplit-E",
    h: 646, b: 518, t: 340,
    source: "https://www.midea.com/de/klimatisieren-heizen/portasplit/produktinfos.portasplit-e",
    note: "Außengerät (H × B × T): 438 × 500 × 260 mm",
  },
  {
    ref: "Unold 86320",
    h: 315, b: 440, t: 180,
    source: "https://unold.de/en/products/mobiles-split-klimagerat-5k",
    note: "Außengerät (H × B × T): 355 × 440 × 215 mm",
  },
  {
    ref: "KESSER Split-Klimagerät 9000 BTU",
    h: 250, b: 690, t: 200,
    source: "https://www.amazon.de/KESSER%C2%AE-Klimaanlage-Split-Fernbedienung-Montagematerial/dp/B09VPZSY9C",
    note: "Außengerät (H × B × T): 500 × 780 × 240 mm",
  },
];

const COTES = [...LAVE_LINGE, ...CLIMATISEURS];

/** Puce telle qu'elle s'affiche sur la fiche, au format déjà en place. */
function puce(cote: Cote): string {
  const base = `Maße (H × B × T): ${cote.h} × ${cote.b} × ${cote.t} mm`;
  return cote.note ? `${base}, ${cote.note}` : base;
}

/** Vrai si la fiche annonce déjà des cotes, sous une forme ou une autre. */
function porteDesCotes(bullets: string[], description: string): boolean {
  const motif = /\d+[,.]?\d*\s*[x×]\s*\d+[,.]?\d*\s*[x×]\s*\d+/i;
  return bullets.some((b) => motif.test(b)) || motif.test(description);
}

/**
 * Reprend le tableau une fois rempli par le commerçant et écrit les cotes.
 * Une ligne incomplète est ignorée en le disant : mieux vaut une fiche sans
 * cotes qu'une fiche avec deux cotes sur trois.
 */
async function importer(essai: boolean): Promise<void> {
  const brut = await readFile(FICHIER_CSV, "utf8");
  const lignes = brut.replace(/^﻿/, "").trim().split(/\r?\n/).slice(1);

  let ecrits = 0;
  for (const ligne of lignes) {
    const [marque, modele, h, b, t] = ligne.split(";");
    if (!h?.trim() || !b?.trim() || !t?.trim()) {
      console.log(`  ignoré (cote manquante) : ${marque}, ${modele}`);
      continue;
    }

    const produit = await prisma.product.findFirst({
      where: { brand: marque, name: modele },
      select: { id: true, bullets: true, description: true },
    });
    if (!produit) {
      console.log(`  introuvable au catalogue : ${marque}, ${modele}`);
      continue;
    }

    const bullets = JSON.parse(produit.bullets) as string[];
    if (porteDesCotes(bullets, produit.description)) continue;

    const cote: Cote = { ref: modele, h: Number(h), b: Number(b), t: Number(t), source: "" };
    console.log(`  ${marque}: ${modele}\n      + ${puce(cote)}`);
    if (!essai) {
      await prisma.product.update({
        where: { id: produit.id },
        data: { bullets: JSON.stringify([...bullets, puce(cote)]) },
      });
    }
    ecrits += 1;
  }

  console.log(`\n${essai ? "SIMULATION" : "Écriture terminée"}, ${ecrits} fiches complétées.`);
}

async function main(): Promise<void> {
  const essai = process.argv.includes("--essai");

  if (process.argv.includes("--importer")) {
    await importer(essai);
    await prisma.$disconnect();
    return;
  }

  const produits = await prisma.product.findMany({
    where: { category: { slug: { in: ["waschmaschinen", "klimageraete"] } } },
    select: { id: true, brand: true, name: true, bullets: true, description: true },
  });

  let ecrits = 0;
  let dejaFaits = 0;
  const servis = new Set<string>();

  for (const produit of produits) {
    const cote = COTES.find((c) => produit.name.includes(c.ref));
    if (!cote) continue;
    servis.add(cote.ref);

    const bullets = JSON.parse(produit.bullets) as string[];
    if (porteDesCotes(bullets, produit.description)) {
      dejaFaits += 1;
      continue;
    }

    // Les cotes ferment la liste : on lit d'abord ce que l'appareil sait faire.
    const majoures = [...bullets, puce(cote)];
    console.log(`  ${produit.brand} ${produit.name.slice(0, 45)}\n      + ${puce(cote)}`);

    if (!essai) {
      await prisma.product.update({
        where: { id: produit.id },
        data: { bullets: JSON.stringify(majoures) },
      });
    }
    ecrits += 1;
  }

  const absents = COTES.filter((c) => !servis.has(c.ref)).map((c) => c.ref);

  console.log(`\n${essai ? "SIMULATION, rien n'est écrit." : "Écriture terminée."}`);
  console.log(`  fiches complétées : ${ecrits}`);
  console.log(`  déjà pourvues     : ${dejaFaits}`);
  if (absents.length > 0) {
    console.log(`  références de la table introuvables au catalogue : ${absents.join(", ")}`);
  }

  // Ce qui reste à combler : la liste sert de commande au fournisseur.
  const restants = produits.filter((p) => {
    const bullets = JSON.parse(p.bullets) as string[];
    const cote = COTES.find((c) => p.name.includes(c.ref));
    return !cote && !porteDesCotes(bullets, p.description);
  });
  if (restants.length > 0) {
    console.log(`\n  ${restants.length} fiches encore sans cotes :`);
    for (const p of restants) console.log(`    ${p.brand}, ${p.name}`);

    // Tableau à faire remplir : le point-virgule et le BOM pour qu'Excel
    // allemand l'ouvre sans réglage, les cotes en millimètres.
    const csv = [
      "Marke;Modell;Hoehe_mm;Breite_mm;Tiefe_mm;Quelle",
      ...restants.map((p) => `${p.brand};${p.name.replace(/;/g, ",")};;;;`),
    ].join("\n");
    await writeFile(FICHIER_CSV, `﻿${csv}\n`, "utf8");
    console.log(`\n  Tableau à remplir : ${FICHIER_CSV}`);
    console.log(`  Une fois rempli : scripts/ajouter-dimensions.ts --importer`);
  }

  await prisma.$disconnect();
}

main().catch(async (erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  await prisma.$disconnect();
  process.exit(1);
});
