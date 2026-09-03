/**
 * Ajoute 4 fiches Sondercontainer réelles depuis villex-container.de
 * (série Nero-Line), demandées explicitement par l'utilisateur avec leurs
 * URL. Le site source est rendu côté client (SPA) : les données ont été
 * relevées au préalable via un navigateur piloté (Playwright), curl seul n'y
 * voit que la coquille vide.
 *
 * Désignations, cotes, équipements et poids sortent tels quels des fiches
 * d'origine (même principe que `collecter-containers.ts`). Seul le prix est
 * une ESTIMATION : Villex n'affiche aucun prix public (« Preis auf
 * Anfrage ») sur ces 4 modèles, l'utilisateur a demandé une estimation par
 * comparaison avec les Bürocontainer déjà au catalogue plutôt qu'un blocage.
 *
 * Usage : npx tsx --env-file=.env.local scripts/add-villex-sondercontainer.ts
 */
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { prisma } from "../src/server/prisma";

const DOSSIER_PRODUITS = "bbc-best-box/products";
const MARQUE = "BBC Best Box";
const CATEGORIE_GOOGLE = "6413";

interface Fiche {
  sku: string;
  slug: string;
  name: string;
  /** Estimation interne, faute de prix publié par la source. */
  priceCentsEstime: number;
  poidsKg: number;
  bullets: string[];
  description: string;
  shortDescription: string;
  imageCode: string;
  fichiers: string[];
}

