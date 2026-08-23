import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";

// Balisage ItemList d'une page catégorie : la liste des produits telle
// qu'affichée, dans le même ordre. Suit le format que Google documente pour
// les carrousels génériques (position + url par élément, sans dupliquer prix
// ou disponibilité : ces informations restent au balisage Product de chaque
// fiche, seule source qui doive rester alignée sur le flux Merchant).

export interface ItemListJsonLdItem {
  name: string;
  /** URL absolue, déjà résolue dans la bonne langue. */
  url: string;
}

export function ItemListJsonLd({ items }: { items: ItemListJsonLdItem[] }) {
  if (items.length === 0) return null;

  const elements: JsonLdValue[] = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: item.url,
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: elements,
      }}
    />
  );
}
