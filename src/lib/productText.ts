import type { Product } from "@/types/home";

// Les descriptions saisies dans le back-office ont toujours la priorité.
// Tant qu'un produit n'en a pas, on compose un texte à partir des données
// réelles de la fiche : jamais de texte de remplissage sur la boutique.
//
// Le produit et le libellé de catégorie reçus ici sont déjà localisés ; seule
// la phrase d'assemblage dépend encore de la langue.

export function productShortText(
  product: Product,
  categoryLabel: string,
  locale: string = "de",
): string {
  if (product.shortDescription?.trim()) return product.shortDescription.trim();

  const highlights = product.bullets.slice(0, 2).join(" · ");

  if (locale === "en") {
    return highlights
      ? `${categoryLabel} by ${product.brand} — ${highlights}.`
      : `${categoryLabel} by ${product.brand}.`;
  }

  return highlights
    ? `${categoryLabel} von ${product.brand} — ${highlights}.`
    : `${categoryLabel} von ${product.brand}.`;
}

// Coupe sur un espace plutôt qu'en plein mot ; utilisé pour les balises
// <title> et meta description, que Google tronque brutalement au-delà d'une
// certaine longueur (perte du suffixe de marque, phrase coupée en plein mot).
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function productLongText(
  product: Product,
  categoryLabel: string,
  locale: string = "de",
): string {
  if (product.description?.trim()) return product.description.trim();

  const features = product.bullets.join(", ").toLowerCase();

  if (locale === "en") {
    return features
      ? `The ${product.brand} ${product.name} stands out in the ${categoryLabel} category with ${features}. A dependable choice for anyone who values quality and good value for money.`
      : `The ${product.brand} ${product.name} from our ${categoryLabel} range stands for dependable quality and good value for money.`;
  }

  return features
    ? `Der ${product.brand} ${product.name} überzeugt in der Kategorie ${categoryLabel} durch ${features}. Eine zuverlässige Wahl für alle, die Wert auf Qualität und ein gutes Preis-Leistungs-Verhältnis legen.`
    : `Der ${product.brand} ${product.name} aus der Kategorie ${categoryLabel} steht für zuverlässige Qualität und ein gutes Preis-Leistungs-Verhältnis.`;
}
