import { prisma } from "../src/server/prisma";
import { auditCatalog } from "../src/server/merchant";

/**
 * Audit complet du catalogue pour Google Merchant Center.
 *
 * Contrôle, SKU par SKU, ce qui doit rester synchronisé entre le flux, la fiche
 * produit (landing) et la caisse : titre, prix, disponibilité, délai, état
 * new/used, image principale, identifiants (SKU/GTIN/MPN), marque, catégorie et
 * conditions de livraison. La vérité vient d'une seule source, `buildMerchantRecord()`,
 * que le flux ET le balisage JSON-LD de la fiche utilisent : un écart signalé ici
 * est un écart réel entre ce que Google lit et ce que le client voit.
 *
 * Lancement :
 *   npx tsx --env-file=.env.local scripts/audit-merchant.ts
 *   npx tsx --env-file=.env.local scripts/audit-merchant.ts --errors-only
 *   npx tsx --env-file=.env.local scripts/audit-merchant.ts --json
 *
 * Sort en code 1 si au moins un produit est bloqué (au moins une erreur), pour
 * pouvoir servir de garde en CI.
 */

const ERRORS_ONLY = process.argv.includes("--errors-only");
const AS_JSON = process.argv.includes("--json");

async function main(): Promise<void> {
  const overview = await auditCatalog();

  if (AS_JSON) {
    console.log(JSON.stringify(overview, null, 2));
    process.exitCode = overview.blocked > 0 ? 1 : 0;
    return;
  }

  console.log("Audit Google Merchant Center\n" + "=".repeat(60));
  console.log(`Produits contrôlés .......... ${overview.total}`);
  console.log(`  dont dans le flux (actifs)  ${overview.feedCount}`);
  console.log(`Prêts (aucune erreur) ....... ${overview.ready}`);
  console.log(`Bloqués (au moins 1 erreur) . ${overview.blocked}`);
  console.log(`Prêts mais avec avertissement  ${overview.withWarnings}`);
  console.log(`Sans GTIN ................... ${overview.missingGtin}`);
  console.log(`Sans MPN ................... ${overview.missingMpn}`);
  console.log(`Sans image propre .......... ${overview.missingOwnImage}`);
  console.log("=".repeat(60) + "\n");

  const shown = overview.audits
    .filter((audit) => (ERRORS_ONLY ? audit.issues.some((i) => i.level === "error") : audit.issues.length > 0))
    .sort((a, b) => {
      const ea = a.issues.filter((i) => i.level === "error").length;
      const eb = b.issues.filter((i) => i.level === "error").length;
      return eb - ea || b.issues.length - a.issues.length;
    });

  if (shown.length === 0) {
    console.log(ERRORS_ONLY ? "Aucun produit bloqué." : "Aucun produit à signaler.");
  }

  for (const audit of shown) {
    const errs = audit.issues.filter((i) => i.level === "error").length;
    const warns = audit.issues.filter((i) => i.level === "warning").length;
    const flag = errs > 0 ? "BLOQUÉ" : "avert.";
    console.log(`[${flag}] ${audit.sku || "(sans SKU)"} — ${audit.title}`);
    console.log(`         ${audit.categoryLabel}${audit.active ? "" : "  (désactivé)"}`);
    console.log(`         ${audit.href}`);
    for (const issue of audit.issues) {
      console.log(`   ${issue.level === "error" ? "✗" : "!"} [${issue.attribute}] ${issue.message}`);
    }
    console.log(`   → ${errs} erreur(s), ${warns} avertissement(s)\n`);
  }

  process.exitCode = overview.blocked > 0 ? 1 : 0;
}

main()
  .catch((error: unknown) => {
    console.error("Échec :", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
