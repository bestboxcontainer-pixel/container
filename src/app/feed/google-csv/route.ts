import {
  buildMerchantRecord,
  loadMerchantProducts,
  type MerchantRecord,
} from "@/server/merchant";

// Même flux produits, au format tabulé (TSV) : l'autre format accepté par
// Merchant Center. Google recommande explicitement le TSV plutôt que le CSV :
// les valeurs répétées (product_highlight) contiennent souvent des virgules.
//
// À déclarer dans Merchant Center comme source de données planifiée :
//   https://bestboxcontainer.de/feed/google-csv

export const dynamic = "force-dynamic";

/**
 * Colonnes du fichier. Les attributs composés utilisent la syntaxe
 * « attribut(sous-attribut:sous-attribut) » définie par Google.
 */
const COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "sale_price",
  "sale_price_effective_date",
  "brand",
  "gtin",
  "mpn",
  "identifier_exists",
  "condition",
  "google_product_category",
  "product_type",
  "adult",
  "is_bundle",
  "age_group",
  "gender",
  "product_highlight",
  "shipping(country:service:price:min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
  "shipping_weight",
  "ships_from_country",
  "custom_label_0",
  "custom_label_1",
] as const;

/** Une cellule TSV ne peut contenir ni tabulation ni retour à la ligne. */
function cell(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[\t\r\n]+/g, " ").trim();
}

/**
 * Valeurs répétées : séparées par des virgules, chaque valeur contenant une
 * virgule ou un guillemet étant encadrée de guillemets doubles.
 */
function repeated(values: string[]): string {
  return values
    .map((value) => {
      const clean = cell(value);
      return /[",]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
    })
    .filter(Boolean)
    .join(",");
}

function row(record: MerchantRecord): string {
  // Plusieurs groupes de livraison : séparés par des virgules, chaque groupe
  // au format country:service:price:minH:maxH:minT:maxT.
  const shipping = record.shipping
    .map((s) =>
      [
        s.country,
        s.service,
        s.price,
        s.minHandlingTime,
        s.maxHandlingTime,
        s.minTransitTime,
        s.maxTransitTime,
      ].join(":"),
    )
    .join(",");

  const values: (string | number | undefined)[] = [
    record.id,
    record.title,
    record.description,
    record.link,
    record.imageLink,
    // En tabulé, les vues complémentaires tiennent dans une colonne, séparées par des virgules
    record.additionalImageLinks.join(","),
    record.availability,
    record.price,
    record.salePrice,
    record.salePriceEffectiveDate,
    record.brand,
    record.gtin,
    record.mpn,
    record.identifierExists,
    record.condition,
    record.googleProductCategory,
    record.productType,
    record.adult,
    record.isBundle,
    record.ageGroup,
    record.gender,
    repeated(record.productHighlights),
    shipping,
    record.shippingWeight,
    record.shipsFromCountry,
    record.customLabel0,
    record.customLabel1,
  ];

  return values.map(cell).join("\t");
}

export async function GET(): Promise<Response> {
  const products = await loadMerchantProducts({ respectSelection: true, onlyPurchasable: true });
  const lines = [COLUMNS.join("\t"), ...products.map((product) => row(buildMerchantRecord(product)))];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": 'inline; filename="bbc-best-box-containerhandel-google-feed.tsv"',
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
