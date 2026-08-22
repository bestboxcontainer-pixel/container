/**
 * Génère public/images/logo-full.png (1242x406, même ratio que l'ancien
 * logo) à partir d'un SVG simple : pictogramme container + nom de marque.
 * Remplace l'ancien logo « Hausgeräte Pfeffer » qui traînait encore dans les
 * factures PDF, les e-mails et les métadonnées OG/JSON-LD.
 *
 * Usage : npx tsx scripts/generate-logo.ts
 */
import sharp from "sharp";
import path from "node:path";

const WIDTH = 1242;
const HEIGHT = 406;
const NAVY = "#0a1d30";
const PRIMARY = "#b8551f";

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" />

  <!-- Badge icône : container vu de côté (corps + cannelures + porte) -->
  <rect x="60" y="103" width="200" height="200" rx="36" fill="${PRIMARY}" />
  <g transform="translate(96, 148)" stroke="#ffffff" stroke-width="6" fill="none" stroke-linejoin="round">
    <rect x="0" y="18" width="128" height="72" rx="6" />
    <path d="M20 18 V90 M40 18 V90 M60 18 V90 M80 18 V90 M100 18 V90" stroke-opacity="0.55" stroke-width="4" />
    <path d="M108 18 V90" stroke-width="6" />
    <circle cx="118" cy="54" r="3.5" fill="#ffffff" stroke="none" />
  </g>

  <!-- Nom de marque -->
  <text x="300" y="200" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="900" fill="${NAVY}">
    BBC <tspan fill="${PRIMARY}">Best Box</tspan>
  </text>
  <text x="302" y="252" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="600" fill="${NAVY}" fill-opacity="0.65">
    Containerhandel e.K.
  </text>
</svg>
`;

const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="92" fill="${PRIMARY}" />
  <g transform="translate(120, 190)" stroke="#ffffff" stroke-width="16" fill="none" stroke-linejoin="round">
    <rect x="0" y="46" width="272" height="180" rx="16" />
    <path d="M46 46 V226 M92 46 V226 M138 46 V226 M184 46 V226 M230 46 V226" stroke-opacity="0.55" stroke-width="10" />
    <path d="M244 46 V226" stroke-width="14" />
    <circle cx="264" cy="136" r="9" fill="#ffffff" stroke="none" />
  </g>
</svg>
`;

async function main() {
  const imagesDir = path.join(process.cwd(), "public", "images");

  await sharp(Buffer.from(svg)).png().toFile(path.join(imagesDir, "logo-full.png"));
  console.log("✓ public/images/logo-full.png");

  // Copie réduite pour l'en-tête des e-mails (voir src/server/brandLogo.ts).
  await sharp(Buffer.from(svg)).resize(400).png().toFile(path.join(imagesDir, "logo-email.png"));
  console.log("✓ public/images/logo-email.png");

  await sharp(Buffer.from(iconSvg)).png().toFile(path.join(imagesDir, "logo-icon.png"));
  console.log("✓ public/images/logo-icon.png");

  await sharp(Buffer.from(iconSvg)).resize(256).png().toFile(
    path.join(process.cwd(), "src", "app", "icon.png"),
  );
  console.log("✓ src/app/icon.png (favicon)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
