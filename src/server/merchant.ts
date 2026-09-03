import { prisma } from "@/server/prisma";
import {
  MERCHANT_SELECTION_DEFAULT,
  filterForFeed,
} from "@/lib/merchantSelection";
import { prixDuFlux } from "@/lib/merchantPrice";
import { getMerchantSelection } from "@/server/merchantSelection";
import {
  getActivePromotionForProduct,
  getActivePromotions,
  type ProductPromotion,
} from "@/server/promotions";
import {
  APPAREL_CATEGORY_IDS,
  EU_ENERGY_LABEL_SLUGS,
  GOOGLE_CATEGORY_BY_SLUG,
} from "@/lib/googleTaxonomy";
import { COMPANY } from "@/content/legal";

export { GOOGLE_CATEGORY_BY_SLUG, googleCategoryPath } from "@/lib/googleTaxonomy";
export type { GoogleCategory } from "@/lib/googleTaxonomy";

// Couche de préparation des données pour Google Merchant Center.
//
// Un seul endroit produit l'enregistrement normalisé d'un produit : le flux XML,
// le flux TSV et le balisage JSON-LD de la page produit consomment tous
// `buildMerchantRecord()`. C'est la garantie que le prix, la disponibilité et les
// identifiants annoncés à Google sont rigoureusement identiques à ceux de la page,
// première cause de refus ("mismatch prix/disponibilité entre le flux et la page").
//
// Référence : Product data specification, support.google.com/merchants/answer/7052112

// ---- Paramètres de la boutique ----

/** Pays ciblé par le flux (ISO 3166-1 alpha-2). */
export const MERCHANT_COUNTRY = "DE";
/** Devise du flux (ISO 4217). Les prix stockés incluent déjà la TVA allemande. */
export const MERCHANT_CURRENCY = "EUR";
/** Langue du contenu du flux. */
export const MERCHANT_LANGUAGE = "de";
/** Taux de TVA appliqué en Allemagne : déjà compris dans priceCents. */
export const MERCHANT_VAT_RATE = 0.19;

export const SHOP_NAME = "BBC Best Box Containerhandel e.K.";
export const SHOP_PHONE = COMPANY.phone;

/**
 * URL publique de la boutique. Toutes les URL du flux doivent être absolues et
 * pointer vers le domaine vérifié dans Merchant Center.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestbox-containerhandel.de";
  return raw.replace(/\/+$/, "");
}

/** Transforme un chemin interne ("/images/x.jpg") en URL absolue. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Conditions de livraison annoncées sur la boutique (TrustBar :
 * « Standardversand: kostenlos (3-5 Tage) »). Ces valeurs DOIVENT rester
 * alignées sur ce qui est écrit sur le site : Google compare le flux et la page.
 *
 * Le mode express (70 €, 24-48 h) n'est volontairement pas déclaré ici : le flux
 * ne porte qu'une offre de livraison par produit, et c'est le mode par défaut
 * donc le standard : qui doit y figurer. L'express reste proposé au panier.
 */
export const MERCHANT_SHIPPING = {
  country: MERCHANT_COUNTRY,
  service: "Standardversand",
  /**
   * Au-dessus de ce montant, le port est offert. À zéro depuis que la boutique
   * annonce le standard gratuit sans montant minimum d'achat.
   */
  freeFromCents: 0,
  /** Préparation en un jour ouvré, acheminement en deux à quatre : 3 à 5 jours. */
  minHandlingDays: 1,
  maxHandlingDays: 1,
  minTransitDays: 2,
  maxTransitDays: 4,
} as const;

/**
 * Politique de retour annoncée (TrustBar : « 14 Tage Rückgaberecht »).
 * Quatorze jours correspondent au droit de rétractation légal allemand
 * (§ 355 BGB) : la boutique n'accorde plus de délai contractuel au-delà.
 * `returnFees` n'est volontairement pas renseigné : le site ne précise pas qui
 * supporte les frais de retour, et Google refuse les informations inexactes.
 */
