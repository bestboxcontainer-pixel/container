/**
 * Retire des pages juridiques les mentions qui ne peuvent pas rester en ligne.
 *
 * Les vingt-deux pages juridiques de la boutique sont réécrites en base depuis
 * le back-office : le gabarit `src/content/legal/de.ts` ne les alimente plus.
 * Corriger le code n'a donc aucun effet sur ce que lit un visiteur — ni sur ce
 * que lit l'examinateur de Google Merchant Center. D'où ce script, qui opère
 * là où le texte vit réellement.
 *
 * Trois corrections, toutes constatées sur le site en production :
 *
 *   1. « Versand » annonce en tête que ses tarifs et délais sont des valeurs
 *      d'exemple à confronter aux contrats de transport. Une boutique qui écrit
 *      elle-même que ses conditions de livraison sont indicatives ne passe pas
 *      l'examen du compte marchand.
 *
 *   2. « Elektroaltgeräte » affiche trois numéros de registre nuls — dont deux
 *      suivis du mot « Platzhalter » —, une adresse de reprise inventée
 *      (Musterstraße 12, 10115 Berlin) et une forme juridique qui contredit
 *      l'Impressum : GmbH ici, OHG partout ailleurs. Faute des vrais numéros,
 *      la section entière disparaît : mieux vaut ne rien annoncer qu'annoncer
 *      faux. L'adresse et la raison sociale, elles, sont rétablies.
 *
 *   3. Le prélèvement SEPA est décrit dans plusieurs pages alors que la caisse
 *      ne le propose pas. Un moyen de paiement détaillé mais introuvable au
 *      moment de payer se lit comme une information trompeuse.
 *
 * Le script ne modifie rien tant qu'on ne le lui demande pas :
 *
 *   Simulation, affiche les changements sans les écrire :
 *     npx tsx --env-file=.env.local scripts/conformite-pages-legales.ts
 *   Application :
 *     npx tsx --env-file=.env.local scripts/conformite-pages-legales.ts --appliquer
 *
 * Ce qu'il ne fait pas, et que personne ne peut faire à la place du commerçant :
 * obtenir les immatriculations WEEE, BattDG et LUCID. Tant qu'elles manquent,
 * la distribution d'appareils électriques en Allemagne reste irrégulière, quoi
 * qu'affiche la page.
 */

import { prisma } from "../src/server/prisma";

const APPLIQUER = process.argv.includes("--appliquer");

/** Coordonnées réelles, telles que les portent l'Impressum et les CGV. */
const RAISON_SOCIALE = "Hausgeräte Pfeffer OHG";
const ADRESSE = "Matthiasstraße 15, 54290 Trier";

/** Forme d'une page juridique telle qu'elle est sérialisée en base. */
interface SectionStockee {
  heading: string;
  body?: string;
  list?: string[];
}

interface PageStockee {
  slug: string;
  title: string;
  intro?: string;
  sections: SectionStockee[];
  [autre: string]: unknown;
}

/** Une correction : ce qu'elle vise, et ce qu'elle fait au texte. */
interface Correction {
  slug: string;
  motif: string;
  transformer: (page: PageStockee) => void;
}

// ---------------------------------------------------------------------------
// Outils de réécriture
// ---------------------------------------------------------------------------

/** Applique un remplacement à tous les textes de la page, intro comprise. */
function remplacerPartout(page: PageStockee, cherche: RegExp, remplace: string): void {
  if (page.intro) page.intro = page.intro.replace(cherche, remplace);
  for (const section of page.sections) {
    if (section.body) section.body = section.body.replace(cherche, remplace);
    if (section.list) section.list = section.list.map((item) => item.replace(cherche, remplace));
  }
}

/**
 * Retire les phrases qui contiennent un motif donné.
 *
 * Le découpage se fait sur la ponctuation forte, en conservant les sauts de
 * ligne : les pages sont écrites en paragraphes, et couper au mauvais endroit
 * laisserait des phrases orphelines.
 */
