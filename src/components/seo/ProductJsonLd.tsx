import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import {
  MERCHANT_CURRENCY,
  MERCHANT_RETURN_POLICY,
  MERCHANT_SHIPPING,
  SHOP_NAME,
  absoluteUrl,
  buildMerchantRecord,
  getMerchantProductBySlug,
  merchantEffectivePriceCents,
  merchantProductType,
  merchantReferencePriceCents,
  siteUrl,
} from "@/server/merchant";
import type { ReviewRecord } from "@/server/types";
import type { Product } from "@/types/home";

// Balisage JSON-LD Product + Offer de la page produit.
//
// Les valeurs proviennent de `buildMerchantRecord()`, exactement comme le flux
// Merchant Center : prix, disponibilité, condition et identifiants ne peuvent donc
// pas diverger entre le flux, le balisage et la page. C'est précisément ce que
// Google contrôle avant d'accepter une fiche (« merchant listing »).
//
// Composant serveur : à placer dans la page produit, sans autre prop que le produit.

interface ProductJsonLdProps {
  /** Le produit tel que la page le rend déjà. */
  product: Pick<Product, "slug">;
  /**
   * Avis validés, ceux-là mêmes que la page affiche.
   *
   * La note agrégée en est déduite plutôt que reprise du catalogue : Google
   * interdit d'annoncer une note qui ne repose pas sur des avis visibles, et le
   * champ `rating` du catalogue retombe sur la note éditoriale quand aucun avis
   * client n'a encore été validé.
   */
  reviews: ReviewRecord[];
}

/**
 * Nombre d'avis portés dans le balisage.
 *
 * Tous sont dans le DOM, donc tous seraient légitimes ; au-delà d'une vingtaine,
 * le JSON-LD pèserait plus lourd que la fiche elle-même sans rien apporter à
 * l'extrait enrichi. La note agrégée, elle, reste calculée sur la totalité.
 */
const MAX_REVIEWS_BALISES = 20;

/** Valeur schema.org correspondant à la disponibilité du flux. */
const AVAILABILITY_URL: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
  backorder: "https://schema.org/BackOrder",
};

/** Valeur schema.org correspondant à l'état du produit. */
const CONDITION_URL: Record<string, string> = {
  new: "https://schema.org/NewCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
  used: "https://schema.org/UsedCondition",
};

/** Classes énergétiques UE, dans la nomenclature schema.org. */
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

export async function ProductJsonLd({ product, reviews }: ProductJsonLdProps) {
  if (!product.slug) return null;

  const row = await getMerchantProductBySlug(product.slug);
  if (!row) return null;

  const record = buildMerchantRecord(row);
  // Prix et prix barré viennent des mêmes fonctions que le flux : une campagne
  // en cours déplace les deux d'un bloc, et le balisage ne peut pas annoncer un
  // montant que le bloc d'achat ne montre pas.
  const currentPriceCents = merchantEffectivePriceCents(row);
  const referencePriceCents = merchantReferencePriceCents(row);
  const onSale = referencePriceCents > currentPriceCents;
  // L'ancien prix devient un StrikethroughPrice, comme le demande Google.
  const currentPrice = (currentPriceCents / 100).toFixed(2);

  // Date à partir de laquelle l'offre vaut. Sous campagne, c'est le début de la
  // remise ; sinon la mise en ligne du produit. Jamais `updatedAt` : corriger une
  // description ne redémarre pas la validité d'un prix.
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
    // url/logo repris tels quels du bloc Organization de la page d'accueil
    // (OrganizationJsonLd) : même entité, mêmes valeurs, pour que Google la
    // rattache sans ambiguïté d'une page à l'autre.
    seller: {
      "@type": "Organization",
      name: SHOP_NAME,
      url: siteUrl(),
      logo: absoluteUrl("/images/logo-full.png"),
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

  if (record.shipping) {
    offer.shippingDetails = {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0.00",
        currency: MERCHANT_CURRENCY,
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: MERCHANT_SHIPPING.country,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: MERCHANT_SHIPPING.minHandlingDays,
          maxValue: MERCHANT_SHIPPING.maxHandlingDays,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: MERCHANT_SHIPPING.minTransitDays,
          maxValue: MERCHANT_SHIPPING.maxTransitDays,
          unitCode: "DAY",
        },
      },
    };
  }

  offer.hasMerchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: MERCHANT_RETURN_POLICY.country,
    // Le pays de la politique s'ajoute au pays d'application : Google les
    // distingue, et une politique sans pays déclaré remonte en avertissement.
    returnPolicyCountry: MERCHANT_RETURN_POLICY.country,
    returnPolicyCategory: MERCHANT_RETURN_POLICY.category,
    merchantReturnDays: MERCHANT_RETURN_POLICY.days,
    returnMethod: MERCHANT_RETURN_POLICY.method,
    returnFees: MERCHANT_RETURN_POLICY.fees,
  };

  const data: Record<string, JsonLdValue | undefined> = {
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

  // La note n'est publiée que lorsqu'elle repose sur de vrais avis affichés sur la
  // page : Google interdit les notes agrégées sans avis correspondants.
  if (reviews.length > 0) {
    const moyenne = reviews.reduce((somme, avis) => somme + avis.rating, 0) / reviews.length;

    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: moyenne.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };

    // Les avis eux-mêmes : sans eux, Google ne dispose que d'une note nue et ne
    // peut pas en tirer d'extrait. `author` et `reviewRating` sont les deux seuls
    // champs qu'il exige, les autres nourrissent l'extrait.
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

  return <JsonLd data={data} />;
}
