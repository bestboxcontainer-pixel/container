/**
 * Relève le catalogue de conteneurs réellement proposé et le range dans un
 * fichier de travail, prêt pour `importer-containers.ts`.
 *
 * Source : containerlog-gmbh.de, déjà retenue pour les huit fiches de la page
 * d'accueil (commit 9de9a12). La boutique tourne sous Shopify, dont l'API
 * publique `/products.json` rend l'intégralité du catalogue en JSON : titres,
 * descriptions, prix et visuels. Aucune clé n'est nécessaire, aucun rendu
 * client à simuler, et le résultat est stable d'une exécution à l'autre.
 *
 * Rien n'est inventé ici : désignations, cotes, équipements et prix sortent
 * tels quels des fiches d'origine. Le script se contente de nettoyer le HTML
 * et de ranger chaque conteneur dans l'une des cinq catégories du site.
 *
 * Usage : npx tsx scripts/collecter-containers.ts
 * Sortie : data/catalogue-containers.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normMasseAlsMerkmale, typDerBezeichnung } from "../src/lib/containerMasse";

const SOURCE = "https://containerlog-gmbh.de/products.json?limit=250";
const SORTIE = path.join(process.cwd(), "data", "catalogue-containers.json");

/** Un navigateur est attendu : sans en-tête crédible, la boutique renvoie 403. */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/**
 * Les neuf familles de la source se rangent dans les cinq catégories du site.
 * Un conteneur maritime reste un conteneur maritime qu'on l'appelle
 * « Standardcontainer », « High Cube » ou « Versandcontainer » : ce sont trois
 * appellations commerciales de la même norme ISO 668.
 */
const CATEGORIE_PAR_FAMILLE: Record<string, string> = {
  Standardcontainer: "seecontainer",
  "High Cube Container": "seecontainer",
  Versandcontainer: "seecontainer",
  Kühlcontainer: "seecontainer",
  Lagercontainer: "lagercontainer",
  Bürocontainer: "buerocontainer",
  SANITÄRCONTAINER: "sanitaercontainer",
  Spezialcontainer: "sondercontainer",
  Wohncontainer: "sondercontainer",
};

/** Abréviations de catégorie pour composer une référence lisible. */
const CODE_CATEGORIE: Record<string, string> = {
  seecontainer: "SEE",
  lagercontainer: "LAG",
  buerocontainer: "BUE",
  sanitaercontainer: "SAN",
  sondercontainer: "SON",
};

export interface FicheContainer {
  slug: string;
  name: string;
  categorie: string;
  sku: string;
  priceCents: number;
  condition: "new" | "used";
  shortDescription: string;
  description: string;
  bullets: string[];
  images: string[];
  /** Famille d'origine, conservée pour pouvoir vérifier un classement. */
  familleSource: string;
}