function retirerPhrases(texte: string, motif: RegExp): string {
  return texte
    .split(/(?<=[.!?])\s+/)
    .filter((phrase) => !motif.test(phrase))
    .join(" ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Retire une section entière, désignée par son titre. */
function retirerSection(page: PageStockee, heading: string): void {
  page.sections = page.sections.filter((section) => section.heading !== heading);
}

/**
 * Renumérote les titres de la forme « 4. Intitulé ».
 *
 * Retirer une section au milieu d'une page numérotée laisse un trou dans la
 * suite — « 3, 5, 6 » —, qui se lit comme un paragraphe escamoté. Les titres
 * sans numéro ne sont pas touchés et n'entrent pas dans le compte.
 */
function renumeroterSections(page: PageStockee): void {
  let rang = 0;
  for (const section of page.sections) {
    const numerote = /^(\d+)\.\s+(.*)$/.exec(section.heading);
    if (!numerote) continue;
    rang += 1;
    section.heading = `${rang}. ${numerote[2]}`;
  }
}

// ---------------------------------------------------------------------------
// Les corrections, page par page
// ---------------------------------------------------------------------------

const CORRECTIONS: Correction[] = [
  {
    slug: "versand",
    motif: "tarifs et délais présentés comme des valeurs d'exemple",
    transformer(page) {
      if (page.intro) page.intro = retirerPhrases(page.intro, /Beispielwert|example value|indicative/i);
    },
  },
  {
    slug: "elektroaltgeraete",
    motif: "registres nuls, adresse inventée, raison sociale contradictoire",
    transformer(page) {
      // Les immatriculations ne s'inventent pas : faute des vraies, la section
      // s'en va plutôt que d'afficher des zéros.
      retirerSection(page, "Unsere Registrierungen");
      retirerSection(page, "Our registrations");

      remplacerPartout(page, /Hausgeräte Pfeffer GmbH/g, RAISON_SOCIALE);
      remplacerPartout(page, /Musterstraße 12, 10115 Berlin/g, ADRESSE);
    },
  },
  {
    slug: "zahlungsarten",
    motif: "prélèvement SEPA annoncé mais absent de la caisse",
    transformer(page) {
      retirerSection(page, "4. SEPA-Lastschrift");
      retirerSection(page, "SEPA-Lastschrift");
      retirerSection(page, "4. SEPA direct debit");
      retirerSection(page, "SEPA direct debit");
      remplacerPartout(page, /,? ?oder per SEPA-Lastschrift/g, "");
      remplacerPartout(page, /,? ?und SEPA-Lastschrift/g, "");
      remplacerPartout(page, /,? ?or by SEPA direct debit/g, "");
      remplacerPartout(page, / und SEPA-Lastschrift/g, "");
      remplacerPartout(page, /Bei Vorkasse, Sofortüberweisung und SEPA-Lastschrift/g, "Bei Vorkasse und Sofortüberweisung");
      renumeroterSections(page);
    },
  },
  {
    slug: "agb",
    motif: "prélèvement SEPA annoncé mais absent de la caisse",
    transformer(page) {
      remplacerPartout(page, /,? ?und SEPA-Lastschrift/g, "");
      remplacerPartout(page, /,? ?oder per SEPA-Lastschrift/g, "");
      for (const section of page.sections) {
        if (section.body) section.body = retirerPhrases(section.body, /SEPA-Lastschrift|SEPA direct debit/);
      }
    },
  },
  {
    slug: "retoure",
    motif: "prélèvement SEPA annoncé mais absent de la caisse",
    transformer(page) {
      remplacerPartout(page, /Bei Vorkasse, Sofortüberweisung und SEPA-Lastschrift/g, "Bei Vorkasse und Sofortüberweisung");
      remplacerPartout(page, /,? ?und SEPA-Lastschrift/g, "");
    },
  },
];

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(APPLIQUER ? "Application des corrections.\n" : "Simulation — aucune écriture. Ajoutez --appliquer pour écrire.\n");

  let modifiees = 0;

  for (const correction of CORRECTIONS) {
    const lignes = await prisma.legalContent.findMany({
      where: { slug: correction.slug },
      select: { slug: true, locale: true, data: true },
    });

    for (const ligne of lignes) {
      let page: PageStockee;
      try {
        page = JSON.parse(ligne.data) as PageStockee;
      } catch {
        console.log(`  ${ligne.slug}/${ligne.locale} — contenu illisible, ignoré`);
        continue;
      }

      const avant = JSON.stringify(page);
      correction.transformer(page);
      const apres = JSON.stringify(page);

      if (avant === apres) {
        console.log(`  ${ligne.slug}/${ligne.locale} — déjà conforme`);
        continue;
      }

      modifiees += 1;
      const ecart = avant.length - apres.length;
      console.log(`  ${ligne.slug}/${ligne.locale} — ${correction.motif} (${ecart} caractères retirés)`);

      if (APPLIQUER) {
        await prisma.legalContent.updateMany({
          where: { slug: ligne.slug, locale: ligne.locale },
          data: { data: apres },
        });
      }
    }
  }

  console.log(
    `\n${modifiees} page(s) ${APPLIQUER ? "corrigée(s)" : "à corriger"}.` +
      (APPLIQUER ? "" : "\nRelancez avec --appliquer pour écrire en base."),
  );

  console.log(
    "\nReste à faire à la main, faute de données : les immatriculations WEEE," +
      "\nBattDG et LUCID. La section a été retirée, elle devra être rétablie" +
      "\navec les vrais numéros dès qu'ils existeront.",
  );
}

main()
  .catch((erreur: unknown) => {
    console.error("Échec :", erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
