/**
 * Peuple les 6 catégories avec un catalogue de conteneurs exploitable.
 *
 * ATTENTION, LIRE AVANT MISE EN LIGNE
 * -----------------------------------
 * `scripts/seed-categories.ts` pose la règle « aucun produit n'est inventé ».
 * Ce script s'en écarte volontairement, pour une raison précise : sans aucun
 * produit en base, la fiche produit, le panier, la caisse et la confirmation
 * de commande sont du code mort, impossible à recetter. Il fallait de la
 * matière pour vérifier le tunnel d'achat de bout en bout.
 *
 * Ce qui est FACTUEL et peut rester tel quel :
 *   - les cotes, poids et volumes : normes ISO 668, identiques chez tous les
 *     fournisseurs (voir la page /container-masse qui affiche les mêmes)
 *   - les descriptions techniques et les classes d'état
 *
 * Ce qui est un GABARIT et doit être remplacé :
 *   - TOUS LES PRIX. Ce sont des ordres de grandeur de marché, pas les prix de
 *     BBC. Les publier tels quels expose à la PAngV et trompe l'acheteur.
 *   - les stocks, mis à 0 ou à un nombre arbitraire
 *   - les références (SKU), à aligner sur la numérotation réelle
 *
 * Repérage : chaque produit posé par ce script porte le préfixe « BBC-DEMO- »
 * dans son SKU. Pour les retrouver tous :
 *   SELECT name, sku, "priceCents" FROM "Product" WHERE sku LIKE 'BBC-DEMO-%';
 *
 * APRÈS EXÉCUTION, PURGER LE CACHE
 * --------------------------------
 * Ce script écrit via Prisma et contourne donc `invaliderCatalogue()`, qui
 * n'est appelable que dans un contexte de requête Next. Le catalogue mis en
 * cache sous le tag « catalogue » reste sur son état précédent : les pages de
 * catégorie montrent les nouveaux produits (elles interrogent la base
 * directement via `getCategoryPage`) mais les fiches produit répondent 404
 * (elles lisent le cache via `getProductBySlug`). Symptôme déroutant s'il en
 * est, la cause n'étant visible dans aucun des deux fichiers.
 *
 * Remède : enregistrer n'importe quelle fiche depuis /admin, ce qui appelle
 * `invaliderCatalogue()` dans un contexte de requête et purge le tag.
 *
 * Ce qui NE marche PAS, vérifié : arrêter le serveur, supprimer `.next/cache`
 * et relancer. L'entrée servie au rendu des composants serveur survit à
 * l'opération, et les fiches continuent de répondre 404 pendant que les pages
 * de catégorie affichent les produits. Deux heures perdues sur ce piège.
 *
 * Usage : npx tsx --env-file=.env.local scripts/seed-container-katalog.ts
 */
import { prisma } from "../src/server/prisma";

const MARQUE = "BBC Best Box";

interface Gabarit {
  categorie: string;
  slug: string;
  name: string;
  sku: string;
  /** Ordre de grandeur de marché, À REMPLACER par le prix réel. */
  priceCents: number;
  condition: "new" | "refurbished" | "used";
  shortDescription: string;
  description: string;
  bullets: string[];
  image?: string;
  images?: string[];
  stock: number;
}

