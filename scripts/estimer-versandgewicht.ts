import { prisma } from "../src/server/prisma";

/**
 * Estime le poids d'expédition (shippingWeightGrams) des produits qui n'en ont
 * pas encore, à partir du type et de la taille lus dans le nom et la catégorie.
 *
 * Ce sont des poids à vide (tare) approchés, alignés sur les valeurs usuelles du
 * marché : un 20 pieds standard pèse ~2,2 t, un 40 pieds High Cube ~3,9 t, un
 * conteneur aménagé (bureau, sanitaire) pèse davantage à surface égale à cause
 * de l'isolation, des menuiseries et des équipements. Google n'exige pas une
 * précision au kilo : il veut un ordre de grandeur cohérent pour ses règles de
 * livraison au poids.
 *
 * Ne touche jamais un poids déjà renseigné. Simulation par défaut :
 *   npx tsx --env-file=.env.local scripts/estimer-versandgewicht.ts
 *   npx tsx --env-file=.env.local scripts/estimer-versandgewicht.ts --appliquer
 */

const APPLIQUER = process.argv.includes("--appliquer");

interface Produit {
  id: string;
  sku: string;
  name: string;
  categorySlug: string;
}

/**
 * Rend le poids estimé en kilogrammes, ou null si le nom ne permet pas de
 * trancher. Les cas particuliers passent avant les coques nues.
 */
