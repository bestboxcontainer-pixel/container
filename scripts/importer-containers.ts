/**
 * Installe le catalogue de conteneurs dans la base et ses visuels sur Cloudinary.
 *
 * Reprend `data/catalogue-containers.json`, produit par
 * `scripts/collecter-containers.ts`, et s'occupe de tout : le groupe, les cinq
 * catégories, les fiches produits, les visuels. Après passage, plus rien du
 * catalogue n'est écrit dans le code du site.
 *
 * IDEMPOTENT. Les `public_id` Cloudinary sont dérivés du slug et du rang de
 * l'image, jamais tirés au hasard : relancer le script réécrit les mêmes
 * fichiers au lieu d'en empiler des copies. Un visuel déjà en place est
 * reconnu et sauté, ce qui rend une reprise après interruption peu coûteuse.
 *
 * Ce que le script efface, volontairement :
 *   - les produits de démonstration au SKU « BBC-DEMO- », dont l'en-tête de
 *     `seed-container-katalog.ts` disait déjà que les prix étaient fictifs
 *   - les catégories « wohncontainer » et « baucontainer », absentes des cinq
 *     retenues ; leurs conteneurs se rangent sous « sondercontainer »
 *
 * APRÈS EXÉCUTION, PURGER LE CACHE : ce script écrit via Prisma et ne passe
 * donc pas par `invaliderCatalogue()`. Sans purge, les pages de catégorie
 * montrent les nouveaux produits pendant que les fiches répondent 404. Voir
 * l'avertissement en tête de `seed-container-katalog.ts`. Le script tente la
 * purge lui-même en fin de course en appelant la route de revalidation.
 *
 * Usage : npx tsx --env-file=.env.local scripts/importer-containers.ts
 *         npx tsx --env-file=.env.local scripts/importer-containers.ts --sans-images
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { prisma } from "../src/server/prisma";

const CATALOGUE = path.join(process.cwd(), "data", "catalogue-containers.json");
const DOSSIER_PRODUITS = "bbc-best-box/products";
const DOSSIER_CATEGORIES = "bbc-best-box/categories";

/** Nom du marchand : c'est BBC qui revend, pas le fournisseur d'origine. */
const MARQUE = "BBC Best Box";

/**
 * Taxonomie Google Merchant. 6413 = « Business & Industrial > Shipping
 * Containers ». Le flux `/feed/google` la reprend telle quelle.
 */
const CATEGORIE_GOOGLE = "6413";

interface FicheContainer {
  slug: string;
  name: string;
  categorie: string;
  sku: string;
  priceCents: number;
  condition: "new" | "used";
  shortDescription: string;
  description: string;
  bullets: string[];
  images: string[];
  familleSource: string;
}

/**
 * Les cinq catégories du site, avec le contenu déjà rédigé pour elles.
 *
 * Les libellés et les paragraphes viennent de la page `/sortiment` et des
 * cartes de l'accueil, où ils étaient écrits en dur. Ils passent en base :
 * c'est le back-office qui les tient désormais, pas le code.
 */
const CATEGORIES = [
  {
    slug: "seecontainer",
    label: "Seecontainer",
    description:
      "Robuste ISO-Container für Transport und Lagerung, neu und geprüft gebraucht.",
    guideIntro:
      "Robuste ISO-Container für Transport, Umschlag und Lagerung, neu oder geprüft gebraucht, in Standardgrößen.",
    visuel: "seecontainer-villex.png",
  },
  {
    slug: "lagercontainer",
    label: "Lagercontainer",
    description:
      "Wetterfeste Container zur sicheren Lagerung von Material, Werkzeug und Waren.",
    guideIntro:
      "Wetterfeste Stahlcontainer für die sichere Lagerung von Material, Werkzeug, Ersatzteilen und Waren. Abschließbar, isoliert oder unisoliert, in Standardgrößen von 6 bis 12 Metern.",
    visuel: "lagercontainer-villex.png",
  },
  {
    slug: "buerocontainer",
    label: "Bürocontainer",
    description:
      "Einzel- und Mehrfachanlagen als mobiles Büro auf der Baustelle oder im Betrieb.",
    guideIntro:
      "Mobile Büroeinheiten für Baustelle, Werksgelände oder Übergangslösung, einzeln oder als mehrgeschossige Anlage mit mehreren Modulen kombinierbar.",
    visuel: "buerocontainer-villex.png",
  },
  {
    slug: "sanitaercontainer",
    label: "Sanitärcontainer",
    description:
      "WC-, Dusch- und Waschcontainer für Baustellen, Events und Betriebsgelände.",
    guideIntro:
      "WC-, Dusch- und Waschcontainer für Baustellen, Veranstaltungen und Betriebsgelände, inklusive Frisch- und Abwassertechnik.",
    visuel: "sanitaercontainer-villex.png",
  },
  {
    slug: "sondercontainer",
    label: "Sondercontainer",
    description:
      "Individuelle Umbauten und Sonderanfertigungen nach Ihren Maßen und Anforderungen.",
    guideIntro:
      "Individuelle Umbauten nach Ihren Maßen, Werkstattcontainer, Verkaufsstände, Technikräume oder projektspezifische Sonderanfertigungen.",
    visuel: "sondercontainer-villex.png",
  },
] as const;

