import { prisma } from "../src/server/prisma";

/**
 * Uniformise la présentation des dimensions dans les puces produit.
 *
 * Cible unique, en millimètres, séparateur de milliers « . » :
 *   Außenmaße (L × B × H): 6.058 × 2.438 × 2.591 mm
 *   Innenmaße (L × B × H): 5.898 × 2.352 × 2.393 mm
 *
 * Conversions :
 *  - mm  : valeurs reprises telles quelles, seul le format change ;
 *  - m   : × 1000 (« 6,06 m » -> 6.060) ;
 *  - cm  : × 10 ;
 *  - pieds d'un conteneur (20', 8', 8'6") -> cote ISO correspondante.
 *  - une valeur métrique à ±5 mm d'une cote ISO (6,06 m -> 6.058) est recalée ;
 *    les valeurs franches (3,0 m d'un module) sont laissées telles quelles.
 *
 * Ne touche qu'aux puces « Außenmaß(e) (L × B [× H]) » / « Innenmaß(e) … » et à
 * la forme « six puces séparées » (Außenlänge/-breite/-höhe). Les libellés
 * exotiques (H × B × T…) et tout le reste sont signalés, pas modifiés.
 *
 * Simulation par défaut ; --appliquer pour écrire.
 */

const APPLIQUER = process.argv.includes("--appliquer");

const ISO = [6058, 12192, 5898, 12032, 2438, 2352]; // longueurs + largeurs ISO seulement
const snap = (mm: number): number => ISO.find((v) => Math.abs(v - mm) <= 5) ?? mm;

const PIEDS_L: Record<string, number> = { "10": 2991, "20": 6058, "40": 12192 };
const PIEDS_B: Record<string, number> = { "8": 2438 };
const groupeDE = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

type Unite = "mm" | "cm" | "m";

