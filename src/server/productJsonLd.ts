/**
 * Construction de l'objet JSON-LD `Product` d'une fiche.
 *
 * Séparé du composant `ProductJsonLd` pour une raison : le balisage doit pouvoir
 * être contrôlé produit par produit, hors rendu React (voir
 * `scripts/audit-jsonld.ts`). Les valeurs viennent de `buildMerchantRecord()`,
 * les mêmes que le flux Merchant Center : prix, disponibilité, état et
 * identifiants ne peuvent donc pas diverger entre le flux, le balisage et la
 * page.
 */

import type { JsonLdValue } from "@/components/seo/JsonLd";
import {
  MERCHANT_CURRENCY,
  MERCHANT_RETURN_POLICY,
  SHOP_NAME,
  absoluteUrl,
  buildMerchantRecord,
  merchantEffectivePriceCents,
  merchantProductType,
  merchantReferencePriceCents,
  siteUrl,
  type MerchantProduct,
} from "@/server/merchant";
import type { ReviewRecord } from "@/server/types";

/** Nombre d'avis portés dans le balisage (la note agrégée reste sur le total). */
const MAX_REVIEWS_BALISES = 20;

const AVAILABILITY_URL: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
  backorder: "https://schema.org/BackOrder",
};

const CONDITION_URL: Record<string, string> = {
  new: "https://schema.org/NewCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
  used: "https://schema.org/UsedCondition",
};

const EU_ENERGY_CATEGORY: Record<string, string> = {
  "A+++": "https://schema.org/EUEnergyEfficiencyCategoryA3Plus",
  "A++": "https://schema.org/EUEnergyEfficiencyCategoryA2Plus",
  "A+": "https://schema.org/EUEnergyEfficiencyCategoryA1Plus",
  A: "https://schema.org/EUEnergyEfficiencyCategoryA",
  B: "https://schema.org/EUEnergyEfficiencyCategoryB",
  C: "https://schema.org/EUEnergyEfficiencyCategoryC",
  D: "https://schema.org/EUEnergyEfficiencyCategoryD",
  E: "https://schema.org/EUEnergyEfficiencyCategoryE",
  F: "https://schema.org/EUEnergyEfficiencyCategoryF",
  G: "https://schema.org/EUEnergyEfficiencyCategoryG",
};

/** Le nom de la propriété GTIN dépend de sa longueur (gtin8/12/13/14). */
function gtinProperties(gtin: string | undefined): Record<string, JsonLdValue | undefined> {
  if (!gtin) return {};
  const key =
    gtin.length === 8 ? "gtin8" : gtin.length === 12 ? "gtin12" : gtin.length === 14 ? "gtin14" : "gtin13";
  return { [key]: gtin, gtin };
}

export type ProductJsonLdData = Record<string, JsonLdValue | undefined>;

