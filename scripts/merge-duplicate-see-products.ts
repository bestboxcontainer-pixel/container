/**
 * Fusionne deux paires de fiches Seecontainer au contenu strictement
 * dupliqué (repéré lors de la revérification Merchant Center du
 * 2026-09-04) : BBC-SEE-002/BBC-SEE-004 et BBC-SEE-008/BBC-SEE-009
 * décrivaient chacune le même modèle avec la même description et les mêmes
 * caractéristiques, juste sous des SKU et des photos différentes.
 *
 * Confirmé avant exécution : aucune des deux fiches supprimées n'a de
 * commande, avis, mouvement de stock ni campagne liée (voir l'audit
 * `_check-before-merge.ts`, jeté après usage) — rien de réel n'est perdu.
 *
 * La fiche conservée (le plus petit SKU) récupère les photos de l'autre
 * dans sa galerie ; les bullets qui n'étaient pas déjà présents sont
 * ajoutés (BBC-SEE-009 avait une phrase marketing propre, conservée).
 *
 * Usage : npx tsx --env-file=.env.local scripts/merge-duplicate-see-products.ts
 */
import { prisma } from "../src/server/prisma";

interface Fusion {
  garder: string;
  supprimer: string;
}

const FUSIONS: Fusion[] = [
  { garder: "BBC-SEE-002", supprimer: "BBC-SEE-004" },
  { garder: "BBC-SEE-008", supprimer: "BBC-SEE-009" },
];

async function main() {
  for (const { garder, supprimer } of FUSIONS) {
    const survivant = await prisma.product.findFirst({ where: { sku: garder } });
    const doublon = await prisma.product.findFirst({ where: { sku: supprimer } });
    if (!survivant || !doublon) {
      console.log(`! Paire ${garder}/${supprimer} introuvable, ignorée`);
      continue;
    }

    const imagesSurvivant: string[] = JSON.parse(survivant.images || "[]");
    const imagesDoublon: string[] = [doublon.image, ...(JSON.parse(doublon.images || "[]") as string[])].filter(
      (u): u is string => Boolean(u),
    );
    const imagesFusionnees = [...new Set([...imagesSurvivant, ...imagesDoublon])];

    const bulletsSurvivant: string[] = JSON.parse(survivant.bullets || "[]");
    const bulletsDoublon: string[] = JSON.parse(doublon.bullets || "[]");
    const bulletsFusionnes = [...new Set([...bulletsSurvivant, ...bulletsDoublon])];

    await prisma.product.update({
      where: { id: survivant.id },
      data: {
        images: JSON.stringify(imagesFusionnees),
        bullets: JSON.stringify(bulletsFusionnes),
      },
    });
    await prisma.product.delete({ where: { id: doublon.id } });

    console.log(
      `✓ ${supprimer} fusionné dans ${garder} : ${imagesFusionnees.length} photos, ${bulletsFusionnes.length} bullets`,
    );
  }

  await prisma.$disconnect();
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
