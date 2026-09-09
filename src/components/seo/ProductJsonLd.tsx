import { JsonLd } from "@/components/seo/JsonLd";
import { getMerchantProductBySlug } from "@/server/merchant";
import { buildProductJsonLdData } from "@/server/productJsonLd";
import type { ReviewRecord } from "@/server/types";
import type { Product } from "@/types/home";

// Balisage JSON-LD Product + Offer de la page produit.
//
// La construction de l'objet vit dans `src/server/productJsonLd.ts` pour qu'elle
// soit contrôlable produit par produit hors React (scripts/audit-jsonld.ts).
// Les valeurs viennent de `buildMerchantRecord()`, exactement comme le flux
// Merchant Center : prix, disponibilité, état et identifiants ne peuvent donc
// pas diverger entre le flux, le balisage et la page.
//
// Composant serveur : le <script type="application/ld+json"> est donc présent
// dans le HTML initial, sans dépendre d'un rendu JavaScript côté client.

interface ProductJsonLdProps {
  /** Le produit tel que la page le rend déjà. */
  product: Pick<Product, "slug">;
  /**
   * Avis validés, ceux-là mêmes que la page affiche. La note agrégée en est
   * déduite plutôt que reprise du catalogue : Google interdit d'annoncer une
   * note qui ne repose pas sur des avis visibles.
   */
  reviews: ReviewRecord[];
}

export async function ProductJsonLd({ product, reviews }: ProductJsonLdProps) {
  if (!product.slug) return null;

  const row = await getMerchantProductBySlug(product.slug);
  if (!row) return null;

  return <JsonLd data={buildProductJsonLdData(row, reviews)} />;
}
