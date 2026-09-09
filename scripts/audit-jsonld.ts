import { prisma } from "../src/server/prisma";
import { loadMerchantProducts } from "../src/server/merchant";
import { buildProductJsonLdData, checkProductJsonLd } from "../src/server/productJsonLd";

/**
 * Contrôle le balisage JSON-LD `Product` de chaque fiche du catalogue.
 *
 * Vérifie, produit par produit, la présence et la validité des champs que Google
 * exige pour une fiche marchande :
 *
 *   Product : name, image, description, sku, brand
 *   Offer   : price, priceCurrency, availability, itemCondition
 *
 * L'objet est construit exactement comme le composant <ProductJsonLd> le rend en
 * SSR (même fonction `buildProductJsonLdData`), donc ce que ce script valide est
 * ce qui part dans le HTML initial.
 *
 * Lancement :
 *   npx tsx --env-file=.env.local scripts/audit-jsonld.ts
 *   npx tsx --env-file=.env.local scripts/audit-jsonld.ts --show <SKU>
 *
 * Sort en code 1 si au moins une fiche a un champ obligatoire manquant.
 */

const SHOW_IDX = process.argv.indexOf("--show");
const SHOW_SKU = SHOW_IDX >= 0 ? process.argv[SHOW_IDX + 1] : undefined;

async function main(): Promise<void> {
  const products = await loadMerchantProducts({ includeInactive: true });

  if (SHOW_SKU) {
    const row = products.find((p) => p.sku === SHOW_SKU);
    if (!row) {
      console.error(`SKU ${SHOW_SKU} introuvable.`);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(buildProductJsonLdData(row, []), null, 2));
    return;
  }

  let avecProbleme = 0;
  for (const row of products) {
    const data = buildProductJsonLdData(row, []);
    const issues = checkProductJsonLd(data);
    if (issues.length === 0) continue;
    avecProbleme += 1;
    console.log(`\n[${row.sku || "(sans SKU)"}] ${row.name}${row.active ? "" : "  (désactivé)"}`);
    for (const issue of issues) {
      console.log(`   ✗ ${issue.path} — ${issue.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Fiches contrôlées ....... ${products.length}`);
  console.log(`Avec champ manquant ..... ${avecProbleme}`);
  console.log("=".repeat(60));
  if (avecProbleme === 0) {
    console.log("Toutes les fiches portent name, image, description, sku, brand");
    console.log("et une offre complète (price, priceCurrency, availability, itemCondition).");
  }

  process.exitCode = avecProbleme > 0 ? 1 : 0;
}

main()
  .catch((erreur: unknown) => {
    console.error("Échec :", erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
