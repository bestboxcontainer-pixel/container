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
// Assemblés par morceaux plutôt qu'écrits un par un : quelques milliers d'avis
// tirés d'une liste figée se répéteraient d'une fiche à l'autre, et rien ne
// trahit un catalogue artificiel comme deux fiches au même commentaire.
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

const OUVERTURES = [
  "Nach {dauer} kann ich nur Gutes berichten.",
  "Seit {dauer} im Einsatz und bisher keinerlei Probleme.",
  "Genau das, was ich gesucht habe.",
  "Preis-Leistung stimmt hier wirklich.",
  "Bin nach {dauer} immer noch sehr zufrieden.",
  "Hat meine Erwartungen übertroffen.",
  "Zweites Gerät dieser Marke, wieder eine gute Wahl.",
  "Lieferung war schnell, Aufbau problemlos.",
  "Für den Preis absolut in Ordnung.",
  "Ich würde es jederzeit wieder kaufen.",
  "Die Beratung im Vorfeld hat gepasst, das Gerät auch.",
  "Nach {dauer} täglichem Gebrauch bereue ich den Kauf keine Sekunde.",
];

/**
 * Corps de l'avis. `bon` porte l'éloge, `reserve` la petite réserve qui
 * distingue une note de quatre d'une note de cinq : un catalogue où chaque
 * commentaire est un éloge sans nuance se lit comme un faux.
 */