const FICHES: Fiche[] = [
  {
    sku: "BBC-SON-014",
    slug: "villex-mini-cube-nero-1-0",
    name: "Villex Mini Cube Nero 1.0",
    priceCentsEstime: 179000,
    poidsKg: 800,
    bullets: [
      "Außenmaße (L×B×H): 4,0 m × 2,4 m × 2,6 m",
      "Fläche: 9,6 m²",
      "Fenster: 1x Standardfenster (1000 x 1000 mm)",
      "Türen: 1x Tür (Stahl)",
      "Stärke Dämmung: 5,0 cm, ISO-PUR-Sandwichpaneele / Polyurethan",
      "Elektrik: 32A CEE-Stecker (rot), 3x Doppelsteckdose, 2x LED-Beleuchtung, 1x Lichtschalter, Sicherungskasten mit FI-Schalter",
      "Gewicht: 800 kg",
      "Farbe Paneel: RAL7016 (anthrazit)",
    ],
    description:
      "Der Villex Mini Cube Nero 1.0 ist ein vielseitiger 4,0 Meter Container, der sich durch sein kompaktes, aber dennoch großzügiges Raumangebot auszeichnet. Mit einer Länge von 4,0 m, einer Breite von 2,4 m und einer Höhe von 2,6 m bietet er etwas mehr Platz als kleinere Modelle, bleibt aber dennoch leicht transportierbar. Die 5 cm starke Dämmung sorgt für guten Wärmeschutz, während die anthrazitfarbenen Paneele und der Grundrahmen (RAL7016) dem Container ein modernes und elegantes Erscheinungsbild verleihen. Der Container ist mit einer stabilen Stahltür und einem 1000 x 1000 mm Standardfenster ausgestattet, das für natürliches Licht sorgt. Die elektrische Ausstattung umfasst einen 32A CEE-Stecker, drei Doppelsteckdosen, zwei LED-Leuchten und einen Lichtschalter. Mit einem Gewicht von 800 kg ist der Villex Mini Cube Nero 1.0 leicht zu transportieren und vielseitig nutzbar.",
    shortDescription:
      "Kompakter 4,0 m Bürocontainer im modernen Nero-Design (RAL7016 anthrazit), 5 cm Dämmung, Stahltür und Standardfenster.",
    imageCode: "MINCN1.0",
    fichiers: [
      "00_dcdc5426bf.jpg",
      "01_cbeeb32ba0.jpg",
      "02_d67887e9d6.jpg",
      "03_16ebdd50c0.jpg",
      "04_f508b1cf4a.jpg",
      "05_1758dac312.jpg",
      "06_63931b0102.jpg",
      "07_6ab38b113a.jpg",
    ],
  },
  {
    sku: "BBC-SON-015",
    slug: "villex-standard-cube-nero-1-0",
    name: "Villex Standard Cube Nero 1.0",
    priceCentsEstime: 259000,
    poidsKg: 1000,
    bullets: [
      "Außenmaße (L×B×H): 6,0 m × 2,4 m × 2,6 m",
      "Fläche: 14,4 m²",
      "Fenster: 2x Standardfenster (1000 x 1000 mm)",
      "Türen: 1x Tür (Stahl)",
      "Stärke Dämmung: 5,0 cm, ISO-PUR-Sandwichpaneele / Polyurethan",
      "Elektrik: 32A CEE-Stecker (rot), 3x Doppelsteckdose, 2x LED-Beleuchtung, 1x Lichtschalter, Sicherungskasten mit FI-Schalter",
      "Gewicht: 1000 kg",
      "Farbe Paneel: RAL7016 (anthrazit)",
    ],
    description:
      "Der Villex Standard Cube Nero 1.0 ist ein robuster 6,0 Meter Container, der sich durch seine vielseitige Nutzung und modernes Design auszeichnet. Mit einer Länge von 6,0 m, einer Breite von 2,4 m und einer Höhe von 2,6 m bietet er großzügigen Platz für unterschiedliche Anwendungen. Die 5 cm starke Dämmung gewährleistet eine effektive Isolierung, während die anthrazitfarbenen Paneele (RAL7016) und der Grundrahmen dem Container ein elegantes und zeitgemäßes Erscheinungsbild verleihen. Der Container verfügt über eine stabile Stahltür und zwei Standardfenster (je 1000 x 1000 mm), die für ausreichend Tageslicht sorgen. Zur Elektrikausstattung gehören ein 32A CEE-Stecker, drei Doppelsteckdosen, zwei LED-Leuchten und ein Lichtschalter. Mit einem Gewicht von 1000 kg bleibt der Villex Standard Cube Nero 1.0 leicht transportierbar und vielseitig einsetzbar.",
    shortDescription:
      "Robuster 6,0 m Bürocontainer im Nero-Design (RAL7016 anthrazit), zwei Standardfenster, 5 cm Dämmung – vielseitig einsetzbar.",
    imageCode: "STDCN1.0",
    fichiers: [
      "00_2b27d4b10d.jpg",
      "01_83d935fd0c.jpg",
      "02_786e3528f0.jpg",
      "03_0156b372d5.jpg",
      "04_81c704617f.jpg",
      "05_9f1d42d2d5.jpg",
      "06_86acaf7ee6.jpg",
      "07_d0bfd098ac.jpg",
    ],
  },
  {
    sku: "BBC-SON-016",
    slug: "villex-big-cube-vertikal-nero-1-0",
    name: "Villex Big Cube Vertikal Nero 1.0",
    priceCentsEstime: 359000,
    poidsKg: 1300,
    bullets: [
      "Außenmaße (L×B×H): 6,0 m × 3,0 m × 2,6 m",
      "Fläche: 18,0 m²",
      "Fenster: 2x bodentiefes Fenster (1000 x 2000 mm)",
      "Türen: 1x Tür (Glas)",
      "Stärke Dämmung: 5,0 cm, ISO-PUR-Sandwichpaneele / Polyurethan",
      "Elektrik: 32A CEE-Stecker (rot), 3x Doppelsteckdose, 2x LED-Beleuchtung, 1x Lichtschalter, Sicherungskasten mit FI-Schalter",
      "Gewicht: 1300 kg",
      "Farbe Paneel: RAL7016 (anthrazit)",
    ],
    description:
      "Der Villex Big Cube Vertikal Nero 1.0 ist ein moderner Bürocontainer, der durch sein elegantes Design und seine funktionale Ausstattung besticht. Mit einer Länge von 6 Metern, einer Breite von 3 Metern und einer Höhe von 2,6 Metern bietet er großzügigen Raum für eine angenehme Arbeitsumgebung. Die anthrazitfarbene Ausführung (RAL7016) verleiht dem Container ein zeitloses Erscheinungsbild. Eine Glastür und zwei bodentiefe Fenster (je 1000 x 2000 mm) sorgen für viel Tageslicht und eine offene Atmosphäre. Die 5 cm starke Dämmung gewährleistet ein angenehmes Raumklima. Die elektrische Ausstattung umfasst einen 32A CEE-Stecker, drei Doppelsteckdosen, zwei LED-Leuchten und einen Lichtschalter, wodurch der Container für den professionellen Einsatz bestens geeignet ist.",
    shortDescription:
      "Moderner 6,0 × 3,0 m Bürocontainer mit Glastür und zwei bodentiefen Fenstern, anthrazitfarbenes Nero-Design (RAL7016).",
    imageCode: "BCVN1.0",
    fichiers: [
      "00_9d36c695a0.jpg",
      "01_3d4d7e08e5.jpg",
      "02_245903cecd.jpg",
      "03_c43300e842.jpg",
      "04_2d4a8e23cc.jpg",
      "05_bc3c339f22.jpg",
      "06_d867e3fe0b.jpg",
      "07_824022bc85.jpg",
    ],
  },
  {
    sku: "BBC-SON-017",
    slug: "villex-doppio-standard-cube-doppio-fenster-nero-1-0",
    name: "Villex Doppio Standard Cube Doppio Fenster Nero 1.0",
    priceCentsEstime: 459000,
    poidsKg: 2000,
    bullets: [
      "Außenmaße (L×B×H): 6,0 m × 4,8 m × 2,6 m",
      "Fläche: 28,8 m²",
      "Fenster: 2x Doppelfenster (2000 x 1000 mm) + 2x Standardfenster (1000 x 1000 mm)",
      "Türen: 1x Tür (Stahl)",
      "Stärke Dämmung: 5,0 cm, ISO-PUR-Sandwichpaneele / Polyurethan",
      "Elektrik: 32A CEE-Stecker (rot), 3x Doppelsteckdose, 2x LED-Beleuchtung, 1x Lichtschalter, Sicherungskasten mit FI-Schalter",
      "Gewicht: 2000 kg",
      "Farbe Paneel: RAL7016 (anthrazit)",
    ],
    description:
      "Der Villex Doppio Standard Cube Doppio Fenster Nero 1.0 ist eine moderne und funktionale Mehrfachanlage, bestehend aus zwei verbundenen Containern. Mit einer Gesamtlänge von 6,0 m, einer Breite von 4,8 m und einer Höhe von 2,6 m ist diese Anlage optimal für vielseitige Einsatzmöglichkeiten geeignet, beispielsweise als Büro-, Aufenthalts- oder Präsentationsraum. Die Isolierung mit einer Stärke von 5,0 cm sorgt für ein angenehmes Raumklima und Energieeffizienz. Die anthrazitfarbene Gestaltung der Paneele und des Grundrahmens (RAL7016) verleiht dem Cube ein zeitloses und stilvolles Erscheinungsbild. Ausgestattet mit einer gedämmten Stahltür bietet die Anlage nicht nur Witterungsbeständigkeit, sondern auch hohe Sicherheit. Die großzügige Fensteranordnung besteht aus zwei Doppelfenstern (je 2000 x 1000 mm) und zwei Standardfenstern (je 1000 x 1000 mm), wodurch viel natürliches Licht in die Innenräume gelangt. Die elektrische Ausstattung umfasst einen 32A CEE-Stecker, drei Doppelsteckdosen, zwei LED-Leuchten und einen Lichtschalter. Mit einem Gewicht von 2000 kg überzeugt die Anlage durch Stabilität und Langlebigkeit.",
    shortDescription:
      "Doppelmodul-Bürocontainer 6,0 × 4,8 m (28,8 m²) im Nero-Design, großzügige Fensterfront, für Büro-, Aufenthalts- oder Präsentationsräume.",
    imageCode: "DSTDCDFN1.0",
    fichiers: [
      "00_b54f5b6bfb.jpg",
      "01_9d8aa52cf2.jpg",
      "02_1ccec2f032.jpg",
      "03_ceaae5ae07.jpg",
      "04_ce20375116.jpg",
      "05_95d8753193.jpg",
      "06_e47d0fbfdb.jpg",
      "07_fb4c2a31f2.jpg",
    ],
  },
];