export const MERCHANT_RETURN_POLICY = {
  country: MERCHANT_COUNTRY,
  days: 14,
  /** Valeur schema.org attendue par Google. */
  category: "https://schema.org/MerchantReturnFiniteReturnWindow",
  method: "https://schema.org/ReturnByMail",
  /**
   * La boutique supporte les frais de retour : c'est ce qu'annonce la page
   * « Retoure et réclamation » : étiquette de renvoi fournie pour les colis,
   * enlèvement organisé pour les appareils livrés par transporteur. Sans cette
   * précision, Google applique son hypothèse par défaut, moins favorable, et
   * affiche des conditions de retour plus dures que celles réellement offertes.
   */
  fees: "https://schema.org/FreeReturn",
} as const;

// ---- Forme des données lues en base ----

export interface MerchantProduct {
  id: string;
  /** Rattachement à la catégorie, pour le filtre de sélection du flux. */
  categoryId: string;
  brand: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  bullets: string;
  gtin: string | null;
  mpn: string | null;
  condition: string;
  googleProductCategory: string;
  shippingWeightGrams: number | null;
  energyEfficiencyClass: string | null;
  image: string | null;
  images: string;
  priceCents: number;
  oldPriceCents: number | null;
  stock: number;
  active: boolean;
  /** Mise en ligne du produit ; sert de `validFrom` à l'offre balisée. */
  createdAt: Date;
  category: {
    slug: string;
    label: string;
    description: string;
    image: string;
    group: { slug: string; label: string };
  };
  /**
   * Promotion de campagne active, attachée au chargement.
   *
   * Elle n'est pas relue au moment de composer l'enregistrement : le flux XML,
   * le flux TSV et le balisage JSON-LD appellent tous `buildMerchantRecord()`
   * de façon synchrone, et un prix promotionnel doit sortir identique des trois.
   */
  promotion?: ProductPromotion;
}

const merchantSelect = {
  id: true,
  // Sert au filtre de sélection du flux, jamais transmis à Google.
  categoryId: true,
  brand: true,
  name: true,
  slug: true,
  sku: true,
  shortDescription: true,
  description: true,
  bullets: true,
  gtin: true,
  mpn: true,
  condition: true,
  googleProductCategory: true,
  shippingWeightGrams: true,
  energyEfficiencyClass: true,
  image: true,
  images: true,
  priceCents: true,
  oldPriceCents: true,
  stock: true,
  active: true,
  // Sert de `validFrom` au balisage JSON-LD de l'offre, hors campagne.
  createdAt: true,
  category: {
    select: {
      slug: true,
      label: true,
      description: true,
      image: true,
      group: { select: { slug: true, label: true } },
    },
  },
} as const;

/**
 * Charge les produits destinés au flux. Par défaut, seuls les produits actifs.
 * Les promotions de campagne en cours sont jointes ici : Google compare le prix
 * du flux à celui de la page, et la page, elle, affiche déjà le prix remisé.
 *
 * `respectSelection` applique en plus le choix de catégories enregistré depuis
 * le back-office. Les deux flux le posent ; l'écran de contrôle, non, il doit
 * continuer d'auditer le catalogue entier, y compris ce qui n'est pas diffusé,
 * sinon un produit écarté du flux disparaîtrait aussi du diagnostic.
 */
export async function loadMerchantProducts(
  options: { includeInactive?: boolean; respectSelection?: boolean } = {},
): Promise<MerchantProduct[]> {
  const [rows, promotions, selection] = await Promise.all([
    prisma.product.findMany({
      where: options.includeInactive ? undefined : { active: true },
      select: merchantSelect,
      orderBy: [{ category: { position: "asc" } }, { createdAt: "asc" }],
    }),
    getActivePromotions(),
    options.respectSelection
      ? getMerchantSelection()
      : Promise.resolve(MERCHANT_SELECTION_DEFAULT),
  ]);

  const retenus = filterForFeed(rows, selection);

  return retenus.map((row) => {
    const promotion = promotions.get(row.id);
    return promotion ? { ...row, promotion } : row;
  });
}