const PRODUITS: Gabarit[] = [
  // ---------------------------------------------------------------- Lager
  {
    categorie: "lagercontainer",
    slug: "lagercontainer-20-fuss-gebraucht",
    name: "20 Fuß Lagercontainer, gebraucht",
    sku: "BBC-DEMO-LAG-20-WWT",
    priceCents: 245000,
    condition: "used",
    shortDescription: "Wind- und wasserdicht, sofort verfügbar aus eigenem Bestand.",
    description:
      "Der Klassiker für die stationäre Lagerung an Land. Gebrauchsspuren und Oberflächenrost gehören zur Zustandsklasse und beeinträchtigen die Funktion nicht. Die Türdichtungen sind geprüft, der Holzboden ist tragfähig. Die CSC-Plakette ist abgelaufen, was für die Aufstellung auf Ihrem Gelände ohne Belang ist und den Preisunterschied zur seetüchtigen Klasse ausmacht.",
    bullets: [
      "Außenmaß 6.058 × 2.438 × 2.591 mm",
      "Innenvolumen ca. 33 m³",
      "Doppelflügeltür, Öffnung 2.336 × 2.280 mm",
      "Leergewicht ca. 2.250 kg",
    ],
    stock: 12,
  },
  {
    categorie: "lagercontainer",
    slug: "lagercontainer-20-fuss-one-trip",
    name: "20 Fuß Lagercontainer, One-Trip",
    sku: "BBC-DEMO-LAG-20-OT",
    priceCents: 389000,
    condition: "new",
    shortDescription: "Fabrikneu, eine Transportfahrt. Lackierung ohne Vorschäden.",
    description:
      "Ein One-Trip-Container wurde nach der Produktion einmal beladen nach Europa gefahren und ist technisch neuwertig. Die richtige Wahl, wenn der Container sichtbar auf dem Firmengelände steht oder später ausgebaut werden soll: Böden unbenutzt, keine Restgerüche, Lackierung durchgehend.",
    bullets: [
      "Außenmaß 6.058 × 2.438 × 2.591 mm",
      "Innenvolumen ca. 33 m³",
      "Nur eine Transportfahrt gelaufen",
      "RAL-Lackierung auf Wunsch",
    ],
    stock: 6,
  },
  {
    categorie: "lagercontainer",
    slug: "lagercontainer-40-fuss-high-cube",
    name: "40 Fuß Lagercontainer High Cube",
    sku: "BBC-DEMO-LAG-40-HC",
    priceCents: 429000,
    condition: "used",
    shortDescription: "Maximale Lagerfläche am Stück, rund 30 cm mehr Stehhöhe.",
    description:
      "Der High Cube ist genauso lang und breit wie die Standardversion, aber rund 30 cm höher. Für sperrige Güter und für jeden späteren Ausbau ist das der entscheidende Unterschied. Prüfen Sie vor der Bestellung die Zufahrt: 40 Fuß brauchen deutlich mehr Rangierlänge als 20.",
    bullets: [
      "Außenmaß 12.192 × 2.438 × 2.896 mm",
      "Innenvolumen ca. 76 m³",
      "Türöffnung 2.336 × 2.585 mm",
      "Leergewicht ca. 3.940 kg",
    ],
    stock: 4,
  },
  {
    categorie: "lagercontainer",
    slug: "lagercontainer-10-fuss",
    name: "10 Fuß Lagercontainer",
    sku: "BBC-DEMO-LAG-10",
    priceCents: 299000,
    condition: "new",
    shortDescription: "Für beengte Grundstücke und als Werkzeuglager.",
    description:
      "Wenn 20 Fuß nicht auf das Grundstück passen oder schlicht zu viel sind. Gleiche Bauweise und gleiche Robustheit, auf halber Länge. Beliebt als abschließbares Werkzeuglager auf Baustellen mit wenig Stellfläche.",
    bullets: [
      "Außenmaß 2.991 × 2.438 × 2.591 mm",
      "Innenvolumen ca. 16 m³",
      "Leergewicht ca. 1.300 kg",
      "Passt auf die meisten Hofeinfahrten",
    ],
    stock: 8,
  },

  // ----------------------------------------------------------------- Büro
  {
    categorie: "buerocontainer",
    slug: "buerocontainer-20-fuss-anthrazit",
    name: "20 Fuß Bürocontainer, anthrazit",
    sku: "BBC-DEMO-BUE-20",
    priceCents: 890000,
    condition: "new",
    shortDescription: "Gedämmt, verglast, sofort bezugsfertig. Anthrazit RAL 7016.",
    description:
      "Mobiles Büro für Baustelle und Betriebsgelände. Gedämmte Wände, Elektroinstallation, Heizung und Fenster mit Rollladen sind ab Werk verbaut. Die zurückhaltende anthrazitfarbene Lackierung wirkt auf einem Firmengelände deutlich ruhiger als das übliche Baustellenweiß.",
    bullets: [
      "Wand-, Boden- und Deckendämmung",
      "Elektroinstallation nach VDE, Heizkörper",
      "Schiebetürelement mit Isolierverglasung",
      "Stapelbar, Ecken nach ISO-Norm",
    ],
    image: "/images/container/buerocontainer-anthrazit.png",
    stock: 3,
  },
  {
    categorie: "buerocontainer",
    slug: "buerocontainer-anlage-verglast-2-module",
    name: "Bürocontainer-Anlage verglast, 2 Module",
    sku: "BBC-DEMO-BUE-MOD2",
    priceCents: 2450000,
    condition: "new",
    shortDescription: "Zwei gekoppelte Module mit umlaufender Verglasung.",
    description:
      "Zwei Module werden vor Ort gekoppelt und ergeben eine durchgehende Fläche ohne Zwischenwand. Die umlaufende Pfosten-Riegel-Verglasung macht daraus einen Raum, den man auch Kunden zeigt: Empfang, Verkaufsbüro oder Besprechungsraum. Erweiterbar um weitere Module, auch mehrgeschossig.",
    bullets: [
      "Zwei gekoppelte Module, durchgehende Fläche",
      "Umlaufende Isolierverglasung",
      "Erweiterbar, auch mehrgeschossig",
      "Anlieferung und Montage aus einer Hand",
    ],
    image: "/images/container/buero-modul-verglast.png",
    images: ["/images/container/buero-modul-verglast-vorort.png"],
    stock: 1,
  },

  // -------------------------------------------------------------- Sanitär
  {
    categorie: "sanitaercontainer",
    slug: "sanitaercontainer-2-wc",
    name: "Sanitärcontainer, 2 WC-Kabinen",
    sku: "BBC-DEMO-SAN-2WC",
    priceCents: 980000,
    condition: "new",
    shortDescription: "Zwei getrennte WC-Kabinen mit Waschbecken, je eigener Zugang.",
    description:
      "Zwei vollständig getrennte Kabinen, jede mit eigenem Außenzugang, WC und Waschbecken. Frisch- und Abwasseranschluss werden bauseits gestellt, alternativ ist der Betrieb mit Tank möglich. Für Baustellen, Veranstaltungen und Betriebsgelände ohne festes Sanitärgebäude.",
    bullets: [
      "Zwei getrennte Kabinen mit eigenem Zugang",
      "WC und Waschbecken je Kabine",
      "Frostschutz über Heizung",
      "Anschluss bauseits oder Tankbetrieb",
    ],
    image: "/images/container/sanitaercontainer-marine.png",
    images: ["/images/container/sanitaercontainer-vorort.png"],
    stock: 2,
  },
  {
    categorie: "sanitaercontainer",
    slug: "sanitaercontainer-wc-dusche",
    name: "Sanitärcontainer WC & Dusche",
    sku: "BBC-DEMO-SAN-WCD",
    priceCents: 1240000,
    condition: "new",
    shortDescription: "Kombination aus WC-, Dusch- und Waschbereich.",
    description:
      "Die Ausführung für längere Projektlaufzeiten und für Personalunterkünfte: neben den WC-Kabinen ein abgetrennter Duschbereich mit Durchlauferhitzer. Böden und Wände sind vollflächig abgedichtet und feucht zu reinigen.",
    bullets: [
      "WC-, Dusch- und Waschbereich getrennt",
      "Durchlauferhitzer verbaut",
      "Vollflächig abgedichtete Nassbereiche",
      "Für dauerhaften Betrieb ausgelegt",
    ],
    stock: 2,
  },

  // ---------------------------------------------------------------- Wohn
  {
    categorie: "wohncontainer",
    slug: "wohncontainer-20-fuss-gedaemmt",
    name: "20 Fuß Wohncontainer, gedämmt",
    sku: "BBC-DEMO-WOH-20",
    priceCents: 1150000,
    condition: "new",
    shortDescription: "Bezugsfertige Unterkunft mit Heizung und Nasszelle.",
    description:
      "Für Personalunterkünfte während der Projektlaufzeit. Gedämmt, beheizt, mit Fenster, Elektroinstallation und Nasszelle. Mehrere Einheiten lassen sich zu einer Anlage koppeln und stapeln. Bei dauerhafter Aufstellung ist in der Regel eine Baugenehmigung erforderlich.",
    bullets: [
      "Vollständige Dämmung, Heizung verbaut",
      "Nasszelle und Elektroinstallation",
      "Koppel- und stapelbar",
      "Fenster mit Rollladen",
    ],
    stock: 2,
  },

  // ----------------------------------------------------------------- Bau
  {
    categorie: "baucontainer",
    slug: "mannschaftscontainer-20-fuss",
    name: "20 Fuß Mannschaftscontainer",
    sku: "BBC-DEMO-BAU-20M",
    priceCents: 760000,
    condition: "new",
    shortDescription: "Aufenthaltsraum mit Spinden, Sitzbank und Heizung.",
    description:
      "Der Pausen- und Umkleideraum der Baustelle. Gedämmt und beheizt, mit Spinden, Sitzgelegenheiten und Fenstern. Ausgelegt auf den täglichen Betrieb und darauf, mehrfach umgesetzt zu werden, ohne Schaden zu nehmen.",
    bullets: [
      "Gedämmt und beheizt",
      "Spinde und Sitzbank verbaut",
      "Robuste Ausführung für häufiges Umsetzen",
      "Kranbar über die vier Eckbeschläge",
    ],
    stock: 3,
  },
  {
    categorie: "baucontainer",
    slug: "werkzeugcontainer-10-fuss",
    name: "10 Fuß Werkzeugcontainer",
    sku: "BBC-DEMO-BAU-10W",
    priceCents: 345000,
    condition: "new",
    shortDescription: "Abschließbares Werkzeuglager mit verstärktem Verschluss.",
    description:
      "Kompaktes Lager für Werkzeug und Kleingerät, mit verstärkter Türkonstruktion und Vorhängeschlossbox. Passt auch dort, wo für 20 Fuß kein Platz ist, und lässt sich mit dem Ladekran versetzen, sobald die Baustelle weiterzieht.",
    bullets: [
      "Verstärkte Türkonstruktion",
      "Vorhängeschlossbox gegen Aufbruch",
      "Außenmaß 2.991 × 2.438 × 2.591 mm",
      "Regalböden auf Wunsch",
    ],
    stock: 5,
  },

  // ----------------------------------------------------------- Sonderbau
  {
    categorie: "sondercontainer",
    slug: "sondercontainer-nach-mass",
    name: "Sondercontainer nach Maß",
    sku: "BBC-DEMO-SON-MASS",
    priceCents: 590000,
    condition: "new",
    shortDescription: "Umbau nach Ihren Maßen: Ausschnitte, Trennwände, Technik.",
    description:
      "Wenn kein Standardtyp passt. Wir setzen Türen und Fenster, ziehen Trennwände ein, dämmen, verkleiden und bauen Technik ein. Zu beachten ist, dass jeder Ausschnitt in der Seitenwand die Tragstruktur schwächt und je nach Größe eine Verstärkung braucht, besonders wenn gestapelt werden soll. Der genannte Preis ist ein Einstiegspreis, der Umfang bestimmt das Angebot.",
    bullets: [
      "Tür- und Fensterausschnitte mit Verstärkung",
      "Trennwände, Dämmung, Innenverkleidung",
      "Elektro-, Wasser- und Lüftungstechnik",
      "Lackierung nach RAL",
    ],
    stock: 0,
  },
];

