import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { categoryPages } from "../src/data/categoryPages";
import type { CategoryRecord, ProductRecord } from "../src/server/types";

const DATA_DIR = path.join(process.cwd(), "data", "store");

async function main() {
  const categories: CategoryRecord[] = [];
  const products: ProductRecord[] = [];

  for (const category of categoryPages) {
    const categoryId = `${category.group}/${category.slug}`;
    categories.push({
      id: categoryId,
      group: category.group,
      slug: category.slug,
      label: category.label,
      description: category.description,
      image: category.image,
      guide: category.guide,
    });

    for (const product of category.products) {
      products.push({
        id: crypto.randomUUID(),
        categoryId,
        brand: product.brand,
        name: product.name,
        bullets: product.bullets,
        oldPrice: product.oldPrice,
        price: product.price,
        badge: product.badge,
        rating: product.rating,
        inStock: product.inStock,
      });
    }
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "categories.json"),
    JSON.stringify(categories, null, 2) + "\n",
    "utf-8",
  );
  await writeFile(
    path.join(DATA_DIR, "products.json"),
    JSON.stringify(products, null, 2) + "\n",
    "utf-8",
  );

  console.log(`Migrated ${categories.length} categories and ${products.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
