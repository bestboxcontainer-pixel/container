import {
  MERCHANT_LANGUAGE,
  SHOP_NAME,
  buildMerchantRecord,
  loadMerchantProducts,
  siteUrl,
  type MerchantRecord,
} from "@/server/merchant";

// Flux produits Google Merchant Center au format RSS 2.0 avec l'espace de noms
// « g: » (http://base.google.com/ns/1.0), tel que décrit dans la spécification
// officielle. Seuls les produits actifs y figurent.
//
// À déclarer dans Merchant Center comme source de données planifiée :
//   https://bestboxcontainer.de/feed/google

export const dynamic = "force-dynamic";

const GOOGLE_NS = "http://base.google.com/ns/1.0";

/** Caractères de contrôle interdits par la spécification XML 1.0. */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/** Échappe les caractères réservés dans un nœud texte XML. */
function escapeXml(value: string): string {
  return value
    .replace(CONTROL_CHARACTERS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** N'écrit la balise que si la valeur existe : aucun champ vide dans le flux. */
function tag(name: string, value: string | number | undefined, indent = "    "): string {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (!text) return "";
  return `${indent}<${name}>${escapeXml(text)}</${name}>\n`;
}

function itemXml(record: MerchantRecord): string {
  const parts: string[] = ["  <item>\n"];

  // ---- Attributs obligatoires ----
  parts.push(tag("g:id", record.id));
  parts.push(tag("title", record.title));
  parts.push(tag("description", record.description));
  parts.push(tag("link", record.link));
  parts.push(tag("g:image_link", record.imageLink));
  // Une balise par vue complémentaire, comme le veut la spécification Google
  for (const additional of record.additionalImageLinks) {
    parts.push(tag("g:additional_image_link", additional));
  }
  parts.push(tag("g:availability", record.availability));
  parts.push(tag("g:price", record.price));
  parts.push(tag("g:sale_price", record.salePrice));
  parts.push(tag("g:sale_price_effective_date", record.salePriceEffectiveDate));

  // ---- Identifiants uniques ----
  parts.push(tag("g:brand", record.brand));
  parts.push(tag("g:gtin", record.gtin));
  parts.push(tag("g:mpn", record.mpn));
  parts.push(tag("g:identifier_exists", record.identifierExists));
  parts.push(tag("g:condition", record.condition));

  // ---- Classification ----
  parts.push(tag("g:google_product_category", record.googleProductCategory));
  parts.push(tag("g:product_type", record.productType));

  // ---- Attributs recommandés ----
  parts.push(tag("g:adult", record.adult));
  parts.push(tag("g:is_bundle", record.isBundle));
  parts.push(tag("g:energy_efficiency_class", record.energyEfficiencyClass));
  parts.push(tag("g:age_group", record.ageGroup));
  parts.push(tag("g:gender", record.gender));

  for (const highlight of record.productHighlights) {
    parts.push(tag("g:product_highlight", highlight));
  }

  // ---- Livraison ----
  // Une balise par mode : Google en accepte plusieurs par article, et le coût
  // de livraison vers l'Allemagne doit être explicite (Shopping / fiches
  // gratuites).
  for (const ship of record.shipping) {
    parts.push("    <g:shipping>\n");
    parts.push(tag("g:country", ship.country, "      "));
    parts.push(tag("g:service", ship.service, "      "));
    parts.push(tag("g:price", ship.price, "      "));
    parts.push(tag("g:min_handling_time", ship.minHandlingTime, "      "));
    parts.push(tag("g:max_handling_time", ship.maxHandlingTime, "      "));
    parts.push(tag("g:min_transit_time", ship.minTransitTime, "      "));
    parts.push(tag("g:max_transit_time", ship.maxTransitTime, "      "));
    parts.push("    </g:shipping>\n");
  }
  parts.push(tag("g:shipping_weight", record.shippingWeight));
  parts.push(tag("g:ships_from_country", record.shipsFromCountry));

  // ---- Étiquettes internes, pour segmenter les campagnes ----
  parts.push(tag("g:custom_label_0", record.customLabel0));
  parts.push(tag("g:custom_label_1", record.customLabel1));

  parts.push("  </item>\n");
  return parts.join("");
}

export async function GET(): Promise<Response> {
  const products = await loadMerchantProducts({ respectSelection: true, onlyPurchasable: true });
  const items = products.map((product) => itemXml(buildMerchantRecord(product))).join("");
  const base = siteUrl();

  const channelHeader =
    tag("title", `${SHOP_NAME}: Produktdatenfeed`, "  ") +
    tag("link", base, "  ") +
    tag(
      "description",
      "Vollständiger Produktdatenfeed für Google Merchant Center: See-, Lager-, Büro-, Sanitär- und Sondercontainer.",
      "  ",
    ) +
    tag("language", MERCHANT_LANGUAGE, "  ");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="${GOOGLE_NS}">\n` +
    `<channel>\n${channelHeader}${items}</channel>\n</rss>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Merchant Center récupère le flux une fois par jour : une heure de cache
      // CDN suffit et évite de recalculer le document à chaque requête.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