function estimerKg(p: Produit): { kg: number; note: string } | null {
  const n = p.name.toLowerCase();
  const has = (re: RegExp) => re.test(n);

  const pieds40 = has(/\b40\s*(fu(ß|ss)|['’])/);
  const pieds20 = has(/\b20\s*(fu(ß|ss)|['’])/);
  const pieds15 = has(/\b15\s*(fu(ß|ss)|['’])/);
  const pieds10 = has(/\b10\s*(fu(ß|ss)|['’])/);
  const hc = has(/high\s*cube|\bhc\b/);
  const ouvertureLat = has(/open\s*side|offener|seiten(t(ü|ue)r|(ö|oe)ffnung)|offene[rn]?\s*seite/);

  // --- Modules habitables / maisons modulaires (~24 m²) ---
  if (has(/modulares?\s*haus|modulares?\s*projekt|wohn-?\/?b(ü|ue)ro|wohneinheit/)) {
    return { kg: 3800, note: "module habitable ~24 m²" };
  }
  if (has(/premium[\s-]*modul/)) return { kg: 2800, note: "module premium" };

  // --- Conteneurs de chantier / mobiles vitrés ---
  if (has(/glas-?(container|b(ü|ue)ro)/)) return { kg: 1500, note: "conteneur vitré" };
  if (has(/panorama-?glas/)) return { kg: 1500, note: "conteneur vitré panoramique" };

  // --- Bureaux : dimensions en mètres, quel que soit l'ordre des mots ---
  if (p.categorySlug === "buerocontainer" || has(/b(ü|ue)ro/)) {
    if (has(/3[.,]5\d?\s*[x×]\s*2[.,]2/)) return { kg: 1600, note: "bureau 3,5 × 2,2 m" };
    if (has(/\b5\s*[x×]\s*2[.,]2/)) return { kg: 2200, note: "bureau 5 × 2,2 m" };
    if (has(/\b6\s*[x×]\s*3\b/)) return { kg: 2600, note: "bureau 6 × 3 m" };
    if (has(/\b6[.,]?0?0?\s*[x×]\s*2[.,]4/)) return { kg: 2300, note: "bureau 6 × 2,4 m" };
    if (has(/\bbad\b|dusche|k(ü|ue)che/)) return { kg: 2800, note: "bureau aménagé (bain/cuisine)" };
    if (has(/seecontainer/)) return { kg: 2600, note: "20' maritime aménagé bureau" };
    if (has(/panoramafenster/)) return { kg: 2400, note: "bureau mobile à grandes baies" };
    if (has(/\bbau\b|baucontainer/)) return { kg: 2200, note: "conteneur de chantier standard" };
    return { kg: 2300, note: "bureau, taille standard" };
  }

  // --- Sanitaires : plomberie, cuves, cloisons ---
  if (p.categorySlug === "sanitaercontainer" || has(/sanit(ä|ae)r/)) {
    if (has(/mini-?toilette|\b1\s*platz|reinigungseinheit/)) return { kg: 800, note: "sanitaire mono-poste" };
    if (has(/doppelt(er)?\b/)) return { kg: 2000, note: "sanitaire double avec cuve" };
    if (has(/\b2[.,]0?0?\s*[x×]\s*2[.,]0/)) return { kg: 900, note: "sanitaire 2 × 2 m" };
    return { kg: 1200, note: "bloc sanitaire" };
  }

  // --- Stockage : petites boîtes ---
  if (has(/lagercontainer/) && has(/\b2\s*[x×]\s*2\b/)) {
    return { kg: 900, note: "box de stockage 2 × 2 m" };
  }
  if (has(/16\s*rolltor/)) return { kg: 3000, note: "20' à 16 rideaux" };

  // --- Coques maritimes / de stockage, éventuellement modifiées ---
  if (pieds40) {
    if (has(/vollst(ä|ae)ndig\s*ausgestattet/)) return { kg: 4500, note: "40' HC entièrement équipé" };
    if (ouvertureLat && hc) return { kg: 4300, note: "40' HC ouverture latérale" };
    if (ouvertureLat) return { kg: 4000, note: "40' ouverture latérale" };
    if (hc) return { kg: 3900, note: "40' HC, coque" };
    return { kg: 3750, note: "40' standard, coque" };
  }
  if (pieds15) return { kg: 1900, note: "15', coque" };
  if (pieds10) {
    if (has(/k(ü|ue)hl|reefer/)) return { kg: 2000, note: "10' frigorifique" };
    if (has(/modifiziert/)) return { kg: 900, note: "10' modifié" };
    return { kg: 1300, note: "10', coque" };
  }
  if (pieds20) {
    if (ouvertureLat) return { kg: 2800, note: "20' ouverture latérale" };
    if (has(/doppelt(ü|ue)r/)) return { kg: 2450, note: "20' HC portes doubles" };
    if (hc) return { kg: 2350, note: "20' HC, coque" };
    return { kg: 2250, note: "20' standard, coque" };
  }

  return null;
}

async function main(): Promise<void> {
  const produits = (
    await prisma.product.findMany({
      where: { shippingWeightGrams: null },
      select: { id: true, sku: true, name: true, category: { select: { slug: true } } },
      orderBy: { sku: "asc" },
    })
  ).map((p) => ({ id: p.id, sku: p.sku, name: p.name, categorySlug: p.category.slug }));

  console.log(APPLIQUER ? "Application.\n" : "Simulation (ajoutez --appliquer pour écrire).\n");
  console.log(`${produits.length} produit(s) sans poids.\n`);

  let ecrits = 0;
  const nonClasses: string[] = [];

  for (const p of produits) {
    const est = estimerKg(p);
    if (!est) {
      nonClasses.push(`${p.sku}  ${p.name}`);
      continue;
    }
    console.log(`${p.sku.padEnd(12)} ${String(est.kg).padStart(5)} kg  (${est.note})  — ${p.name}`);
    if (APPLIQUER) {
      await prisma.product.update({
        where: { id: p.id },
        data: { shippingWeightGrams: est.kg * 1000 },
      });
    }
    ecrits += 1;
  }

  if (nonClasses.length) {
    console.log(`\nNon classés (${nonClasses.length}), à renseigner à la main :`);
    for (const l of nonClasses) console.log(`  ${l}`);
  }

  console.log(
    `\n${ecrits} poids ${APPLIQUER ? "écrits" : "à écrire"}.` +
      (APPLIQUER ? "" : "\nRelancez avec --appliquer pour écrire en base."),
  );
}

main()
  .catch((erreur: unknown) => {
    console.error("Échec :", erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
