/**
 * Avis de démonstration, pour juger du rendu d'un catalogue vivant.
 *
 * ATTENTION — ces avis ne sont pas des avis de clients. Publier de faux avis
 * est déloyal en toutes circonstances au sens de l'annexe au § 3 Abs. 3 UWG
 * (n° 23b et 23c) : ils doivent disparaître avant l'ouverture de la boutique.
 * Ils alimentent en outre l'AggregateRating du balisage JSON-LD, donc les
 * étoiles affichées par Google : raison de plus pour les purger à temps.
 *
 * Chaque avis porte pour cela une note de modération reconnaissable, visible
 * dans le back-office (« Note : [DEMO] … ») et qui sert de prise pour tout
 * effacer d'une commande.
 *
 *   Simulation, n'écrit rien :
 *     npx tsx --env-file=.env.local scripts/avis-demonstration.ts --essai
 *   Génération :
 *     npx tsx --env-file=.env.local scripts/avis-demonstration.ts
 *   Suppression :
 *     npx tsx --env-file=.env.local scripts/avis-demonstration.ts --purger
 *
 * Le catalogue reçoit cinq à neuf avis par fiche, notés quatre ou cinq
 * étoiles, datés entre janvier 2025 et aujourd'hui.
 */

import { prisma } from "../src/server/prisma";
import { MARQUE_DEMONSTRATION } from "../src/server/reviews";

/**
 * Marque de reconnaissance. Son préfixe vient de la boutique, qui s'en sert
 * pour refuser d'afficher ces avis : le script et le site doivent reconnaître
 * les mêmes lignes, sans quoi la purge et le filtrage porteraient à côté.
 */
const MARQUE = `${MARQUE_DEMONSTRATION} Avis de démonstration — à supprimer avant l'ouverture`;

const AVIS_MIN = 5;
const AVIS_MAX = 9;

/**
 * Fenêtre de publication. Le premier janvier 2025 comme origine, la date du
 * jour comme terme : jamais d'avis daté du futur, ce qui se verrait aussitôt
 * sur la fiche comme dans le back-office.
 */
const DEBUT = new Date("2025-01-01T09:00:00.000Z").getTime();
const FIN = Date.now();

// ---------------------------------------------------------------------------
// Tirage reproductible
// ---------------------------------------------------------------------------

/**
 * Générateur déterministe : deux exécutions produisent le même catalogue
 * d'avis. Sans cela, purger puis régénérer donnerait un site différent à
 * chaque fois, et une capture d'écran ne vaudrait plus rien.
 */
function creerAleatoire(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (etat * 1664525 + 1013904223) >>> 0;
    return etat / 0x100000000;
  };
}

const alea = creerAleatoire(20260812);
const entre = (min: number, max: number) => min + Math.floor(alea() * (max - min + 1));
const piocher = <T>(liste: readonly T[]): T => liste[Math.floor(alea() * liste.length)];

// ---------------------------------------------------------------------------
// Identités
// ---------------------------------------------------------------------------

const PRENOMS = [
  "Thomas", "Andrea", "Michael", "Sabine", "Stefan", "Claudia", "Andreas", "Petra",
  "Markus", "Susanne", "Christian", "Birgit", "Frank", "Nicole", "Jürgen", "Katrin",
  "Matthias", "Anja", "Peter", "Martina", "Wolfgang", "Silke", "Daniel", "Kerstin",
  "Alexander", "Heike", "Sebastian", "Ute", "Tobias", "Monika", "Dirk", "Gabriele",
  "Ralf", "Christine", "Oliver", "Bettina", "Jens", "Manuela", "Holger", "Simone",
  "Uwe", "Angelika", "Bernd", "Doris", "Karsten", "Elke", "Marco", "Ingrid",
  "Lukas", "Julia", "Florian", "Franziska", "Jonas", "Melanie", "Patrick", "Sandra",
];

const INITIALES = "ABCDEFGHKLMNPRSTVWZ".split("");

