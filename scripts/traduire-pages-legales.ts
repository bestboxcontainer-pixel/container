/**
 * Traduction anglaise des pages légales, écrite en base.
 *
 * POURQUOI CE SCRIPT EXISTE. Les pages enregistrées depuis le back-office
 * priment sur les fichiers versionnés. Comme l'allemand a été réécrit page par
 * page en administration et que l'anglais n'a jamais été enregistré, l'anglais
 * retombait sur son fichier d'origine : les deux langues décrivaient deux
 * boutiques différentes. Sur des CGV ou une notice de rétractation, l'écart
 * n'est pas cosmétique.
 *
 * Le script prend l'allemand tel qu'il est SERVI aujourd'hui — donc la version
 * en base — et enregistre sa traduction sous la locale anglaise. La structure
 * est reprise à l'identique : même nombre de sections, même ordre, mêmes
 * intitulés dans le même rôle. Un écart de structure entre les deux langues
 * réintroduirait exactement le problème qu'on corrige.
 *
 * Les traductions vivent dans `traductions/legal-en.json`, à côté. Le script ne
 * traduit rien de lui-même : il refuse d'écrire une page dont la traduction
 * manque ou dont le nombre de sections ne correspond pas.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/traduire-pages-legales.ts          (aperçu)
 *   npx tsx --env-file=.env.local scripts/traduire-pages-legales.ts --ecrire
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/server/prisma";

interface Section {
  heading: string;
  body: string;
}

interface Page {
  slug: string;
  title: string;
  sections: Section[];
  updatedAt?: string;
}

const FICHIER_TRADUCTIONS = path.join(process.cwd(), "scripts", "traductions", "legal-en.json");
const ACTEUR = "scripts/traduire-pages-legales.ts";

function lireTraductions(): Record<string, { title: string; sections: Section[] }> {
  return JSON.parse(readFileSync(FICHIER_TRADUCTIONS, "utf-8"));
}

async function main() {
  const ecrire = process.argv.includes("--ecrire");
  const traductions = lireTraductions();

  const rows = await prisma.legalContent.findMany({
    where: { locale: "de" },
    select: { slug: true, data: true },
    orderBy: { slug: "asc" },
  });

  let ecrites = 0;
  const ignorees: string[] = [];

  for (const row of rows) {
    const allemand = JSON.parse(row.data) as Page;
    const anglais = traductions[row.slug];

    if (!anglais) {
      ignorees.push(`${row.slug} — pas de traduction fournie`);
      continue;
    }
    if (anglais.sections.length !== allemand.sections.length) {
      ignorees.push(
        `${row.slug} — ${anglais.sections.length} sections traduites pour ${allemand.sections.length} en allemand`,
      );
      continue;
    }

    // La page anglaise reprend la charpente de l'allemande : seuls les textes
    // changent. `slug` et `updatedAt` restent ceux de la source.
    const page: Page = {
      ...allemand,
      title: anglais.title,
      sections: allemand.sections.map((section, index) => ({
        ...section,
        heading: anglais.sections[index].heading,
        body: anglais.sections[index].body,
      })),
    };

    if (ecrire) {
      await prisma.legalContent.upsert({
        where: { slug_locale: { slug: row.slug, locale: "en" } },
        create: { slug: row.slug, locale: "en", data: JSON.stringify(page), updatedBy: ACTEUR },
        update: { data: JSON.stringify(page), updatedBy: ACTEUR },
      });
    }
    console.log(`  ${row.slug.padEnd(22)} ${anglais.sections.length} sections`);
    ecrites += 1;
  }

  console.log(`\n${ecrites} page(s) ${ecrire ? "écrites en base" : "prêtes (aperçu, rien n'a été écrit)"}`);
  if (ignorees.length > 0) {
    console.log("\nLaissées de côté :");
    ignorees.forEach((raison) => console.log(`  ${raison}`));
  }

  await prisma.$disconnect();
}

main().catch(async (erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  await prisma.$disconnect();
  process.exit(1);
});
