/**
 * Retire les données de l'ancien projet (catalogue électroménager, groupe
 * "haushalt"/"multimedia", et le compte admin inconnu créé avant notre
 * reprise du projet) tout en conservant le groupe "container" et ses 6
 * catégories, ainsi que le compte admin arigal444@gmail.com.
 *
 * Usage : npx tsx --env-file=.env.local scripts/cleanup-old-project.ts
 */
import { prisma } from "../src/server/prisma";

const OLD_GROUP_SLUGS = ["haushalt", "multimedia"];
const UNKNOWN_ADMIN_EMAIL = "mouhsine.rasfa@gmail.com";

async function main() {
  for (const slug of OLD_GROUP_SLUGS) {
    const group = await prisma.group.findUnique({
      where: { slug },
      include: { categories: { include: { products: true } } },
    });
    if (!group) {
      console.log(`(déjà absent) ${slug}`);
      continue;
    }
    const productCount = group.categories.reduce((n, c) => n + c.products.length, 0);
    await prisma.group.delete({ where: { id: group.id } });
    console.log(
      `✓ Groupe "${group.label}" supprimé (${group.categories.length} catégories, ${productCount} produits)`,
    );
  }

  const unknownAdmin = await prisma.adminUser.findUnique({ where: { email: UNKNOWN_ADMIN_EMAIL } });
  if (unknownAdmin) {
    await prisma.adminUser.delete({ where: { id: unknownAdmin.id } });
    console.log(`✓ Compte admin inconnu supprimé : ${UNKNOWN_ADMIN_EMAIL}`);
  } else {
    console.log(`(déjà absent) ${UNKNOWN_ADMIN_EMAIL}`);
  }

  console.log("\n--- État final ---");
  const groups = await prisma.group.findMany({ include: { categories: true } });
  console.log(
    "Groupes restants:",
    groups.map((g) => `${g.label} (${g.categories.length} catégories)`),
  );
  const admins = await prisma.adminUser.findMany({ select: { email: true, role: true } });
  console.log("Admins restants:", admins);
  const productCount = await prisma.product.count();
  console.log("Produits restants:", productCount);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