const VILLES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf",
  "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hannover", "Nürnberg",
  "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Karlsruhe",
  "Mannheim", "Augsburg", "Wiesbaden", "Mönchengladbach", "Kiel", "Chemnitz",
  "Braunschweig", "Halle", "Magdeburg", "Freiburg", "Krefeld", "Mainz", "Erfurt",
  "Rostock", "Kassel", "Potsdam", "Saarbrücken", "Oldenburg", "Heidelberg",
  "Trier", "Koblenz", "Ludwigshafen", "Bitburg", "Wittlich", "Konz",
];

// ---------------------------------------------------------------------------
// Textes
//
// Un vrai avis d'acheteur est court. Très court, le plus souvent : « Alles
// gut », « Passt », « Läuft leise, bin zufrieden ». Il est écrit vite, depuis
// un téléphone, sans relecture — d'où les points finaux absents, les phrases
// sans verbe et les minuscules.
//
// La version précédente composait des paragraphes bien bâtis : ouverture,
// développement, réserve nuancée, formule de conclusion. Personne n'écrit
// comme ça pour un lave-linge, et c'est exactement ce qui la trahissait.
//
// Les morceaux ci-dessous sont donc courts et se combinent peu : la longueur
// est tirée d'abord, et la plupart des avis n'ont qu'un seul fragment.
// ---------------------------------------------------------------------------

/** Familles de produits, reconnues au slug de la catégorie. */
type Famille = "bild" | "mobil" | "waschen" | "kaffee" | "kueche" | "saugen" | "allgemein";

const FAMILLES: Record<string, Famille> = {
  fernseher: "bild",
  smartphones: "mobil",
  smartwatches: "mobil",
  computer: "mobil",
  waschmaschinen: "waschen",
  geschirrspueler: "waschen",
  kaffeemaschinen: "kaffee",
  kuechenmaschinen: "kueche",
  "backoefen-herde": "kueche",
  staubsauger: "saugen",
  klimageraete: "allgemein",
  videospiele: "allgemein",
  drohnen: "allgemein",
};

/**
 * Appréciations passe-partout, celles qu'on lit sur n'importe quelle fiche.
 * Elles font à elles seules la moitié des avis d'une boutique réelle.
 */
const BREFS = [
  "Alles gut",
  "Alles bestens",
  "Top",
  "Passt",
  "Passt so",
  "Einwandfrei",
  "Bin zufrieden",
  "Sehr zufrieden",
  "Wie beschrieben",
  "Kann ich empfehlen",
  "Gerne wieder",
  "Preis Leistung stimmt",
  "Super",
  "Alles super",
  "Macht was es soll",
  "Keine Probleme",
  "Keine Probleme bisher",
  "Bis jetzt alles gut",
  "Genau wie erwartet",
  "Guter Kauf",
  "Läuft",
  "Erfüllt seinen Zweck",
  "Empfehlenswert",
  "Bin froh damit",
  "Nichts zu meckern",
  "Voll zufrieden",
];

/** Mentions de livraison ou d'installation, fréquentes et courtes. */
const LOGISTIQUE = [
  "schnelle Lieferung",
  "kam pünktlich",
  "Lieferung war schnell",
  "gut verpackt angekommen",
  "Aufbau ging schnell",
  "war schnell angeschlossen",
];

/**
 * Détails propres au produit. Sans majuscule initiale : ils s'accrochent
 * derrière une virgule le plus souvent, et prennent la majuscule au besoin.
 */
const DETAILS: Record<Famille, string[]> = {
  bild: [
    "Bild ist top",
    "super Bild",
    "Farben sind klasse",
    "schnell eingerichtet",
    "gutes Bild fürs Geld",
    "Apps laufen flüssig",
    "scharfes Bild",
  ],
  mobil: [
    "Akku hält lange",
    "läuft flüssig",
    "Kamera ist gut",
    "wertig verarbeitet",
    "Einrichtung war einfach",
    "schnell und zuverlässig",
  ],
  waschen: [
    "läuft leise",
    "Wäsche wird sauber",
    "leise und sparsam",
    "einfach zu bedienen",
    "verbraucht wenig",
    "gute Programme",
    "schleudert gut",
  ],
  kaffee: [
    "Kaffee schmeckt top",
    "einfach zu reinigen",
    "Milchschaum wird gut",
    "schnell einsatzbereit",
    "kompakt und leise",
  ],
  kueche: [
    "kräftig genug",
    "steht stabil",
    "leicht zu reinigen",
    "gutes Zubehör dabei",
    "schafft auch schweren Teig",
  ],
  saugen: [
    "saugt gut",
    "Akku reicht für die ganze Wohnung",
    "leicht zu tragen",
    "einfach zu leeren",
    "kommt gut unter die Möbel",
  ],
  allgemein: [
    "schnell aufgebaut",
    "läuft zuverlässig",
    "leise im Betrieb",
    "einfach anzuschließen",
    "tut was es soll",
  ],
};

