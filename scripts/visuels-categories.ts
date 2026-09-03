/**
 * Aligne le visuel d'en-tête de chaque page de rayon sur un vrai produit du
 * catalogue, plutôt que sur une photo d'ambiance générique.
 *
 * Met à jour la colonne `image` de la table Category avec le packshot du
 * produit le plus représentatif de chaque rayon, déjà hébergé sur le CDN.
 *
 * Lancement : npx tsx --env-file=.env.local scripts/visuels-categories.ts
 *   --ecrire  applique les changements (sinon simulation)
 */
import { prisma } from "../src/server/prisma";

const ECRIRE = process.argv.includes("--ecrire");

async function main(): Promise<void> {
  const categories = await prisma.category.findMany({
    include: { group: true },
    orderBy: [{ group: { position: "asc" } }, { position: "asc" }],
  });

  const journal: string[] = [];
  let remplacees = 0;

  for (const categorie of categories) {
    // Le mieux noté, puis le plus cher : celui qui donne la meilleure idée du
    // rayon, plutôt qu'un article d'entrée de gamme.
    const vedette = await prisma.product.findFirst({
      where: { categoryId: categorie.id, NOT: { image: null } },
      orderBy: [{ editorialRating: "desc" }, { priceCents: "desc" }],
      select: { brand: true, name: true, image: true },
    });

    if (!vedette?.image) {
      journal.push(`  ${categorie.slug.padEnd(18)} aucun produit avec visuel`);
      continue;
    }

    remplacees += 1;
    journal.push(`  ${categorie.slug.padEnd(18)} → ${vedette.brand} ${vedette.name.slice(0, 34)}`);

    if (ECRIRE) {
      await prisma.category.update({
        where: { id: categorie.id },
        data: { image: vedette.image },
      });
    }
  }

  console.log(ECRIRE ? "Mode écriture." : "Simulation, relancer avec --ecrire pour appliquer.");
  console.log(journal.join("\n"));
  console.log(`\n${remplacees}/${categories.length} visuels alignés sur un produit réel.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