async function main() {
  const group = await prisma.group.findUnique({ where: { slug: "container" } });
  if (!group) {
    throw new Error(
      'Le groupe "container" est absent. Lancer d\'abord scripts/seed-categories.ts.',
    );
  }

  const categories = await prisma.category.findMany({ where: { groupId: group.id } });
  const parSlug = new Map(categories.map((c) => [c.slug, c.id]));

  let poses = 0;
  for (const produit of PRODUITS) {
    const categoryId = parSlug.get(produit.categorie);
    if (!categoryId) {
      console.log(`  ignore (categorie absente) : ${produit.categorie}`);
      continue;
    }

    const donnees = {
      categoryId,
      brand: MARQUE,
      name: produit.name,
      sku: produit.sku,
      shortDescription: produit.shortDescription,
      description: produit.description,
      bullets: JSON.stringify(produit.bullets),
      condition: produit.condition,
      image: produit.image ?? null,
      images: JSON.stringify(produit.images ?? []),
      priceCents: produit.priceCents,
      stock: produit.stock,
      active: true,
    };

    await prisma.product.upsert({
      where: { slug: produit.slug },
      update: donnees,
      create: { ...donnees, slug: produit.slug },
    });

    poses += 1;
    console.log(`  ✓ ${produit.name}`);
  }

  console.log("");
  console.log(`${poses} produits poses dans ${parSlug.size} categories.`);
  console.log("RAPPEL : tous les prix sont des gabarits, a remplacer avant mise en ligne.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