/**
 * Petites réserves des quatre étoiles. Une seule, jamais développée : celui
 * qui met quatre étoiles au lieu de cinq lâche un mot au passage, il n'écrit
 * pas un rapport.
 */
const RESERVES: Record<Famille, string[]> = {
  bild: ["Ton ist etwas dünn", "Fernbedienung wirkt billig", "Menü etwas unübersichtlich"],
  mobil: ["wird beim Laden warm", "kein Netzteil dabei", "Akku könnte länger halten"],
  waschen: ["Schleudern ist laut", "Programme dauern lang", "Display etwas fummelig"],
  kaffee: ["Mahlwerk ist laut", "Tank etwas klein", "Entkalken nervt"],
  kueche: ["schwer zu verstauen", "auf hoher Stufe laut", "Kabel etwas kurz"],
  saugen: ["Bürste verstopft schnell", "an Kanten muss man nachhelfen", "Akku könnte länger"],
  allgemein: ["Anleitung ist dürftig", "Verpackung war lädiert", "etwas laut"],
};

/** Titres, quand il y en a un. Deux mots au plus. */
const TITRES = [
  "Top", "Alles gut", "Empfehlung", "Sehr zufrieden", "Passt", "Klasse",
  "Guter Kauf", "Einwandfrei", "Super", "Zufrieden", "Gutes Gerät",
];

/**
 * Écrit le texte comme on l'écrit sur un téléphone : point final le plus
 * souvent oublié, parfois un point d'exclamation, parfois tout en minuscules.
 * C'est ce désordre-là qui distingue un avis d'un communiqué.
 */
function humaniser(texte: string, enthousiaste: boolean): string {
  let sortie = texte.trim();

  const ponctuation = alea();
  if (ponctuation < 0.5) sortie = sortie.replace(/[.!]+$/, "");
  // Le point d'exclamation est réservé à l'avis sans réserve : « nur etwas
  // laut!! » ne se lit pas comme un contentement, mais comme une machine qui
  // a collé deux morceaux sans les entendre.
  else if (enthousiaste && ponctuation < 0.68) sortie = `${sortie.replace(/[.!]+$/, "")}!`;
  else if (enthousiaste && ponctuation < 0.72) sortie = `${sortie.replace(/[.!]+$/, "")}!!`;
  else if (!/[.!?]$/.test(sortie)) sortie = `${sortie}.`;

  // Écrit d'une traite, sans reprendre les majuscules.
  if (alea() < 0.1) sortie = sortie.toLowerCase();

  return sortie;
}