/** Un scalaire métrique/mm/cm -> mm (avec recalage ISO pour m et cm). */
function scalaire(token: string, unite: Unite): number | null {
  const t = token.trim();
  if (unite === "mm") {
    const n = parseInt(t.replace(/\./g, ""), 10);
    return Number.isNaN(n) ? null : n;
  }
  const val = parseFloat(t.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  if (Number.isNaN(val)) return null;
  return snap(Math.round(unite === "cm" ? val * 10 : val * 1000));
}

/** Notation en pieds « 20' L × 8' B × 8'6'' H » -> [L, B, H] en mm ISO. */
function depuisPieds(valeur: string): number[] | null {
  const parts = valeur
    .replace(/\([^)]*\)\s*$/, "")
    .split(/\s*[x×]\s*/i)
    .map((p) => p.trim());
  if (parts.length !== 3) return null;
  const nums = parts.map((p, i) => {
    const ft = p.match(/(\d+)\s*(?:'|’|fuß|ft)/i);
    const inch = p.match(/(\d+(?:[.,]\d+)?)\s*(?:''|’’|"|zoll|in)/i);
    if (!ft) {
      // « 6,9 m L » : mètres au milieu d'une notation pieds
      const m = p.match(/([\d.,]+)\s*m/i);
      return m ? snap(Math.round(parseFloat(m[1].replace(",", ".")) * 1000)) : null;
    }
    if (i === 0 && !inch && PIEDS_L[ft[1]] !== undefined) return PIEDS_L[ft[1]];
    if (i === 1 && !inch && PIEDS_B[ft[1]] !== undefined) return PIEDS_B[ft[1]];
    if (i === 2) {
      const key = `${ft[1]}'${inch ? inch[1] : ""}`;
      if (key === "8'6" || key === "8'6.0") return 2591;
      if (key === "9'6" || key === "9'6.0") return 2896;
    }
    return Math.round(
      parseInt(ft[1], 10) * 304.8 + (inch ? parseFloat(inch[1].replace(",", ".")) * 25.4 : 0),
    );
  });
  return nums.every((n) => n !== null) ? (nums as number[]) : null;
}

/** Extrait [L, B, (H)] en mm d'une valeur « A × B × C  unité ». */
function dimensions(valeur: string): number[] | null {
  const v = valeur.replace(/\([^)]*\)\s*$/, "").trim();
  if (/['’]|fuß|zoll/i.test(v)) return depuisPieds(valeur);

  const unite: Unite = /\bmm\b/i.test(v) ? "mm" : /\bcm\b/i.test(v) ? "cm" : "m";
  const tokens = v
    .replace(/\b(mm|cm|m)\b\.?/gi, "")
    .split(/\s*[x×]\s*/i)
    .map((p) => p.replace(/\b[LBHTlbht]\b\.?/g, "").trim())
    .filter(Boolean);
  if (tokens.length < 2 || tokens.length > 3) return null;
  const mm = tokens.map((t) => scalaire(t, unite));
  return mm.every((n) => n !== null && n > 0) ? (mm as number[]) : null;
}

function ligne(aussen: boolean, mm: number[], note: string): string {
  const axes = mm.length === 3 ? "L × B × H" : "L × B";
  return `${aussen ? "Außenmaße" : "Innenmaße"} (${axes}): ${mm.map(groupeDE).join(" × ")} mm${
    note ? ` ${note.trim()}` : ""
  }`;
}

// Libellé accepté : « Außenmaß », « Außenmaße », « … (L×B×H) », « … (LxBxH) », « … (L×B) ».
const LABEL_OK = /^(au(ß|ss)en|innen)ma(ß|ss)e?(\s*\(\s*l\s*[x×]\s*b(\s*[x×]\s*h)?\s*\))?$/i;
const SEP_AXE = /^(au(ß|ss)en|innen)(länge|breite|höhe)\s*:/i;

async function main(): Promise<void> {
  const produits = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, bullets: true },
    orderBy: { sku: "asc" },
  });
  console.log(APPLIQUER ? "Application.\n" : "Simulation (ajoutez --appliquer).\n");

  let modifies = 0;
  const aRevoir: string[] = [];

  for (const p of produits) {
    let bullets: string[];
    try { bullets = JSON.parse(p.bullets); } catch { continue; }
    const avant = JSON.stringify(bullets);

    // 1) Six puces séparées -> deux puces consolidées.
    for (const aussen of [false, true]) {
      const pre = aussen ? "au(ß|ss)en" : "innen";
      const trouve = ["länge", "breite", "höhe"].map((axe) =>
        bullets.find((b) => new RegExp(`^${pre}${axe}\\s*:`, "i").test(b)),
      );
      if (trouve.some((b) => !b)) continue; // set incomplet : on n'y touche pas
      const mm = trouve.map((b) => {
        const g = b!.match(/\((\d[\d.]*)\s*mm\)/) ?? b!.match(/:\s*([\d.]+)\s*mm/);
        return g ? parseInt(g[1].replace(/\./g, ""), 10) : NaN;
      });
      if (mm.some((n) => Number.isNaN(n))) continue;
      bullets = bullets.filter((b) => !trouve.includes(b));
      bullets.unshift(ligne(aussen, mm, ""));
    }

    // 2) Puces « Außenmaß(e) … : … » sur une ligne.
    bullets = bullets.map((b) => {
      if (SEP_AXE.test(b)) return b;
      const parts = b.match(/^([^:]{2,40}):\s*(.+)$/);
      if (!parts) return b;
      const label = parts[1].trim();
      if (!LABEL_OK.test(label)) return b;
      if (/^(au(ß|ss)en|innen)maße \(L × [BH]/.test(b)) return b; // déjà à la cible
      const note = parts[2].match(/\(([^)]*)\)\s*$/)?.[0] ?? "";
      const mm = dimensions(parts[2]);
      if (!mm) {
        aRevoir.push(`${p.sku}  « ${b} »`);
        return b;
      }
      return ligne(/^au(ß|ss)en/i.test(label), mm, note);
    });

    const apres = JSON.stringify(bullets);
    if (apres === avant) continue;
    modifies += 1;
    console.log(`[${p.sku}] ${p.name}`);
    const old: string[] = JSON.parse(avant);
    const n = Math.max(old.length, bullets.length);
    for (let i = 0; i < n; i++) {
      if (old[i] !== bullets[i]) {
        if (old[i] !== undefined) console.log(`   -  ${old[i]}`);
        if (bullets[i] !== undefined) console.log(`   +  ${bullets[i]}`);
      }
    }
    console.log();
    if (APPLIQUER) await prisma.product.update({ where: { id: p.id }, data: { bullets: apres } });
  }

  if (aRevoir.length) {
    console.log(`À revoir à la main (${aRevoir.length}) :`);
    for (const l of aRevoir) console.log(`  ${l}`);
    console.log();
  }
  console.log(`${modifies} fiche(s) ${APPLIQUER ? "modifiée(s)" : "à modifier"}.`);
}

main()
  .catch((e: unknown) => { console.error("Échec :", e instanceof Error ? e.message : e); process.exit(1); })
  .finally(() => prisma.$disconnect());
