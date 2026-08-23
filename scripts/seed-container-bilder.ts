/**
 * Donne une image à chacune des 6 catégories de conteneurs.
 *
 * Pourquoi c'est nécessaire : dans `toViewProduct`, un produit sans visuel
 * propre reprend celui de sa catégorie (`row.image || row.category.image`).
 * Tant que les deux sont vides, la vignette reçoit `src=""`, ce qui affiche
 * une icône d'image brisée et fait recharger la page entière par le
 * navigateur. Renseigner la catégorie suffit donc à couvrir tous ses produits.
 *
 * Origine des visuels : rendus fournis par le client, un par catégorie, rangés
 * sous /public/images/kategorien/ avec le slug de la catégorie pour nom. Le
 * nommage est volontairement littéral : une affectation qui se vérifie d'un
 * coup d'œil ne se trompe pas de sujet.
 *
 * APRÈS EXÉCUTION, PURGER LE CACHE : ce script écrit via Prisma et contourne
 * donc `invaliderCatalogue()`. Voir l'avertissement en tête de
 * seed-container-katalog.ts. Arrêter le serveur, supprimer `.next` en entier
 * (pas seulement `.next/cache`), relancer.
 *
 * Usage : npx tsx --env-file=.env.local scripts/seed-container-bilder.ts
 */
import { prisma } from "../src/server/prisma";

const SLUGS = [
  "lagercontainer",
  "buerocontainer",
  "wohncontainer",
  "sanitaercontainer",
  "baucontainer",
  "sondercontainer",
] as const;

const IMAGES: Record<string, string> = Object.fromEntries(
  SLUGS.map((slug) => [slug, `/images/kategorien/${slug}.png`]),
);

async function main() {
  const group = await prisma.group.findUnique({ where: { slug: "container" } });
  if (!group) {
    throw new Error('Le groupe "container" est absent.');
  }

  for (const [slug, image] of Object.entries(IMAGES)) {
    const resultat = await prisma.category.updateMany({
      where: { groupId: group.id, slug },
      data: { image },
    });
    console.log(
      resultat.count > 0
        ? `  ✓ ${slug}`
        : `  ignore (categorie absente) : ${slug}`,
    );
  }

  const sansVisuel = await prisma.product.count({
    where: {
      category: { groupId: group.id, image: "" },
      OR: [{ image: null }, { image: "" }],
    },
  });
  console.log("");
  console.log(`Produits encore sans visuel : ${sansVisuel}`);
  console.log("RAPPEL : purger le cache, sinon les vignettes restent brisees.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