/** Première lettre en capitale, pour un fragment placé en tête de phrase. */
function capitaliser(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * Vrai si les deux fragments parlent visiblement de la même chose. « Scharfes
 * Bild. Super Bild. » est grammaticalement correct et humainement impossible :
 * on ne loue pas deux fois l'image en deux phrases sans rien en dire de plus.
 */
function memeSujet(a: string, b: string): boolean {
  const motsDe = (phrase: string) =>
    new Set(phrase.toLowerCase().split(/[^a-zäöüß]+/).filter((mot) => mot.length > 3));
  const motsB = motsDe(b);
  for (const mot of motsDe(a)) if (motsB.has(mot)) return true;
  return false;
}

/**
 * Rédige un avis.
 *
 * La longueur est tirée en premier : quatre avis sur dix tiennent en trois
 * mots, quatre sur dix en une demi-ligne, deux sur dix vont jusqu'à deux
 * phrases courtes. Aucun ne dépasse la vingtaine de mots.
 */
function redigerTexte(
  famille: Famille,
  note: number,
  reservesDeLaFiche: Set<string>,
  detailsDeLaFiche: Set<string>,
): { titre: string; corps: string; reserve?: string; detail?: string } {
  const longueur = alea();

  /**
   * Détail encore inemployé sur cette fiche. Que deux clients louent la même
   * qualité est vraisemblable ; que cinq la louent dans les mêmes termes ne
   * l'est plus.
   */
  const choisirDetail = (): string => {
    const toutes = DETAILS[famille];
    const inedits = toutes.filter((d) => !detailsDeLaFiche.has(d));
    return inedits.length > 0 ? piocher(inedits) : piocher(toutes);
  };

  /**
   * Réserve compatible avec ce qui vient d'être loué, et pas déjà servie sur
   * cette fiche. « Akku hält lange, nur Akku könnte länger halten » se
   * contredit en six mots ; et trois fiches d'affilée qui regrettent le même
   * bloc secteur ne trompent personne.
   */
  const choisirReserve = (louange?: string): string => {
    const toutes = RESERVES[famille];
    const compatibles = toutes.filter((r) => !louange || !memeSujet(r, louange));
    const inedites = compatibles.filter((r) => !reservesDeLaFiche.has(r));
    if (inedites.length > 0) return piocher(inedites);
    return compatibles.length > 0 ? piocher(compatibles) : piocher(toutes);
  };

  let corps: string;
  let reserve: string | undefined;
  // Détail effectivement employé : l'appelant le mémorise pour que la fiche
  // n'y revienne pas au bout de trois avis.
  let detailRetenu: string | undefined;

  if (longueur < 0.4) {
    // Éclair : une appréciation, rien d'autre. Sur quatre étoiles, la réserve
    // tient lieu d'avis — « Gut, nur etwas laut » est un avis entier.
    if (note === 5) {
      corps = piocher(BREFS);
    } else {
      reserve = choisirReserve();
      corps = `${piocher(BREFS)}, nur ${reserve}`;
    }
  } else if (longueur < 0.8) {
    // Court : un détail, accolé à une appréciation ou à la livraison.
    const detail = choisirDetail();
    detailRetenu = detail;
    const compagnon = alea() < 0.3 ? piocher(LOGISTIQUE) : piocher(BREFS);
    const ordre = alea();

    if (note === 4) {
      // « nur » porte toute la nuance : sans lui, « Alles super, schwer zu
      // verstauen » énumère deux faits sans dire lequel gêne.
      if (ordre < 0.5) {
        reserve = choisirReserve(detail);
        corps = `${capitaliser(detail)}, nur ${reserve}`;
      } else {
        reserve = choisirReserve();
        corps = `${piocher(BREFS)}, nur ${reserve}`;
      }
    } else if (ordre < 0.45) {
      corps = `${capitaliser(detail)}, ${compagnon.toLowerCase()}`;
    } else if (ordre < 0.9) {
      corps = `${capitaliser(compagnon)}, ${detail}`;
    } else {
      corps = capitaliser(detail);
    }
  } else {
    // Deux phrases courtes, le maximum. Un second détail parfois, jamais plus.
    const premier = choisirDetail();
    detailRetenu = premier;
    const autres = DETAILS[famille].filter(
      (autre) => autre !== premier && !memeSujet(autre, premier) && !detailsDeLaFiche.has(autre),
    );
    const second = autres.length > 0 ? piocher(autres) : piocher(BREFS);
    const ouvreSurLaLivraison = alea() < 0.35;
    const loue = ouvreSurLaLivraison ? piocher(LOGISTIQUE) : premier;
    const ouverture = `${capitaliser(loue)}.`;

    let suite: string;
    if (note === 4) {
      reserve = choisirReserve(loue);
      suite = `Nur ${reserve}.`;
    } else {
      suite = alea() < 0.5 ? `${capitaliser(second)}.` : `${piocher(BREFS)}.`;
    }
    corps = `${ouverture} ${suite}`;
  }

  // Un titre sur deux seulement : le champ est facultatif, et beaucoup passent
  // outre pour déposer leur avis plus vite.
  let titre = alea() < 0.5 ? "" : piocher(TITRES);

  // Un titre que le texte répète mot pour mot — « Sehr zufrieden » au-dessus
  // de « … Sehr zufrieden » — ne s'écrit pas tout seul. On l'efface plutôt
  // que d'en tirer un autre : le champ vide est le cas le plus courant.
  if (titre && corps.toLowerCase().includes(titre.toLowerCase())) titre = "";

  return { titre, corps: humaniser(corps, note === 5), reserve, detail: detailRetenu };
}

// ---------------------------------------------------------------------------
// Notes et dates
// ---------------------------------------------------------------------------

/**
 * Notes d'une fiche : quatre et cinq étoiles seulement, avec au moins une
 * note de quatre dès trois avis. Une fiche qui n'affiche que des cinq étoiles
 * se lit comme un faux, y compris par les moteurs de comparaison.
 */
function tirerNotes(total: number): number[] {
  const notes: number[] = [];
  for (let i = 0; i < total; i += 1) notes.push(alea() < 0.65 ? 5 : 4);

  if (total >= 3 && !notes.includes(4)) notes[entre(0, total - 1)] = 4;
  if (!notes.includes(5)) notes[entre(0, total - 1)] = 5;
  return notes;
}

const JOUR = 86_400_000;

/**
 * Dates des avis d'une fiche, de la plus ancienne à la plus récente.
 *
 * Chaque fiche reçoit sa propre fenêtre : sans cela, les 389 produits
 * auraient tous leur premier avis daté du 1er janvier et leur dernier
 * d'aujourd'hui, ce qui saute aux yeux dès qu'on trie le back-office par date.
 * Le pas à l'intérieur de la fenêtre est bruité pour la même raison.
 *
 * La fenêtre reste assez large pour couvrir 2025 et 2026 : le premier avis
 * tombe au plus tard fin avril 2025, le dernier au plus tôt début juin 2026.
 */
function dater(total: number): Date[] {
  const debut = DEBUT + alea() * 115 * JOUR;
  const fin = FIN - alea() * 60 * JOUR;
  const pas = (fin - debut) / total;

  return Array.from({ length: total }, (_, index) => {
    // On reste dans la tranche pour préserver l'ordre chronologique.
    const base = debut + index * pas + alea() * pas * 0.85;
    return new Date(Math.floor(Math.min(base, FIN - 3_600_000)));
  });
}

// ---------------------------------------------------------------------------

interface LigneAvis {
  productId: string;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  moderatorNote: string;
  moderatedAt: Date;
  createdAt: Date;
}

async function composer(): Promise<LigneAvis[]> {
  const produits = await prisma.product.findMany({
    select: { id: true, category: { select: { slug: true } } },
    orderBy: { id: "asc" },
  });

  const lignes: LigneAvis[] = [];

  for (const produit of produits) {
    const famille = FAMILLES[produit.category?.slug ?? ""] ?? "allgemein";
    const total = entre(AVIS_MIN, AVIS_MAX);
    const notes = tirerNotes(total);
    const dates = dater(total);

    // Des textes aussi courts se répètent vite. Deux « Alles gut » à la suite
    // sur la même fiche se voient immédiatement — on repioche tant que le
    // texte est déjà pris, puis on laisse passer : mieux vaut une répétition
    // qu'une boucle sans fin sur une fiche à neuf avis.
    const dejaDits = new Set<string>();
    const reservesDeLaFiche = new Set<string>();
    const detailsDeLaFiche = new Set<string>();

    for (let i = 0; i < total; i += 1) {
      const ecrire = () => redigerTexte(famille, notes[i], reservesDeLaFiche, detailsDeLaFiche);
      let { titre, corps, reserve, detail } = ecrire();
      for (let essai = 0; essai < 12 && dejaDits.has(corps.toLowerCase()); essai += 1) {
        ({ titre, corps, reserve, detail } = ecrire());
      }
      dejaDits.add(corps.toLowerCase());
      if (reserve) reservesDeLaFiche.add(reserve);
      if (detail) detailsDeLaFiche.add(detail);

      lignes.push({
        productId: produit.id,
        authorName: `${piocher(PRENOMS)} ${piocher(INITIALES)}.`,
        city: piocher(VILLES),
        rating: notes[i],
        title: titre,
        body: corps,
        // Publiés d'emblée : un avis en attente ne s'afficherait pas, et c'est
        // justement le rendu de la fiche que ces avis servent à juger.
        status: "approved",
        moderatorNote: MARQUE,
        moderatedAt: dates[i],
        createdAt: dates[i],
      });
    }
  }

  return lignes;
}

function resumer(lignes: LigneAvis[]): void {
  const moyenne = lignes.reduce((somme, l) => somme + l.rating, 0) / lignes.length;
  const parAn = new Map<number, number>();
  for (const l of lignes) {
    const an = l.createdAt.getFullYear();
    parAn.set(an, (parAn.get(an) ?? 0) + 1);
  }

  console.log(`  ${lignes.length} avis, note moyenne ${moyenne.toFixed(2)} / 5`);
  console.log(`  5 étoiles : ${lignes.filter((l) => l.rating === 5).length}`);
  console.log(`  4 étoiles : ${lignes.filter((l) => l.rating === 4).length}`);
  for (const [an, nombre] of [...parAn].sort()) console.log(`  ${an} : ${nombre} avis`);

  // Chaque fiche doit porter des avis des deux années : c'est ce qui donne
  // l'impression d'un produit vendu dans la durée plutôt que d'un lot importé.
  const annees = new Map<string, Set<number>>();
  for (const l of lignes) {
    const vues = annees.get(l.productId) ?? new Set<number>();
    vues.add(l.createdAt.getFullYear());
    annees.set(l.productId, vues);
  }
  const incompletes = [...annees.values()].filter((vues) => vues.size < 2).length;
  console.log(
    `  fiches servies : ${annees.size} — dont ${incompletes} sans les deux millésimes`,
  );
}

async function essai(): Promise<void> {
  const lignes = await composer();
  console.log("SIMULATION — rien n'est écrit en base.\n");
  resumer(lignes);

  console.log("\n  Trois avis au hasard :");
  for (const l of [lignes[3], lignes[Math.floor(lignes.length / 2)], lignes[lignes.length - 2]]) {
    console.log(
      `\n  ${"★".repeat(l.rating)} « ${l.title} » — ${l.authorName}, ${l.city}, ` +
        `${l.createdAt.toISOString().slice(0, 10)}\n    ${l.body}`,
    );
  }
}

async function purger(): Promise<void> {
  const { count } = await prisma.review.deleteMany({ where: { moderatorNote: MARQUE } });
  console.log(`${count} avis de démonstration supprimés.`);
}

async function generer(): Promise<void> {
  const dejaPresents = await prisma.review.count({ where: { moderatorNote: MARQUE } });
  if (dejaPresents > 0) {
    throw new Error(
      `${dejaPresents} avis de démonstration sont déjà en base. Lancer d'abord --purger.`,
    );
  }

  const lignes = await composer();
  resumer(lignes);

  // Par paquets : une seule requête de plusieurs milliers de lignes dépasse ce
  // que le pooler accepte.
  const PAQUET = 500;
  for (let i = 0; i < lignes.length; i += PAQUET) {
    await prisma.review.createMany({ data: lignes.slice(i, i + PAQUET) });
    process.stdout.write(`\r  écrits : ${Math.min(i + PAQUET, lignes.length)}/${lignes.length}`);
  }
  console.log("\nTerminé. Purge : scripts/avis-demonstration.ts --purger");
}

async function main(): Promise<void> {
  if (process.argv.includes("--purger")) await purger();
  else if (process.argv.includes("--essai")) await essai();
  else await generer();
  await prisma.$disconnect();
}

main().catch(async (erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  await prisma.$disconnect();
  process.exit(1);
});
