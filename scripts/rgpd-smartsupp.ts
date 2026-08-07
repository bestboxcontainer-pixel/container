/**
 * Aligne la politique de confidentialité enregistrée en base sur le chargement
 * au clic du chat Smartsupp.
 *
 * POURQUOI UN SCRIPT PLUTÔT QU'UNE MODIFICATION DE FICHIER.
 *
 * La table `LegalContent` prime sur les fichiers versionnés : dès qu'une page a
 * été enregistrée une fois depuis le back-office, modifier `de.ts` n'a plus
 * aucun effet visible. La page « datenschutz » est dans ce cas. Le fichier
 * reste la source de référence — il est corrigé lui aussi — mais c'est ici que
 * se joue ce que le visiteur lit.
 *
 * Le script ne touche que l'allemand, langue de référence. L'anglais se
 * régénère ensuite par le script de traduction, à partir de cette version.
 *
 * Idempotent : relancé, il ne fait rien de plus. Il refuse d'écrire à l'aveugle
 * si les sections attendues ont été remaniées depuis — mieux vaut s'arrêter que
 * d'écraser un texte relu par un juriste.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/rgpd-smartsupp.ts --simuler
 *   npx tsx --env-file=.env.local scripts/rgpd-smartsupp.ts
 */

import { prisma } from "../src/server/prisma";

const SLUG = "datenschutz";
const LOCALE = "de";

/** Marqueur de passage : sa présence signale que le texte est déjà à jour. */
const MARQUEUR = "Smartsupp";

const SECTION_COOKIES = "Cookies";
// La version enregistrée en base est plus courte que le fichier versionné et
// ne porte pas les mêmes intitulés : c'est « Weitergabe von Daten » qui y
// tient le rôle de la section des destinataires.
const SECTION_DESTINATAIRES = "Weitergabe";

const CORPS_COOKIES =
  "Der Betrieb dieses Shops beruht auf technisch notwendigen Cookies: Warenkorb, Sitzungsverwaltung, Sprachwahl und Sicherheit. Sie sind nach § 25 Absatz 2 Nummer 2 TDDDG einwilligungsfrei; die damit verbundene Datenverarbeitung stützt sich auf Artikel 6 Absatz 1 Buchstabe f DSGVO.\n\n" +
  "Einen Live-Chat der Smartsupp s.r.o. (Tschechische Republik) bieten wir über eine Schaltfläche unten rechts an. Er wird erst nach Ihrem Klick geladen: solange Sie ihn nicht öffnen, wird kein Smartsupp-Skript ausgeführt, kein Cookie dieses Anbieters gesetzt und es gelangen keine Daten an ihn.\n\n" +
  "Mit dem Öffnen des Chats fordern Sie diesen Dienst ausdrücklich an (§ 25 Absatz 2 Nummer 2 TDDDG). Die dabei gesetzte Besucherkennung ordnet die Nachrichten eines Gesprächs einander zu; ihre Speicherdauer richtet sich nach den Angaben von Smartsupp in dessen eigener Dokumentation.\n\n" +
  "Cookies zur Reichweitenmessung, zu Werbezwecken oder von sozialen Netzwerken setzen wir nicht. Ein Einwilligungsbanner ist daher nicht erforderlich.\n\n" +
  "Zusätzlich können Sie Cookies in Ihrem Browser löschen oder blockieren. Einige Funktionen des Shops stehen dann möglicherweise nicht mehr vollständig zur Verfügung.";

const PHRASE_DESTINATAIRE =
  " Dazu zählt die Smartsupp s.r.o. (Tschechische Republik) als Anbieter des Live-Chats – ausschließlich für Gespräche, die Sie selbst eröffnen.";

interface Section {
  heading?: string;
  body?: string;
}
interface Page {
  title?: string;
  sections?: Section[];
}

async function main() {
  const simuler = process.argv.includes("--simuler");

  const ligne = await prisma.legalContent.findUnique({
    where: { slug_locale: { slug: SLUG, locale: LOCALE } },
    select: { data: true },
  });

  if (!ligne) {
    console.log(
      `Aucune version de « ${SLUG}/${LOCALE} » en base : le fichier versionné fait foi, rien à faire ici.`,
    );
    await prisma.$disconnect();
    return;
  }

  const page = JSON.parse(ligne.data) as Page;
  const sections = page.sections ?? [];

  if (ligne.data.includes(MARQUEUR)) {
    console.log("Le texte mentionne déjà Smartsupp : rien à changer.");
    await prisma.$disconnect();
    return;
  }

  const indexCookies = sections.findIndex((s) => (s.heading ?? "").includes(SECTION_COOKIES));
  const indexDestinataires = sections.findIndex((s) =>
    (s.heading ?? "").includes(SECTION_DESTINATAIRES),
  );

  if (indexCookies === -1) {
    throw new Error(
      `Aucune section « ${SECTION_COOKIES} » dans ${SLUG}/${LOCALE}. La page a été remaniée : ` +
        "reprendre la modification à la main plutôt que d'écrire à l'aveugle.",
    );
  }
  if (indexDestinataires === -1) {
    throw new Error(
      `Aucune section « ${SECTION_DESTINATAIRES} » dans ${SLUG}/${LOCALE}. Même remarque.`,
    );
  }

  console.log(`section cookies       : « ${sections[indexCookies].heading} »`);
  console.log(`section destinataires : « ${sections[indexDestinataires].heading} »`);

  sections[indexCookies].body = CORPS_COOKIES;
  // Ajout en fin de premier paragraphe : la formulation d'accroche varie d'une
  // version à l'autre, sa position non.
  const corpsDestinataires = sections[indexDestinataires].body ?? "";
  const coupure = corpsDestinataires.indexOf("\n\n");
  sections[indexDestinataires].body =
    coupure === -1
      ? corpsDestinataires + PHRASE_DESTINATAIRE
      : corpsDestinataires.slice(0, coupure) +
        PHRASE_DESTINATAIRE +
        corpsDestinataires.slice(coupure);

  if (!sections[indexDestinataires].body.includes(MARQUEUR)) {
    throw new Error(
      "La phrase d'accroche des destinataires n'a pas été retrouvée : " +
        "ajouter la mention Smartsupp à la main.",
    );
  }

  if (simuler) {
    console.log("\n--- simulation, rien n'est écrit ---");
    console.log(sections[indexCookies].body.slice(0, 300) + "…");
    await prisma.$disconnect();
    return;
  }

  await prisma.legalContent.update({
    where: { slug_locale: { slug: SLUG, locale: LOCALE } },
    data: { data: JSON.stringify(page), updatedBy: "scripts/rgpd-smartsupp.ts" },
  });

  console.log("\nPage mise à jour en base.");
  console.log("Régénérer ensuite la version anglaise par le script de traduction.");
  await prisma.$disconnect();
}

main().catch(async (erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  await prisma.$disconnect();
  process.exit(1);
});
