import { prisma } from "../src/server/prisma";
import { GOOGLE_CATEGORY_BY_SLUG } from "../src/lib/googleTaxonomy";

// Enrichissement des produits existants avec les attributs Google Merchant Center
// qui peuvent être déduits honnêtement des données déjà présentes :
//
//   - googleProductCategory : déduite de la catégorie de la boutique
//   - condition             : "new" pour tout le catalogue (neuf)
//   - mpn                   : désignation de modèle contenue dans le nom du produit
//
// Ce qui n'est JAMAIS inventé, parce qu'un chiffre faux fait refuser le compte :
//   - gtin                  : le code-barres doit être relevé sur l'emballage
//   - shippingWeightGrams   : à peser ou à reprendre de la fiche fabricant
//   - energyEfficiencyClass : à reprendre de l'étiquette énergie officielle
//
// Lancement : npx tsx scripts/enrich-merchant-data.ts

/**
 * Mots génériques désignant le type de produit. Ils décrivent la catégorie, pas
 * le modèle : on les retire pour isoler la désignation du fabricant.
 */
const TYPE_WORDS = [
  "Gaming-Notebook",
  "Gaming-Headset",
  "Desktop-PC",
  "Lenkrad",
  "Pedalen",
  "PC",
  "Einbaubackofen",
  "Einbauherd-Set",
  "Einbauherd",
  "Backofen",
  "Herd",
  "Geschirrspüler",
  "Waschmaschine",
  "Kaffeevollautomat",
  "Kaffeemaschine",
  "Küchenmaschine",
  "Split-Klimagerät",
  "Klimagerät",
  "Klimaanlage",
  "Bodenstaubsauger",
  "Akkusauger",
  "Saugroboter",
  "Staubsauger",
  "Fernseher",
  "Notebook",
  "Desktop",
  "Smartwatch",
  "Smartphone",
  "Drohne",
  "Controller",
  "Headset",
];

/** Adjectifs et prépositions purement descriptifs : ils ne font pas un modèle. */
const DESCRIPTIVE_WORDS = new Set([
  "mit",
  "ohne",
  "und",
  "für",
  "vollintegrierbar",
  "teilintegrierbar",
  "unterbaufähig",
  "freistehend",
  "mobiles",
  "mobile",
  "mobil",
]);