interface ShopifyImage { src: string; position: number }
interface ShopifyVariant { price: string; available?: boolean }
interface ShopifyProduct {
  handle: string;
  title: string;
  product_type: string;
  body_html: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

/** Décode les entités HTML que produit l'éditeur Shopify. */
function decoder(texte: string): string {
  const table: Record<string, string> = {
    "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&#39;": "'", "&rsquo;": "’", "&ndash;": "–", "&mdash;": "—", "&euro;": "€",
  };
  return texte
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#\d+;/gi, (entite) => table[entite] ?? entite);
}

/**
 * Réduit un fragment HTML à son texte, espaces normalisés.
 *
 * L'éditeur de la source laisse parfois une puce typographique en tête de
 * ligne (« • Außenlänge: 6.058 mm »). La liste du site en pose déjà une :
 * conserver celle du texte en afficherait deux.
 */
function texteSeul(html: string): string {
  return decoder(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    // Le retrait vient après la normalisation : les balises deviennent des
    // espaces, et la puce n'est jamais le premier caractère avant celle-ci.
    .replace(/^[•·*\u2013\u2014-]+\s*/, "")
    .trim();
}

/**
 * Titres d'accordéon et intitulés de section ne sont pas des phrases de
 * description : ils annoncent ce qui suit et n'ont plus de sens une fois le
 * balisage retiré.
 */
const INTITULES = /^(produkt[üu]bersicht|technische daten|beschreibung|merkmale|ausstattung|lieferung|details|spezifikationen)\s*:?\s*$/i;

/**
 * Vocabulaire des en-têtes de section relevés dans la source. Une ligne courte
 * qui n'est faite que de ces mots annonce ce qui suit : « Abmessungen und
 * Gewicht » n'est pas une caractéristique, « Premiummodell im Holzdesign » si.
 */
const MOTS_ENTETE = new Set([
  "abmessungen", "gewicht", "technische", "daten", "ausstattung",
  "innenausstattung", "außenausstattung", "aussenausstattung", "elektroinstallation",
  "sanitärinstallation", "sanitaerinstallation", "installation", "merkmale",
  "eigenschaften", "spezifikationen", "beschreibung", "produktübersicht",
  "produktubersicht", "lieferung", "lieferumfang", "vorteile", "anwendungen",
  "einsatzbereiche", "einsatzgebiete", "details", "übersicht", "ubersicht",
  "weitere", "informationen", "containerabmessungen", "containermaße",
  "containermasse", "ausland", "zubehör", "zubehor", "optionen", "hinweis",
  "hinweise", "allgemeine", "allgemein",
  "und", "&", "/", "der", "die", "das", "des", "im", "in",
]);

/**
 * Sépare la description en paragraphes et en caractéristiques.
 *
 * Deux gabarits coexistent dans la source. Les fiches récentes alignent des
 * `<p>` de description suivis d'un `<ul>` de cotes. Les plus anciennes empilent
 * dans un accordéon des `<p>` de longueurs très inégales : « Rauchmelder. »
 * y voisine avec un paragraphe de 550 signes sur l'installation électrique.
 *
 * La longueur tranche donc, pas la balise : au-delà de 90 signes c'est une
 * phrase de description, en deçà une caractéristique. Restent les intitulés de
 * section (« INNENAUSSTATTUNG », « Sanitärinstallation »), qui annoncent ce qui
 * suit et ne veulent plus rien dire une fois le balisage retiré ; ils se
 * reconnaissent à leurs capitales ou à leur mot unique sans ponctuation.
 */
const SEUIL_PHRASE = 90;

/** Un intitulé de section n'est ni une phrase ni une caractéristique. */
function estIntitule(texte: string): boolean {
  if (INTITULES.test(texte)) return true;
  // Deux-points en fin de ligne : la ligne annonce ce qui suit et ne dit rien
  // par elle-même (« Allgemeine Merkmale: », « Materialien und Spezifikationen: »).
  if (texte.endsWith(":")) return true;
  // Tout en capitales : « INNENAUSSTATTUNG », « ELEKTROINSTALLATION ».
  if (texte === texte.toUpperCase() && /[A-ZÄÖÜ]{4}/.test(texte)) return true;
  // Rien ne termine la ligne et elle ne dit que des mots d'en-tête :
  // « Sanitärinstallation », « Abmessungen und Gewicht ». À l'inverse,
  // « Rauchmelder. » est ponctué et « Premiummodell im Holzdesign » porte un
  // mot qui n'annonce aucune section.
  if (/[.!?:)]$/.test(texte)) return false;
  const mots = texte.toLowerCase().split(/\s+/).filter(Boolean);
  return mots.length > 0 && mots.every((mot) => MOTS_ENTETE.has(mot.replace(/[:,.]$/, "")));
}

function decouper(bodyHtml: string): { paragraphes: string[]; puces: string[] } {
  // Les icônes SVG polluent l'extraction : elles partent avant tout le reste.
  const propre = bodyHtml.replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  const puces = [...propre.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => texteSeul(m[1]))
    .filter((t) => t.length > 2 && t.length <= 160);

  // Les paragraphes situés dans une liste sont déjà comptés comme puces.
  const sansListes = propre
    .replace(/<ul\b[\s\S]*?<\/ul>/gi, " ")
    .replace(/<ol\b[\s\S]*?<\/ol>/gi, " ");

  const paragraphes: string[] = [];
  for (const m of sansListes.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const texte = texteSeul(m[1]);
    if (texte.length <= 3 || estIntitule(texte)) continue;

    // Certaines fiches écrivent leur liste au fil du texte, séparée par des
    // puces : « Allgemeine Merkmale: • Länge: 6.000 mm • Breite: 2.430 mm ».
    // C'est une liste, pas une phrase : elle se scinde en caractéristiques.
    if (texte.includes("•")) {
      for (const morceau of texte.split("•")) {
        const item = morceau.trim().replace(/^[:\-–—]\s*/, "").replace(/[;,]$/, "");
        if (item.length > 2 && item.length <= 160 && !estIntitule(item)) puces.push(item);
      }
      continue;
    }

    if (texte.length >= SEUIL_PHRASE) paragraphes.push(texte);
    else if (texte.length <= 160) puces.push(texte);
  }

  // La source répète parfois une ligne d'une section à l'autre : cette fiche-ci
  // donne les mêmes cotes en « Außenmaße » et en « Innenmaße ». Deux lignes
  // identiques sous un titre ne renseignent pas deux fois.
  return { paragraphes, puces: [...new Set(puces)] };
}

/**
 * Quelques fiches de la source ont leur titre partiellement crié
 * (« SANITÄRCONTAINER 2,00 x 2,00 M MIT TOILETTE UND URINAR »). Sur une page
 * de catégorie, un titre en capitales écrase ses voisins.
 *
 * Le déclencheur est deux mots capitalisés qui se suivent, pas une proportion
 * de majuscules : « 10 Fuß HC Seecontainer – IICL Standard White » n'a que des
 * sigles isolés et doit rester intact. En allemand les noms communs gardent
 * leur majuscule, les mots outils non.
 */
const MOTS_OUTILS = new Set([
  "mit", "und", "für", "fur", "von", "im", "in", "am", "an", "auf", "aus",
  "der", "die", "das", "den", "dem", "des", "ohne", "bis", "zu", "zur", "zum",
  "nach", "bei", "pro", "als", "oder", "ein", "eine", "einem", "einen",
  // Signe de multiplication des cotes et unité de longueur : « 2,00 x 2,00 m ».
  "x", "m",
]);

/** Sigles du métier, qui perdraient leur sens en casse normale. */
const SIGLES = new Set([
  "IICL", "ISO", "CSC", "WC", "HC", "RAL", "CE", "PVC", "PPR", "EVA",
  "LED", "USB", "TÜV", "DIN", "EN", "KG", "MM", "CM", "M2", "M3",
]);

function normaliserTitre(titre: string): string {
  const mots = titre.match(/[\p{L}\p{N}]+/gu) ?? [];
  const estCrie = (mot: string) =>
    mot.length >= 3 && /\p{L}/u.test(mot) && mot === mot.toUpperCase() && !SIGLES.has(mot);

  // Deux mots criés qui se suivent : c'est une intention typographique de la
  // source, pas un sigle.
  const aDeuxDeSuite = mots.some((mot, index) => index > 0 && estCrie(mot) && estCrie(mots[index - 1]));
  if (!aDeuxDeSuite) return titre;

  return titre.replace(/[\p{L}\p{N}]+/gu, (mot, position: number) => {
    if (SIGLES.has(mot)) return mot;
    const bas = mot.toLowerCase();
    if (position > 0 && MOTS_OUTILS.has(bas)) return bas;
    return bas.charAt(0).toUpperCase() + bas.slice(1);
  });
}

/** « gebraucht » et « neu » figurent dans le titre : la source les affiche ainsi. */
function etatDepuisTitre(titre: string): "new" | "used" {
  return /gebraucht/i.test(titre) ? "used" : "new";
}

/**
 * Le résumé sous le titre veut une phrase, pas une caractéristique isolée :
 * « Rauchmelder. » ne dit rien d'un conteneur de bureau. La première vraie
 * phrase est donc préférée.
 *
 * À défaut, une caractéristique rédigée comme une phrase fait l'affaire — mais
 * elle sort alors de la liste : la fiche produit affiche le résumé puis les
 * caractéristiques, et la même ligne s'y lisait deux fois de suite. En dernier
 * recours les premières caractéristiques sont enchaînées.
 */
function resume(phrases: string[], puces: string[]): { texte: string; puceReprise: number } {
  if (phrases.length > 0) return { texte: phrases[0], puceReprise: -1 };

  const index = puces.findIndex((puce) => puce.length >= 40 && /[.!?]$/.test(puce));
  // Deux caractéristiques au moins doivent rester sous le titre, sans quoi la
  // carte produit se retrouve presque nue pour avoir gagné un résumé.
  if (index >= 0 && puces.length >= 3) return { texte: puces[index], puceReprise: index };

  return { texte: puces.slice(0, 3).join(" · "), puceReprise: -1 };
}

/** Coupe proprement à la limite de 200 caractères imposée au champ court. */
function resumer(texte: string, limite = 200): string {
  if (texte.length <= limite) return texte;
  const coupe = texte.slice(0, limite);
  const dernierEspace = coupe.lastIndexOf(" ");
  return `${coupe.slice(0, dernierEspace > 60 ? dernierEspace : limite).trimEnd()}…`;
}

/**
 * Caractéristiques de repli pour les conteneurs maritimes.
 *
 * Une partie des fiches de la source décrit le modèle en prose, sans le
 * moindre tableau : la carte produit se retrouvait alors sans une seule ligne
 * sous son titre. Ces conteneurs suivent pourtant la norme ISO 668, dont les
 * cotes sont les mêmes chez tous les fournisseurs et déjà publiées sur la page
 * `/container-masse` du site.
 *
 * Rien n'est inventé : la désignation donne la longueur et la hauteur, la
 * norme donne le reste. Un modèle que la norme ne couvre pas — un bureau, un
 * sanitaire, un aménagement sur mesure — ne reçoit rien.
 */
function normesDuType(designation: string): string[] {
  const typ = typDerBezeichnung(designation);
  return typ ? normMasseAlsMerkmale(typ) : [];
}

async function main() {
  console.log(`Lecture de ${SOURCE}`);
  const reponse = await fetch(SOURCE, { headers: { "user-agent": UA } });
  if (!reponse.ok) {
    throw new Error(`La source répond ${reponse.status} ${reponse.statusText}`);
  }

  const { products } = (await reponse.json()) as { products: ShopifyProduct[] };
  console.log(`${products.length} conteneurs relevés.`);

  const fiches: FicheContainer[] = [];
  const ignores: string[] = [];
  const compteurs: Record<string, number> = {};

  for (const produit of products) {
    const categorie = CATEGORIE_PAR_FAMILLE[produit.product_type];
    if (!categorie) {
      ignores.push(`${produit.title} (famille « ${produit.product_type} » non rattachée)`);
      continue;
    }

    const prix = Number(produit.variants[0]?.price ?? 0);
    if (!Number.isFinite(prix) || prix <= 0) {
      ignores.push(`${produit.title} (prix absent)`);
      continue;
    }

    const { paragraphes, puces } = decouper(produit.body_html ?? "");
    const phrases = paragraphes.filter((p) => !INTITULES.test(p));

    // Une fiche sans un mot de description ne vaut pas d'être publiée.
    if (phrases.length === 0 && puces.length === 0) {
      ignores.push(`${produit.title} (description vide)`);
      continue;
    }

    const { texte, puceReprise } = resume(phrases, puces);
    const caracteristiques = puces.filter((_, index) => index !== puceReprise);

    compteurs[categorie] = (compteurs[categorie] ?? 0) + 1;
    const rang = String(compteurs[categorie]).padStart(3, "0");

    fiches.push({
      slug: produit.handle,
      name: normaliserTitre(produit.title.trim()),
      categorie,
      sku: `BBC-${CODE_CATEGORIE[categorie]}-${rang}`,
      priceCents: Math.round(prix * 100),
      condition: etatDepuisTitre(produit.title),
      shortDescription: resumer(texte),
      description: phrases.join("\n\n"),
      // La fiche produit affiche huit puces au plus : au-delà, la liste se lit
      // comme un tableau technique et personne ne la parcourt.
      bullets: (caracteristiques.length > 0 ? caracteristiques : normesDuType(produit.title)).slice(0, 8),
      // Une vignette plus sept vues : la galerie de la fiche est bornée à huit.
      images: produit.images
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((image) => image.src)
        .slice(0, 8),
      familleSource: produit.product_type,
    });
  }

  await mkdir(path.dirname(SORTIE), { recursive: true });
  await writeFile(SORTIE, `${JSON.stringify(fiches, null, 2)}\n`, "utf8");

  console.log("");
  for (const [categorie, nombre] of Object.entries(compteurs).sort()) {
    console.log(`  ${String(nombre).padStart(2)}  ${categorie}`);
  }
  const parNorme = fiches.filter(
    (fiche) => fiche.bullets.length > 0 && fiche.bullets[0].startsWith("Außenmaß:"),
  );
  const sansMerkmale = fiches.filter((fiche) => fiche.bullets.length === 0);
  const visuels = fiches.reduce((total, fiche) => total + fiche.images.length, 0);
  const sansVisuel = fiches.filter((fiche) => fiche.images.length === 0);
  console.log("");
  console.log(`${fiches.length} fiches retenues, ${visuels} visuels.`);
  if (sansVisuel.length > 0) {
    console.log(`Sans visuel : ${sansVisuel.map((f) => f.slug).join(", ")}`);
  }
  if (parNorme.length > 0) {
    console.log(`${parNorme.length} fiches complétées par les cotes ISO 668 (source en prose).`);
  }
  if (sansMerkmale.length > 0) {
    console.log(`Sans caractéristique : ${sansMerkmale.map((f) => f.name).join(", ")}`);
  }
  if (ignores.length > 0) {
    console.log(`\n${ignores.length} écartées :`);
    for (const ligne of ignores) console.log(`  - ${ligne}`);
  }
  console.log(`\nÉcrit dans ${path.relative(process.cwd(), SORTIE)}`);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