/** Phrase de clôture du guide, reprise du bas de l'ancienne page `/sortiment`. */
const CLOTURE =
  "Nicht das Richtige dabei? Wir realisieren auch individuelle Sonderanfertigungen nach Ihren Maßen. Sprechen Sie uns an.";

/** Catégories héritées du jeu de démonstration, hors des cinq retenues. */
const CATEGORIES_RETIREES = ["wohncontainer", "baucontainer"];

function config() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary n'est pas configuré : CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET.");
  }
  return { cloud_name, api_key, api_secret, secure: true };
}

/**
 * Envoie une image sur Cloudinary à partir de son URL d'origine.
 *
 * Cloudinary va chercher le fichier lui-même : rien ne transite par la machine
 * qui lance le script, et les 280 visuels ne touchent jamais le disque.
 */
async function envoyer(source: string, publicId: string, dossier: string): Promise<string> {
  const resultat: UploadApiResponse = await cloudinary.uploader.upload(source, {
    ...config(),
    folder: dossier,
    public_id: publicId,
    resource_type: "image",
    // Le public_id est déterministe : réécrire est justement ce qu'on veut.
    overwrite: true,
    invalidate: true,
    // 1600 px suffisent pour une fiche affichée au plus sur 800 px en Retina.
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
  });
  // f_auto/q_auto : Cloudinary sert de l'AVIF ou du WebP selon le navigateur.
  return resultat.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
}

/** Visuels déjà présents sur Cloudinary, pour ne pas les renvoyer deux fois. */
async function inventaireCloudinary(dossier: string): Promise<Map<string, string>> {
  const connus = new Map<string, string>();
  let curseur: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      ...config(),
      type: "upload",
      prefix: dossier,
      max_results: 500,
      next_cursor: curseur,
    });
    for (const ressource of page.resources as { public_id: string; secure_url: string }[]) {
      connus.set(ressource.public_id, ressource.secure_url.replace("/upload/", "/upload/f_auto,q_auto/"));
    }
    curseur = page.next_cursor as string | undefined;
  } while (curseur);
  return connus;
}

/**
 * Trois repères factuels par catégorie, recalculés à chaque import depuis les
 * fiches réellement en ligne. Rien n'est rédigé à l'avance : si le stock
 * change, le guide change avec lui.
 */