/** Charge un produit unique : utilisé par le balisage JSON-LD de la page produit. */
export async function getMerchantProductBySlug(
  slug: string,
): Promise<MerchantProduct | undefined> {
  const row = await prisma.product.findUnique({ where: { slug }, select: merchantSelect });
  if (!row) return undefined;

  const promotion = await getActivePromotionForProduct(row.id);
  return promotion ? { ...row, promotion } : row;
}

// ---- Normalisation ----

export type MerchantAvailability = "in_stock" | "out_of_stock" | "preorder" | "backorder";
export type MerchantCondition = "new" | "refurbished" | "used";

/**
 * Disponibilité déduite du seul stock, comme sur la page produit.
 * Un produit sans stock est déclaré out_of_stock : ni preorder ni backorder ne
 * sont utilisés faute de date d'expédition annoncée (Google l'exige alors).
 */
export function availabilityFor(stock: number): MerchantAvailability {
  return stock > 0 ? "in_stock" : "out_of_stock";
}

/** Valeur de condition normalisée ; toute valeur inconnue retombe sur "new". */
export function conditionFor(value: string): MerchantCondition {
  return value === "refurbished" || value === "used" ? value : "new";
}

/** Prix au format attendu par Google : point décimal puis code ISO 4217. */
export function formatFeedPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} ${MERCHANT_CURRENCY}`;
}

/**
 * Promotion qui fait réellement baisser le prix de l'article. Une campagne
 * « livraison offerte » n'en est pas une : elle ne touche pas au montant de la
 * ligne, et la page produit garde alors son prix barré éditorial.
 */
function priceCuttingPromotion(product: MerchantProduct): ProductPromotion | undefined {
  const promotion = product.promotion;
  return promotion && promotion.savingCents > 0 ? promotion : undefined;
}

/**
 * Prix effectivement affiché dans le bloc d'achat, et donc facturé.
 * Une campagne en cours prime sur le prix catalogue.
 */
export function merchantEffectivePriceCents(product: MerchantProduct): number {
  return priceCuttingPromotion(product)?.priceCents ?? product.priceCents;
}

/**
 * Prix de référence, celui qui s'affiche barré. Pendant une campagne c'est le
 * prix figé à l'entrée du produit dans la campagne, celui annoncé dans le
 * message, sinon l'ancien prix éditorial de la fiche. À défaut des deux, le
 * prix courant : il n'y a alors pas de promotion à déclarer.
 */
export function merchantReferencePriceCents(product: MerchantProduct): number {
  const promotion = priceCuttingPromotion(product);
  if (promotion) return promotion.basePriceCents;
  return product.oldPriceCents ?? product.priceCents;
}

/** Poids d'expédition au format « 12.50 kg » (ou en grammes sous le kilo). */
export function formatShippingWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

function parseBullets(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).map((item) => item.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Retire tout balisage et normalise les espaces : le flux n'accepte que du texte. */
function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Identifiant de l'offre : unique, stable, 50 caractères au maximum. */
export function merchantOfferId(product: MerchantProduct): string {
  // Le SKU interne n'est pas unique (troncature à 10 caractères) : on part du
  // slug, qui l'est par construction, et on borne la longueur à 50 caractères.
  if (product.slug.length <= 50) return product.slug;
  return `${product.slug.slice(0, 41)}-${product.id.slice(-8)}`;
}

/** URL publique de la fiche produit (l'allemand vit à la racine du site). */
export function merchantProductUrl(product: MerchantProduct): string {
  return `${siteUrl()}/${product.category.group.slug}/${product.category.slug}/${product.slug}`;
}

/** Image principale : celle du produit, à défaut celle de la catégorie. */
export function merchantImageUrl(product: MerchantProduct): string {
  const source = product.image?.trim() || product.category.image.trim();
  return source ? absoluteUrl(source) : "";
}

/** Google accepte jusqu'à 10 vues complémentaires ; l'image principale en est exclue. */
const ADDITIONAL_IMAGE_LIMIT = 10;

export function merchantAdditionalImageUrls(product: MerchantProduct): string[] {
  const main = merchantImageUrl(product);

  try {
    const parsed = JSON.parse(product.images) as unknown;
    if (!Array.isArray(parsed)) return [];

    const urls = parsed
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .map((entry) => absoluteUrl(entry))
      .filter((url) => url && url !== main);

    return [...new Set(urls)].slice(0, ADDITIONAL_IMAGE_LIMIT);
  } catch {
    return [];
  }
}

/** Titre du flux : doit correspondre au titre affiché sur la page produit. */
export function merchantTitle(product: MerchantProduct): string {
  return plainText(`${product.brand} ${product.name}`).slice(0, 150);
}

/**
 * Description du flux. La description saisie prime toujours ; sinon on compose un
 * texte factuel à partir des données réelles de la fiche. Aucune mention
 * promotionnelle (« gratuit », « bester Preis ») : Google les refuse.
 */
export function merchantDescription(product: MerchantProduct): string {
  const own = plainText(product.description) || plainText(product.shortDescription);
  if (own.length >= 80) return own.slice(0, 5000);

  const bullets = parseBullets(product.bullets);
  const parts = [
    `${product.brand} ${product.name}: ${product.category.label} von ${product.brand}.`,
    plainText(product.category.description),
    bullets.length > 0 ? `Ausstattung: ${bullets.join(", ")}.` : "",
    conditionFor(product.condition) === "new" ? "Zustand: fabrikneu und originalverpackt." : "",
    own,
  ];

  return plainText(parts.filter(Boolean).join(" ")).slice(0, 5000);
}

/** Fil d'Ariane interne, repris dans product_type. */
export function merchantProductType(product: MerchantProduct): string {
  return `${product.category.group.label} > ${product.category.label}`.slice(0, 750);
}

/** Catégorie Google : celle saisie sur la fiche, à défaut celle de la catégorie. */
export function merchantGoogleCategory(product: MerchantProduct): string {
  const own = product.googleProductCategory.trim();
  if (own) return own;
  return GOOGLE_CATEGORY_BY_SLUG[product.category.slug]?.id ?? "";
}

export interface MerchantShippingEntry {
  country: string;
  service: string;
  price: string;
  minHandlingTime: number;
  maxHandlingTime: number;
  minTransitTime: number;
  maxTransitTime: number;
}

/**
 * Frais de port du produit : volontairement jamais renseigné dans le flux.
 *
 * Une balise `g:shipping` sur un produit prend le pas sur les règles définies au
 * niveau du compte Merchant Center pour ce même produit. La boutique propose
 * deux modes (Standardversand gratuit, Express à 70 €), tous deux configurés
 * comme conditions de livraison du compte : un seul peut être porté par le
 * flux (une seule balise par article), ce qui masquerait l'autre. Ne rien
 * déclarer ici laisse Google appliquer les deux règles du compte pour chaque
 * produit, plutôt qu'une seule imposée par le flux.
 */
export function merchantShipping(): MerchantShippingEntry | undefined {
  return undefined;
}

// ---- Enregistrement complet ----

export interface MerchantRecord {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  /** Vues complémentaires: attribut additional_image_link, 10 au maximum chez Google. */
  additionalImageLinks: string[];
  availability: MerchantAvailability;
  /** Prix de référence ; en promotion, c'est l'ancien prix barré de la page. */
  price: string;
  /** Prix remisé, présent uniquement lorsqu'un ancien prix plus élevé existe. */
  salePrice?: string;
  /**
   * Période de validité du prix remisé, au format « début/fin » exigé par
   * Google. Sans elle, un `sale_price` est réputé sans terme : la remise
   * resterait annoncée dans les résultats jusqu'à la prochaine lecture du flux,
   * alors que la boutique est déjà revenue au prix plein. Renseignée seulement
   * quand la remise vient d'une campagne, qui seule connaît ses dates.
   */
  salePriceEffectiveDate?: string;
  brand: string;
  gtin?: string;
  mpn?: string;
  /** "no" seulement lorsque ni GTIN ni MPN ne sont disponibles. */
  identifierExists?: "no";
  condition: MerchantCondition;
  adult: "no";
  isBundle: "no";
  googleProductCategory?: string;
  productType: string;
  productHighlights: string[];
  shipping?: MerchantShippingEntry;
  shippingWeight?: string;
  shipsFromCountry: string;
  /** Ne vaut plus que pour CH/NO/UK ; dans l'UE, Google attend certification/EPREL. */
  energyEfficiencyClass?: string;
  ageGroup?: string;
  gender?: string;
  customLabel0: string;
  customLabel1?: string;
  /** Prix valable jusqu'à cette date (ISO 8601), utile au balisage JSON-LD. */
  priceValidUntil: string;
}

/**
 * Date de validité du prix : un an, renouvelée à chaque génération du flux.
 * Une campagne la ramène à sa date de fin, au-delà, le prix annoncé n'est plus
 * celui de la boutique, et un `priceValidUntil` trop lointain sur un prix promo
 * est exactement le genre d'incohérence qui fait refuser une fiche.
 */
/**
 * Fenêtre du prix promotionnel, au format d'intervalle ISO 8601 attendu par
 * Google : « début/fin ». Absente quand la remise ne vient pas d'une campagne
 * un ancien prix saisi à la main dans la fiche produit n'a pas de terme
 * connu, et inventer une date de fin serait pire que de n'en donner aucune.
 */
function salePriceWindow(promotion?: ProductPromotion): string | undefined {
  if (!promotion) return undefined;
  return `${promotion.startsAt.toISOString()}/${promotion.endsAt.toISOString()}`;
}

function priceValidUntil(promotion?: ProductPromotion): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const horizon = promotion && promotion.endsAt < date ? promotion.endsAt : date;
  return horizon.toISOString().slice(0, 10);
}

/** Transforme un produit en enregistrement conforme à la spécification Google. */
export function buildMerchantRecord(product: MerchantProduct): MerchantRecord {
  const gtin = product.gtin?.replace(/\D/g, "") || undefined;
  const mpn = product.mpn?.trim() || undefined;
  // Une campagne en cours l'emporte sur l'ancien prix éditorial : c'est elle que
  // la page produit affiche, et le flux doit dire la même chose.
  // Seule une campagne fait naître une promotion au sens de Google : elle a un
  // début, une fin, et un prix de référence figé. L'ancien prix saisi à la main
  // dans la fiche n'a rien de tout cela ; le détail de la décision est dans
  // `lib/merchantPrice`, qui se teste sans ouvrir la base.
  const promotion = priceCuttingPromotion(product);
  const prix = prixDuFlux({
    prixCourantCents: merchantEffectivePriceCents(product),
    prixReferenceCents: merchantReferencePriceCents(product),
    campagneDatee: promotion !== undefined,
  });
  const googleCategory = merchantGoogleCategory(product);
  const isApparel = APPAREL_CATEGORY_IDS.has(googleCategory);

  return {
    id: merchantOfferId(product),
    title: merchantTitle(product),
    description: merchantDescription(product),
    link: merchantProductUrl(product),
    imageLink: merchantImageUrl(product),
    additionalImageLinks: merchantAdditionalImageUrls(product),
    availability: availabilityFor(product.stock),
    // Sous campagne, price porte le prix de référence figé et sale_price le prix
    // affiché, encadré par ses dates. Hors campagne, price est le prix pratiqué,
    // sans plus : c'est exactement ce que montre le bloc d'achat de la page.
    price: formatFeedPrice(prix.priceCents),
    salePrice: prix.salePriceCents === undefined ? undefined : formatFeedPrice(prix.salePriceCents),
    salePriceEffectiveDate: prix.remiseDeclaree ? salePriceWindow(promotion) : undefined,
    brand: product.brand.slice(0, 70),
    gtin,
    mpn: mpn?.slice(0, 70),
    identifierExists: !gtin && !mpn ? "no" : undefined,
    condition: conditionFor(product.condition),
    adult: "no",
    isBundle: "no",
    googleProductCategory: googleCategory || undefined,
    productType: merchantProductType(product),
    // Google demande entre 2 et 100 valeurs, 150 caractères chacune.
    productHighlights: parseBullets(product.bullets)
      .map((bullet) => bullet.slice(0, 150))
      .slice(0, 10),
    shipping: merchantShipping(),
    shippingWeight:
      product.shippingWeightGrams && product.shippingWeightGrams > 0
        ? formatShippingWeight(product.shippingWeightGrams)
        : undefined,
    shipsFromCountry: MERCHANT_COUNTRY,
    energyEfficiencyClass: product.energyEfficiencyClass?.trim() || undefined,
    ageGroup: isApparel ? "adult" : undefined,
    gender: isApparel ? "unisex" : undefined,
    customLabel0: product.category.group.label,
    // L'étiquette « Aktion » sert à segmenter les campagnes publicitaires : elle
    // suit la remise réellement déclarée, pas le prix barré de la fiche.
    customLabel1: prix.remiseDeclaree ? "Aktion" : undefined,
    priceValidUntil: priceValidUntil(promotion),
  };
}

// ---- Contrôle de conformité ----

export type MerchantIssueLevel = "error" | "warning";

export interface MerchantIssue {
  level: MerchantIssueLevel;
  /** Nom de l'attribut Google concerné. */
  attribute: string;
  /** Message affiché dans le back-office, en allemand. */
  message: string;
}

export interface MerchantAudit {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  sku: string;
  categoryLabel: string;
  href: string;
  adminHref: string;
  active: boolean;
  issues: MerchantIssue[];
  /** Aucun blocage : le produit peut partir en campagne Shopping. */
  ready: boolean;
}

const MIN_DESCRIPTION_LENGTH = 160;
const MIN_TITLE_LENGTH = 15;

/**
 * Passe un produit au crible de la spécification Google et des causes de refus
 * les plus fréquentes. `error` = le produit sera refusé ou invisible.
 * `warning` = risque de refus ou de performance dégradée.
 */
export function auditMerchantProduct(
  product: MerchantProduct,
  context: { duplicateOfferId?: boolean } = {},
): MerchantAudit {
  const record = buildMerchantRecord(product);
  const issues: MerchantIssue[] = [];

  // -- Attributs obligatoires --
  if (!record.imageLink) {
    issues.push({
      level: "error",
      attribute: "image_link",
      message: "Aucune image produit ni image de catégorie enregistrée, Google refuse l'offre.",
    });
  } else if (!product.image?.trim()) {
    issues.push({
      level: "warning",
      attribute: "image_link",
      message:
        "Pas d'image propre au produit : l'image de la catégorie est utilisée. Google considère les images réutilisées comme des images de remplacement et peut refuser l'offre.",
    });
  }

  if (record.title.length < MIN_TITLE_LENGTH) {
    issues.push({
      level: "warning",
      attribute: "title",
      message: `Titel ist mit ${record.title.length} Zeichen sehr kurz, Modellbezeichnung und Kernmerkmal ergänzen.`,
    });
  }

  if (record.description.length < MIN_DESCRIPTION_LENGTH) {
    issues.push({
      level: "warning",
      attribute: "description",
      message: `Beschreibung ist mit ${record.description.length} Zeichen zu knapp (empfohlen: mindestens ${MIN_DESCRIPTION_LENGTH} Zeichen).`,
    });
  }

  if (product.priceCents <= 0) {
    issues.push({
      level: "error",
      attribute: "price",
      message: "Prix manquant ou égal à 0, l'offre est refusée.",
    });
  }

  if (product.oldPriceCents !== null && product.oldPriceCents <= product.priceCents) {
    issues.push({
      level: "warning",
      attribute: "sale_price",
      message:
        "L'ancien prix n'est pas supérieur au prix actuel. Il n'est pas transmis comme prix barré et devrait être retiré de la fiche produit.",
    });
  }

  if (record.availability === "out_of_stock") {
    issues.push({
      level: "warning",
      attribute: "availability",
      message:
        "Stock à 0 : le produit est transmis en out_of_stock et n'apparaît pas dans les annonces Shopping.",
    });
  }

  if (!product.brand.trim()) {
    issues.push({
      level: "error",
      attribute: "brand",
      message: "Marque manquante, c'est un attribut obligatoire pour les articles neufs.",
    });
  }

  // -- Identifiants uniques --
  if (!record.gtin && !record.mpn) {
    issues.push({
      level: "error",
      attribute: "gtin / mpn",
      message:
        "Ni GTIN (EAN) ni MPN renseigné. Google exige au moins l'un des deux pour les articles neufs de marque ; identifier_exists=no est généralement refusé pour les produits de marque.",
    });
  } else if (!record.gtin) {
    issues.push({
      level: "warning",
      attribute: "gtin",
      message:
        "Pas de GTIN (EAN du code-barres). Marque + MPN remplissent l'exigence minimale, mais la portée est nettement supérieure avec un GTIN.",
    });
  }

  // Un MPN qui figure dans le nom du produit n'a rien d'anormal : les
  // fabricants placent leur référence dans la désignation commerciale, et
  // « BBC-LAG-003 20-Fuß Container mit 16 Rolltoren » porte bien le vrai MPN.
  // Signaler ce seul recoupement marquait deux cents articles sur trois cent
  // quatre-vingt-douze et noyait les avertissements qui, eux, demandaient une
  // action.
  //
  // Ce qui trahit une référence recopiée du nom faute de mieux, c'est
  // l'absence de chiffre : une référence fabricant en comporte pratiquement
  // toujours, alors qu'un nom de gamme comme « BUENO » ou « Viva » n'en a pas.
  if (record.mpn && product.name.includes(record.mpn) && !/\d/.test(record.mpn)) {
    issues.push({
      level: "warning",
      attribute: "mpn",
      message:
        "Le MPN ne contient aucun chiffre et figure tel quel dans le nom : c'est probablement un nom de gamme, pas une référence. Reprenez celle de la plaque signalétique.",
    });
  }

  if (product.gtin?.trim() && !/^\d{8}$|^\d{12,14}$/.test(product.gtin.replace(/\D/g, ""))) {
    issues.push({
      level: "error",
      attribute: "gtin",
      message:
        "Le GTIN n'a pas une longueur valide (8, 12, 13 ou 14 chiffres). Un GTIN erroné entraîne le refus du compte.",
    });
  }

  if (context.duplicateOfferId) {
    issues.push({
      level: "error",
      attribute: "id",
      message: "L'identifiant d'offre est utilisé par un autre produit, les identifiants doivent être uniques.",
    });
  }

  // -- Klassifizierung --
  if (!record.googleProductCategory) {
    issues.push({
      level: "error",
      attribute: "google_product_category",
      message: "Aucune catégorie produit Google associée.",
    });
  }

  // -- Versand --
  // Volontairement absent du flux pour chaque produit : voir merchantShipping().
  // Les règles de livraison (Standard gratuit, Express 70 €) vivent au niveau du
  // compte Merchant Center, pas ici : rien à signaler produit par produit.

  if (!record.shippingWeight) {
    issues.push({
      level: "warning",
      attribute: "shipping_weight",
      message: "Poids d'expédition manquant, sans poids, impossible d'utiliser des règles de livraison basées sur le poids.",
    });
  }

  // -- Energielabel (EU) --
  //
  // Google renseigne lui-même la certification EPREL à partir du GTIN ou du
  // MPN de l'article : « Wenn Sie keine Zertifizierungsinformationen angeben,
  // fügt Google diese unter Umständen automatisch anhand von GTIN- und/oder
  // MPN-Daten hinzu » (aide Merchant Center, attribut certification).
  //
  // L'avertissement ne se justifie donc que pour un article qui ne porte ni
  // l'un ni l'autre : là, l'étiquette énergie manquera réellement dans
  // l'annonce. Le lever pour toute la catégorie marquait cent cinquante-trois
  // fiches parfaitement diffusables et noyait les quarante-neuf qui, elles,
  // demandaient une action.
  if (
    EU_ENERGY_LABEL_SLUGS.has(product.category.slug) &&
    !record.gtin &&
    !record.mpn
  ) {
    issues.push({
      level: "warning",
      attribute: "certification",
      message:
        "Appareil soumis à l'étiquetage énergétique, sans GTIN ni MPN : Google ne peut pas retrouver la fiche EPREL tout seul. Renseignez le code-barres, ou le numéro d'enregistrement EPREL dans l'attribut certification (EC/EPREL/numéro).",
    });
  }

  // -- Champs obligatoires « Vêtements et accessoires » (aucune de nos catégories n'en relève aujourd'hui) --
  if (record.ageGroup) {
    issues.push({
      level: "warning",
      attribute: "color / size",
      message:
        "La catégorie Google associée relève de « Vêtements et accessoires ». Pour l'Allemagne, Google y exige en plus color et size.",
    });
  }

  if (!product.active) {
    issues.push({
      level: "warning",
      attribute: "-",
      message: "Le produit est désactivé et n'est pas repris dans le flux.",
    });
  }

  return {
    productId: product.id,
    slug: product.slug,
    title: record.title,
    brand: product.brand,
    sku: product.sku,
    categoryLabel: `${product.category.group.label} › ${product.category.label}`,
    href: record.link,
    adminHref: `/admin/products/${product.id}`,
    active: product.active,
    issues,
    ready: issues.every((issue) => issue.level !== "error"),
  };
}

export interface MerchantOverview {
  audits: MerchantAudit[];
  total: number;
  ready: number;
  blocked: number;
  withWarnings: number;
  /** Nombre de produits sans GTIN : à compléter par le commerçant. */
  missingGtin: number;
  missingMpn: number;
  missingOwnImage: number;
  feedCount: number;
}

/** Contrôle l'ensemble du catalogue, produits désactivés compris. */
export async function auditCatalog(): Promise<MerchantOverview> {
  const products = await loadMerchantProducts({ includeInactive: true });

  // Les identifiants d'offre en double font refuser le flux entier.
  const seen = new Map<string, number>();
  for (const product of products) {
    const offerId = merchantOfferId(product);
    seen.set(offerId, (seen.get(offerId) ?? 0) + 1);
  }

  const audits = products.map((product) =>
    auditMerchantProduct(product, {
      duplicateOfferId: (seen.get(merchantOfferId(product)) ?? 0) > 1,
    }),
  );

  return {
    audits,
    total: audits.length,
    ready: audits.filter((audit) => audit.ready).length,
    blocked: audits.filter((audit) => !audit.ready).length,
    withWarnings: audits.filter((audit) => audit.ready && audit.issues.length > 0).length,
    missingGtin: products.filter((product) => !product.gtin?.trim()).length,
    missingMpn: products.filter((product) => !product.mpn?.trim()).length,
    missingOwnImage: products.filter((product) => !product.image?.trim()).length,
    feedCount: products.filter((product) => product.active).length,
  };
}