const CORPS: Record<Famille, { bon: string[]; reserve: string[] }> = {
  bild: {
    bon: [
      "Das Bild ist auch bei Tageslicht kräftig, Farben wirken natürlich.",
      "Schwarzwerte sind für diese Preisklasse erstaunlich gut.",
      "Die Streaming-Apps laufen flüssig, kein Ruckeln beim Umschalten.",
      "Fußball in Zeitlupe bleibt scharf, nichts zieht nach.",
      "Der Ton ist besser als erwartet, eine Soundbar braucht es nicht zwingend.",
      "Die Einrichtung war in zehn Minuten erledigt.",
      "Auch aus größerem Abstand bleibt die Schrift gut lesbar.",
    ],
    reserve: [
      "Die Fernbedienung wirkt dagegen etwas billig.",
      "Mit einer Soundbar wird es klanglich deutlich runder.",
      "Das Menü könnte übersichtlicher sein, man findet sich aber zurecht.",
      "Der Standfuß braucht mehr Platz, als ich gedacht hatte.",
    ],
  },
  mobil: {
    bon: [
      "Der Akku hält bei mir gut zwei Tage bei normaler Nutzung.",
      "Die Kamera macht auch bei wenig Licht brauchbare Bilder.",
      "Alles läuft flüssig, selbst mit vielen offenen Apps.",
      "Die Verarbeitung fühlt sich hochwertig an, nichts knarzt.",
      "Die Übernahme der Daten vom alten Gerät ging reibungslos.",
      "Das Display ist hell genug, um draußen ohne Mühe abzulesen.",
    ],
    reserve: [
      "Beim Laden wird es allerdings spürbar warm.",
      "Die vorinstallierte Software hätte ich nicht gebraucht.",
      "Ein Netzteil liegt leider nicht bei.",
      "Bei intensiver Nutzung reicht der Akku knapp einen Tag.",
    ],
  },
  waschen: {
    bon: [
      "Läuft leise, man hört das Gerät im Nebenraum kaum.",
      "Die Wäsche kommt sauber heraus, auch bei kurzen Programmen.",
      "Der Verbrauch ist merklich niedriger als beim Vorgängergerät.",
      "Die Programme sind selbsterklärend, die Anleitung brauchte ich kaum.",
      "Der Anschluss war in einer halben Stunde erledigt.",
      "Auch stark verschmutzte Arbeitskleidung wird zuverlässig sauber.",
    ],
    reserve: [
      "Das Schleudern ist allerdings recht laut.",
      "Die Programmdauer finde ich lang.",
      "Die Bedienung am Display ist anfangs etwas fummelig.",
      "Die Tür könnte einen Tick weiter aufgehen.",
    ],
  },
  kaffee: {
    bon: [
      "Der Kaffee ist heiß und aromatisch, genau richtig für den Morgen.",
      "Die Reinigung geht schnell, das nimmt man gern in Kauf.",
      "Kompakt genug, um dauerhaft auf der Arbeitsplatte zu stehen.",
      "Die Bedienung versteht auch Besuch auf Anhieb.",
      "Der Milchschaum gelingt gleichmäßig, ohne großes Üben.",
    ],
    reserve: [
      "Das Mahlwerk ist lauter als gedacht.",
      "Die Entkalkung könnte einfacher sein.",
      "Der Wassertank ist mir etwas zu klein.",
      "Für die Reinigung muss man sich anfangs Zeit nehmen.",
    ],
  },
  kueche: {
    bon: [
      "Kräftig genug für schweren Teig, nichts bleibt stehen.",
      "Die Reinigung ist unkompliziert, das meiste darf in die Spülmaschine.",
      "Steht sicher auf der Arbeitsplatte, auch bei hoher Stufe.",
      "Das Zubehör ist gut verarbeitet und sitzt fest.",
      "Die Verarbeitung wirkt durchweg wertig.",
    ],
    reserve: [
      "Das Gerät ist schwer zu verstauen.",
      "Bei hoher Stufe wird es laut.",
      "Das Kabel könnte etwas länger sein.",
      "Zusätzliches Zubehör ist recht teuer.",
    ],
  },
  saugen: {
    bon: [
      "Die Saugleistung reicht auf Teppich wie auf Fliesen völlig aus.",
      "Der Akku hält für die ganze Wohnung durch.",
      "Leicht genug, um ihn ohne Mühe die Treppe hochzutragen.",
      "Der Staubbehälter lässt sich ohne Staubwolke entleeren.",
      "Die Aufsätze wechselt man mit einem Handgriff.",
    ],
    reserve: [
      "An Kanten muss man etwas nachhelfen.",
      "Der Akku könnte noch etwas länger halten.",
      "Bei langen Haaren muss die Bürste öfter gereinigt werden.",
      "Auf höchster Stufe ist er deutlich hörbar.",
    ],
  },
  allgemein: {
    bon: [
      "Aufbau und Einrichtung waren schnell erledigt.",
      "Macht genau das, wofür ich es gekauft habe.",
      "Wirkt solide verarbeitet und läuft zuverlässig.",
      "Die Anleitung ist verständlich, auch ohne Vorkenntnisse.",
      "Im Betrieb angenehm leise, das war mir wichtig.",
    ],
    reserve: [
      "Ein paar Details könnten besser gelöst sein.",
      "Die Anleitung ist knapp gehalten.",
      "Das Zubehör wirkt etwas einfach.",
      "Im Dauerbetrieb hört man es deutlicher.",
    ],
  },
};

const CLOTURES = [
  "Klare Empfehlung.",
  "Würde ich wieder bestellen.",
  "Von mir volle Punktzahl.",
  "Gerne wieder.",
  "Kann ich weiterempfehlen.",
  "",
  "",
];

/** Clôtures des quatre étoiles : positives, mais sans superlatif. */
const CLOTURES_RESERVE = [
  "Für den Preis geht das völlig in Ordnung.",
  "Kaufen würde ich es wieder.",
  "Unterm Strich zufrieden.",
  "",
];

const TITRES_CINQ = [
  "Sehr zufrieden", "Klare Empfehlung", "Hält, was es verspricht", "Guter Kauf",
  "Top Preis-Leistung", "Genau richtig", "Alles bestens", "Würde ich wieder kaufen",
  "Läuft einwandfrei", "Bin begeistert",
];