/** Objet JSON-LD `Product` complet pour une fiche, avis compris. */
export function buildProductJsonLdData(
  row: MerchantProduct & { promotion?: { startsAt: Date } | null; createdAt: Date },
  reviews: ReviewRecord[],
): ProductJsonLdData {
  const record = buildMerchantRecord(row);
  const currentPriceCents = merchantEffectivePriceCents(row);
  const referencePriceCents = merchantReferencePriceCents(row);
  const onSale = referencePriceCents > currentPriceCents;
  const currentPrice = (currentPriceCents / 100).toFixed(2);
  const validFrom = (row.promotion?.startsAt ?? row.createdAt).toISOString().slice(0, 10);

  const offer: Record<string, JsonLdValue | undefined> = {
    "@type": "Offer",
    url: record.link,
    priceCurrency: MERCHANT_CURRENCY,
    price: currentPrice,
    validFrom,
    priceValidUntil: record.priceValidUntil,
    availability: AVAILABILITY_URL[record.availability],
    itemCondition: CONDITION_URL[record.condition],
    seller: {
      "@type": "Organization",
      name: SHOP_NAME,
      url: siteUrl(),
      logo: absoluteUrl("/images/logo-icon.png"),
    },
  };

  if (onSale) {
    offer.priceSpecification = {
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/StrikethroughPrice",
      price: (referencePriceCents / 100).toFixed(2),
      priceCurrency: MERCHANT_CURRENCY,
    };
  }

  if (record.shipping.length > 0) {
    offer.shippingDetails = record.shipping.map((s) => ({
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: s.price.split(" ")[0],
        currency: MERCHANT_CURRENCY,
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: s.country,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: s.minHandlingTime,
          maxValue: s.maxHandlingTime,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: s.minTransitTime,
          maxValue: s.maxTransitTime,
          unitCode: "DAY",
        },
      },
    }));
  }

  offer.hasMerchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: MERCHANT_RETURN_POLICY.country,
    returnPolicyCountry: MERCHANT_RETURN_POLICY.country,
    returnPolicyCategory: MERCHANT_RETURN_POLICY.category,
    merchantReturnDays: MERCHANT_RETURN_POLICY.days,
    returnMethod: MERCHANT_RETURN_POLICY.method,
    returnFees: MERCHANT_RETURN_POLICY.fees,
  };

  const data: ProductJsonLdData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${record.link}#product`,
    name: record.title,
    description: record.description,
    image: record.imageLink ? [record.imageLink] : undefined,
    sku: row.sku,
    mpn: record.mpn,
    ...gtinProperties(record.gtin),
    brand: { "@type": "Brand", name: row.brand },
    category: merchantProductType(row),
    url: record.link,
    offers: offer,
  };

  if (reviews.length > 0) {
    const moyenne = reviews.reduce((somme, avis) => somme + avis.rating, 0) / reviews.length;
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: moyenne.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
    data.review = reviews.slice(0, MAX_REVIEWS_BALISES).map((avis) => ({
      "@type": "Review",
      author: { "@type": "Person", name: avis.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: avis.rating,
        bestRating: 5,
        worstRating: 1,
      },
      datePublished: avis.createdAt.slice(0, 10),
      name: avis.title || undefined,
      reviewBody: avis.body,
    }));
  }

  if (record.productHighlights.length > 0) {
    data.additionalProperty = record.productHighlights.map((highlight) => ({
      "@type": "PropertyValue",
      name: "Ausstattung",
      value: highlight,
    }));
  }

  const energyCategory = EU_ENERGY_CATEGORY[record.energyEfficiencyClass ?? ""];
  if (energyCategory) {
    data.hasEnergyConsumptionDetails = {
      "@type": "EnergyConsumptionDetails",
      hasEnergyEfficiencyCategory: energyCategory,
    };
  }

  return data;
}

export interface ProductJsonLdIssue {
  path: string;
  message: string;
}

/**
 * Contrôle qu'un objet JSON-LD `Product` porte au moins ce que Google exige
 * pour une fiche marchande : name, image, description, sku, brand et une offre
 * complète (price, priceCurrency, availability, itemCondition).
 */
export function checkProductJsonLd(data: ProductJsonLdData): ProductJsonLdIssue[] {
  const issues: ProductJsonLdIssue[] = [];
  const req = (path: string, value: unknown) => {
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);
    if (empty) issues.push({ path, message: "champ obligatoire absent ou vide" });
  };

  req("name", data.name);
  req("description", data.description);
  req("image", data.image);
  req("sku", data.sku);
  const brand = data.brand as { name?: string } | undefined;
  req("brand.name", brand?.name);

  const offer = data.offers as Record<string, unknown> | undefined;
  if (!offer) {
    issues.push({ path: "offers", message: "bloc Offer absent" });
    return issues;
  }
  req("offers.price", offer.price);
  req("offers.priceCurrency", offer.priceCurrency);
  req("offers.availability", offer.availability);
  req("offers.itemCondition", offer.itemCondition);

  if (typeof offer.price === "string" && !/^\d+\.\d{2}$/.test(offer.price)) {
    issues.push({ path: "offers.price", message: `format inattendu : « ${offer.price} »` });
  }
  if (typeof offer.availability === "string" && !offer.availability.startsWith("https://schema.org/")) {
    issues.push({ path: "offers.availability", message: `valeur non schema.org : « ${offer.availability} »` });
  }
  if (typeof offer.itemCondition === "string" && !offer.itemCondition.startsWith("https://schema.org/")) {
    issues.push({ path: "offers.itemCondition", message: `valeur non schema.org : « ${offer.itemCondition} »` });
  }

  return issues;
}