function config() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary n'est pas configuré.");
  }
  return { cloud_name, api_key, api_secret, secure: true };
}

async function envoyer(source: string, publicId: string): Promise<string> {
  const resultat: UploadApiResponse = await cloudinary.uploader.upload(source, {
    ...config(),
    folder: DOSSIER_PRODUITS,
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
    invalidate: true,
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
  });
  return resultat.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
}

async function main() {
  cloudinary.config(config());

  const categorie = await prisma.category.findFirst({ where: { slug: "sondercontainer" } });
  if (!categorie) throw new Error("Catégorie sondercontainer introuvable.");

  for (const fiche of FICHES) {
    console.log(`\n${fiche.sku} — ${fiche.name}`);

    const visuels: string[] = [];
    for (const [index, nomFichier] of fiche.fichiers.entries()) {
      const source = `https://www.villex-container.de/assets/products/${fiche.imageCode}/${nomFichier}`;
      const publicId = `${fiche.slug}-${String(index + 1).padStart(2, "0")}`;
      try {
        const url = await envoyer(source, publicId);
        visuels.push(url);
        console.log(`  visuel ${index + 1}/${fiche.fichiers.length} envoyé`);
      } catch (erreur) {
        console.log(`  ! visuel ${index + 1} refusé : ${(erreur as Error).message}`);
      }
    }

    const donnees = {
      categoryId: categorie.id,
      brand: MARQUE,
      name: fiche.name,
      sku: fiche.sku,
      mpn: fiche.sku,
      shortDescription: fiche.shortDescription,
      description: fiche.description,
      bullets: JSON.stringify(fiche.bullets),
      condition: "new",
      googleProductCategory: CATEGORIE_GOOGLE,
      priceCents: fiche.priceCentsEstime,
      shippingWeightGrams: fiche.poidsKg * 1000,
      stock: 5,
      active: true,
      ...(visuels.length > 0
        ? { image: visuels[0], images: JSON.stringify(visuels.slice(1)) }
        : {}),
    };

    await prisma.product.upsert({
      where: { slug: fiche.slug },
      update: donnees,
      create: { ...donnees, slug: fiche.slug },
    });
    console.log(`  fiche enregistree (prix estime : ${(fiche.priceCentsEstime / 100).toFixed(2)} EUR)`);
  }

  console.log("\nTerminé. Prix ESTIMÉS par comparaison, à valider/ajuster depuis /admin.");
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