function reperes(fiches: FicheContainer[]): { heading: string; body: string }[] {
  const prix = fiches.map((f) => f.priceCents).sort((a, b) => a - b);
  const euros = (centimes: number) =>
    (centimes / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Les longueurs en pieds se lisent dans les désignations : « 20 Fuß », « 40 Fuß ».
  const tailles = [
    ...new Set(
      fiches
        .map((f) => f.name.match(/(\d{2})[\s-]*Fuß/i)?.[1])
        .filter((t): t is string => Boolean(t)),
    ),
  ].sort((a, b) => Number(a) - Number(b));

  const neufs = fiches.filter((f) => f.condition === "new").length;
  const occasions = fiches.length - neufs;

  const sections = [
    {
      heading: "Verfügbare Größen",
      body:
        tailles.length > 0
          ? `Aktuell im Bestand: ${tailles.map((t) => `${t} Fuß`).join(", ")}. Sondermaße auf Anfrage.`
          : "Maße nach Modell, Sondermaße auf Anfrage.",
    },
    {
      heading: "Zustand",
      body:
        occasions > 0
          ? `${neufs} Einheiten neu oder One-Trip, ${occasions} geprüft gebraucht. Jeder gebrauchte Container wird vor Auslieferung auf Dichtigkeit und Türfunktion geprüft.`
          : `Alle ${neufs} Einheiten neu oder One-Trip, direkt ab Werk.`,
    },
    {
      heading: "Preise",
      body: `${fiches.length} Modelle von ${euros(prix[0])} € bis ${euros(prix[prix.length - 1])} €, inkl. MwSt. Lieferung wird nach Entfernung berechnet.`,
    },
  ];

  return sections;
}

async function main() {
  const sansImages = process.argv.includes("--sans-images");
  cloudinary.config(config());

  const fiches = JSON.parse(await readFile(CATALOGUE, "utf8")) as FicheContainer[];
  console.log(`${fiches.length} fiches à installer.\n`);

  // ---------------------------------------------------------------- Groupe
  const groupe = await prisma.group.upsert({
    where: { slug: "container" },
    update: { label: "Container", position: 0 },
    create: { slug: "container", label: "Container", position: 0 },
  });

  // ------------------------------------------------------------ Catégories
  console.log("Catégories");
  const connusCategories = sansImages ? new Map<string, string>() : await inventaireCloudinary(DOSSIER_CATEGORIES);
  const idParSlug = new Map<string, string>();

  for (const [rang, categorie] of CATEGORIES.entries()) {
    const fichesCategorie = fiches.filter((f) => f.categorie === categorie.slug);

    let image = "";
    if (!sansImages) {
      const publicId = `${DOSSIER_CATEGORIES}/${categorie.slug}`;
      image =
        connusCategories.get(publicId) ??
        (await envoyer(
          path.join(process.cwd(), "public", "images", "kategorien", categorie.visuel),
          categorie.slug,
          DOSSIER_CATEGORIES,
        ));
    }

    const enregistree = await prisma.category.upsert({
      where: { groupId_slug: { groupId: groupe.id, slug: categorie.slug } },
      update: {
        label: categorie.label,
        description: categorie.description,
        guideIntro: categorie.guideIntro,
        guideClosing: CLOTURE,
        position: rang,
        ...(image ? { image } : {}),
      },
      create: {
        groupId: groupe.id,
        slug: categorie.slug,
        label: categorie.label,
        description: categorie.description,
        guideIntro: categorie.guideIntro,
        guideClosing: CLOTURE,
        position: rang,
        image,
      },
    });
    idParSlug.set(categorie.slug, enregistree.id);

    // Le guide est recalculé à chaque passage : les anciennes sections partent.
    await prisma.guideSection.deleteMany({ where: { categoryId: enregistree.id } });
    if (fichesCategorie.length > 0) {
      await prisma.guideSection.createMany({
        data: reperes(fichesCategorie).map((section, position) => ({
          categoryId: enregistree.id,
          heading: section.heading,
          body: section.body,
          position,
        })),
      });
    }

    console.log(`  ✓ ${categorie.label.padEnd(20)} ${String(fichesCategorie.length).padStart(2)} conteneurs`);
  }

  // ------------------------------------------------- Ménage de l'ancien jeu
  const demos = await prisma.product.deleteMany({ where: { sku: { startsWith: "BBC-DEMO-" } } });
  const retirees = await prisma.category.deleteMany({
    where: { groupId: groupe.id, slug: { in: CATEGORIES_RETIREES } },
  });
  const autresGroupes = await prisma.group.deleteMany({ where: { slug: { not: "container" } } });
  console.log(
    `\nMénage : ${demos.count} fiches de démonstration, ${retirees.count} catégories hors périmètre, ${autresGroupes.count} groupes hérités.`,
  );

  // ---------------------------------------------------------------- Fiches
  console.log("\nConteneurs");
  const connusProduits = sansImages ? new Map<string, string>() : await inventaireCloudinary(DOSSIER_PRODUITS);
  let envoyes = 0;
  let reutilises = 0;

  for (const [rang, fiche] of fiches.entries()) {
    const categoryId = idParSlug.get(fiche.categorie);
    if (!categoryId) throw new Error(`Catégorie inconnue : ${fiche.categorie}`);

    const visuels: string[] = [];
    if (!sansImages) {
      for (const [index, source] of fiche.images.entries()) {
        const nom = `${fiche.slug}-${String(index + 1).padStart(2, "0")}`;
        const publicId = `${DOSSIER_PRODUITS}/${nom}`;
        const deja = connusProduits.get(publicId);
        if (deja) {
          visuels.push(deja);
          reutilises += 1;
          continue;
        }
        try {
          visuels.push(await envoyer(source, nom, DOSSIER_PRODUITS));
          envoyes += 1;
        } catch (erreur) {
          console.log(`     ! visuel ${index + 1} refusé : ${(erreur as Error).message}`);
        }
      }
    }

    const donnees = {
      categoryId,
      brand: MARQUE,
      name: fiche.name,
      sku: fiche.sku,
      shortDescription: fiche.shortDescription,
      description: fiche.description,
      bullets: JSON.stringify(fiche.bullets),
      condition: fiche.condition,
      googleProductCategory: CATEGORIE_GOOGLE,
      priceCents: fiche.priceCents,
      // Un conteneur d'occasion est une pièce unique ; les neufs se
      // réapprovisionnent. Le stock réel se règle depuis le back-office.
      stock: fiche.condition === "used" ? 1 : 5,
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

    process.stdout.write(
      `\r  ${String(rang + 1).padStart(2)}/${fiches.length}  ${fiche.name.slice(0, 52).padEnd(52)}`,
    );
  }
  console.log("\n");

  if (!sansImages) {
    console.log(`Visuels : ${envoyes} envoyés, ${reutilises} déjà en place.`);
  }

  const total = await prisma.product.count();
  const sansVisuel = await prisma.product.count({ where: { OR: [{ image: null }, { image: "" }] } });
  const locaux = await prisma.product.count({ where: { image: { startsWith: "/" } } });
  console.log(`Base : ${total} conteneurs, ${sansVisuel} sans visuel, ${locaux} sur visuel local.`);
  console.log("\nRAPPEL : purger le cache du catalogue (redémarrer le serveur, ou enregistrer une fiche depuis /admin).");
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
