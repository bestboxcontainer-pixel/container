/**
 * Crée le groupe et les 6 catégories de base (mêmes libellés que /sortiment)
 * pour que l'admin ait une structure de départ où ajouter de vrais produits.
 * Aucun produit n'est inventé : ce script ne crée que l'organisation du
 * catalogue, pas de fausses données commerciales.
 *
 * Usage : npx tsx --env-file=.env.local scripts/seed-categories.ts
 */
import { prisma } from "../src/server/prisma";

const CATEGORIES = [
  { slug: "lagercontainer", label: "Lagercontainer" },
  { slug: "buerocontainer", label: "Bürocontainer" },
  { slug: "wohncontainer", label: "Wohncontainer" },
  { slug: "sanitaercontainer", label: "Sanitärcontainer" },
  { slug: "baucontainer", label: "Baucontainer" },
  { slug: "sondercontainer", label: "Sondercontainer" },
] as const;

async function main() {
  const group = await prisma.group.upsert({
    where: { slug: "container" },
    update: {},
    create: { slug: "container", label: "Container", position: 0 },
  });

  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { groupId_slug: { groupId: group.id, slug: category.slug } },
      update: {},
      create: {
        groupId: group.id,
        slug: category.slug,
        label: category.label,
        position: index,
      },
    });
    console.log(`✓ ${category.label}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