/** Valeur portant son unité collée : 55", 4K, 9kg. */
const SPEC_WITH_UNIT = /^(\d+[.,]?\d*)(["”]|k|kg|g|w|kw|btu|gb|tb|zoll)$/i;
/** Nombre nu, sans unité : le « 1200 » de « 1200 W », le « 12 » de « OnePlus 12 ». */
const BARE_NUMBER = /^\d+[.,]?\d*$/;
/** Unité isolée, séparée de sa valeur par une espace ("1200 W", "9000 BTU"). */
const UNIT_TOKEN = /^(kw|kg|w|g|btu|gb|tb|zoll|mhz|ghz|l|ml)$/i;

/**
 * Vrai lorsque tous les jetons ne sont que des caractéristiques techniques.
 *
 * Deux nuances évitent de jeter une vraie désignation de modèle :
 *   - un nombre nu n'est une caractéristique que si son unité le suit
 *     (« 1200 W ») ; seul, c'est le modèle, OnePlus 12, Xiaomi 14 ;
 *   - une unité isolée ne compte que si un nombre la précède, sinon
 *     « G 7000 » (Miele) serait lu comme « 7000 grammes ».
 */
function isSpecOnly(tokens: string[]): boolean {
  return tokens.every((token, index) => {
    if (SPEC_WITH_UNIT.test(token)) return true;
    if (BARE_NUMBER.test(token)) return UNIT_TOKEN.test(tokens[index + 1] ?? "");
    const previous = tokens[index - 1] ?? "";
    return UNIT_TOKEN.test(token) && index > 0 && /^\d/.test(previous);
  });
}

/**
 * Extrait du nom commercial la désignation de modèle du fabricant.
 * Retourne null lorsque rien de fiable ne subsiste : mieux vaut un champ vide
 * qu'un identifiant inventé.
 */
export function deriveModelReference(name: string): string | null {
  // Tout ce qui suit une virgule est une déclinaison (", 9 kg", ", 256 GB").
  let base = name.split(",")[0] ?? "";

  // Une proposition introduite par "mit"/"ohne" décrit une option, pas le modèle.
  base = base.replace(/\s+(mit|ohne)\s+.*$/i, "");

  // Les mots composés d'abord ("Gaming-Notebook" avant "Notebook"), sinon il
  // resterait un fragment de mot dans la référence.
  for (const word of [...TYPE_WORDS].sort((a, b) => b.length - a.length)) {
    base = base.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  }

  const tokens = base
    .split(/\s+/)
    .map((token) => token.replace(/^[-, , /]+|[-, , /]+$/g, "").trim())
    .filter(Boolean)
    .filter((token) => !DESCRIPTIVE_WORDS.has(token.toLowerCase()));

  if (tokens.length === 0) return null;
  // Uniquement des caractéristiques techniques : ce n'est pas une référence.
  if (isSpecOnly(tokens)) return null;

  const reference = tokens.join(" ").replace(/\s{2,}/g, " ").trim();
  return reference.length >= 2 ? reference.slice(0, 70) : null;
}

interface Counters {
  googleCategory: number;
  condition: number;
  mpn: number;
  untouched: number;
}

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      condition: true,
      googleProductCategory: true,
      mpn: true,
      gtin: true,
      shippingWeightGrams: true,
      category: { select: { slug: true, label: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const counters: Counters = { googleCategory: 0, condition: 0, mpn: 0, untouched: 0 };
  const withoutMpn: string[] = [];
  const withoutCategory: string[] = [];

  for (const product of products) {
    const data: {
      googleProductCategory?: string;
      condition?: string;
      mpn?: string;
    } = {};

    if (!product.googleProductCategory.trim()) {
      const mapped = GOOGLE_CATEGORY_BY_SLUG[product.category.slug];
      if (mapped) {
        data.googleProductCategory = mapped.id;
        counters.googleCategory += 1;
      } else {
        withoutCategory.push(`${product.brand} ${product.name} (${product.category.slug})`);
      }
    }

    if (product.condition !== "new" && product.condition !== "refurbished" && product.condition !== "used") {
      data.condition = "new";
      counters.condition += 1;
    }

    if (!product.mpn?.trim()) {
      const reference = deriveModelReference(product.name);
      if (reference) {
        data.mpn = reference;
        counters.mpn += 1;
      } else {
        withoutMpn.push(`${product.brand} ${product.name}`);
      }
    }

    if (Object.keys(data).length === 0) {
      counters.untouched += 1;
      continue;
    }

    await prisma.product.update({ where: { id: product.id }, data });
  }

  const missingGtin = products.filter((product) => !product.gtin?.trim()).length;
  const missingWeight = products.filter((product) => !product.shippingWeightGrams).length;

  console.log(`Produits traités          : ${products.length}`);
  console.log(`Catégories Google posées  : ${counters.googleCategory}`);
  console.log(`Conditions normalisées    : ${counters.condition}`);
  console.log(`MPN dérivés du nom        : ${counters.mpn}`);
  console.log(`Déjà complets             : ${counters.untouched}`);
  console.log("");
  console.log("À compléter par le commerçant :");
  console.log(`  GTIN (EAN) manquants    : ${missingGtin}`);
  console.log(`  Poids d'expédition      : ${missingWeight}`);

  if (withoutMpn.length > 0) {
    console.log("");
    console.log(`  Sans MPN dérivable (${withoutMpn.length}), à saisir à la main :`);
    for (const label of withoutMpn) console.log(`    - ${label}`);
  }

  if (withoutCategory.length > 0) {
    console.log("");
    console.log(`  Sans correspondance de catégorie Google (${withoutCategory.length}) :`);
    for (const label of withoutCategory) console.log(`    - ${label}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