const TITRES_QUATRE = [
  "Sehr zufrieden, kleine Abstriche", "Guter Kauf", "Fast perfekt",
  "Erfüllt seinen Zweck voll und ganz", "Gutes Gerät", "Empfehlenswert",
];

const DUREES = [
  "zwei Wochen", "einem Monat", "sechs Wochen", "zwei Monaten", "drei Monaten",
  "einem halben Jahr", "acht Monaten", "einem Jahr",
];

/** Mots vides allemands : ils ne disent rien du sujet d'une phrase. */
const MOTS_VIDES = new Set([
  "auch", "aber", "eine", "einen", "einer", "eines", "sich", "nicht", "mehr", "sehr",
  "etwas", "wird", "wurde", "haben", "hatte", "dass", "diese", "dieser", "dieses",
  "über", "unter", "nach", "beim", "vom", "zum", "zur", "man", "ist", "sind", "das",
  "der", "die", "und", "für", "mit", "ohne", "gut", "gute", "guten", "könnte",
  "kann", "muss", "wie", "was", "war", "als", "bei", "ich", "hat", "den", "dem",
]);

/** Substantifs porteurs de sens dans une phrase, pour repérer son sujet. */
function sujets(phrase: string): Set<string> {
  return new Set(
    phrase
      .toLowerCase()
      .split(/[^a-zäöüß]+/)
      .filter((mot) => mot.length > 3 && !MOTS_VIDES.has(mot)),
  );
}

/** Vrai si les deux phrases parlent de la même chose — donc se contrediraient. */
function memeSujet(a: string, b: string): boolean {
  const motsB = sujets(b);
  for (const mot of sujets(a)) if (motsB.has(mot)) return true;
  return false;
}

/**
 * Rédige un avis. Cinq étoiles : un ou deux points positifs. Quatre étoiles :
 * les mêmes, plus une réserve — c'est elle qui rend la note crédible.
 *
 * La réserve ne doit jamais porter sur ce que l'éloge vient de louer : « Die
 * Anleitung ist verständlich. Die Anleitung ist knapp gehalten. » se lit comme
 * une machine, et c'en serait une.
 */
function redigerTexte(famille: Famille, note: number): { titre: string; corps: string } {
  const ouverture = piocher(OUVERTURES).replace("{dauer}", piocher(DUREES));

  const positifs = CORPS[famille].bon;
  const details = [piocher(positifs)];
  if (alea() < 0.55) {
    const autre = piocher(positifs);
    if (autre !== details[0] && !memeSujet(autre, details[0])) details.push(autre);
  }

  if (note === 4) {
    const compatibles = CORPS[famille].reserve.filter(
      (reserve) => !details.some((detail) => memeSujet(reserve, detail)),
    );
    // Aucune réserve compatible : on retire le second éloge plutôt que
    // d'écrire une contradiction.
    if (compatibles.length > 0) {
      details.push(piocher(compatibles));
    } else {
      details.splice(1);
      details.push(
        piocher(CORPS[famille].reserve.filter((reserve) => !memeSujet(reserve, details[0]))) ??
          piocher(CORPS[famille].reserve),
      );
    }
  }

  // La clôture ne doit pas redire l'ouverture : « Für den Preis in Ordnung […]
  // Für den Preis geht das in Ordnung » ne trompe personne.
  const clotures = (note === 5 ? CLOTURES : CLOTURES_RESERVE).filter(
    (cloture) => cloture === "" || !memeSujet(cloture, ouverture),
  );
  const cloture = piocher(clotures.length > 0 ? clotures : [""]);
  const titre = piocher(note === 5 ? TITRES_CINQ : TITRES_QUATRE);

  return { titre, corps: [ouverture, ...details, cloture].filter(Boolean).join(" ") };
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

    for (let i = 0; i < total; i += 1) {
      const { titre, corps } = redigerTexte(famille, notes[i]);
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
