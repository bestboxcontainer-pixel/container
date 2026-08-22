/**
 * Envoie les visuels du site vitrine (accueil) sur Cloudinary, puis affiche
 * un mapping chemin local → URL Cloudinary à reporter dans le code.
 *
 * Usage : npx tsx scripts/upload-site-images.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadImage, isCloudinaryConfigured } from "../src/server/cloudinary";

const SITE_FOLDER = "bbc-best-box/site";

const FILES = [
  "hero-port-1.jpg",
  "hero-rotterdam-2.jpg",
  "hero-hamburg-3.jpg",
  "gallery-modulbau-de.jpg",
  "gallery-office-de.jpg",
  "gallery-wohnwerte-de.jpg",
];

async function main() {
  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary n'est pas configuré (variables d'environnement manquantes).");
    process.exit(1);
  }

  const baseDir = path.join(process.cwd(), "public", "images", "container");
  const mapping: Record<string, string> = {};

  for (const filename of FILES) {
    const filePath = path.join(baseDir, filename);
    const buffer = await readFile(filePath);
    const uploaded = await uploadImage(buffer, { filename, folder: SITE_FOLDER });
    mapping[filename] = uploaded.url;
    console.log(`✓ ${filename} -> ${uploaded.url}`);
  }

  console.log("\n--- Mapping JSON ---");
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
