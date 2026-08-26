import type { Product } from "@/types/home";

/**
 * Extrait du stock présenté sur la page d'accueil.
 *
 * Les fiches reprennent des containers réellement proposés par l'entreprise :
 * désignations, cotes, équipements et prix viennent des catalogues existants
 * (containerlog-gmbh.de), tout comme les photos, reprises dans
 * `public/images/produkte`. Rien n'est inventé ici : une cote ou un prix qui
 * n'existe pas dans le catalogue n'a pas sa place dans cette liste.
 *
 * Ces fiches ne vivent pas encore en base : le catalogue Prisma sert encore le
 * fonds de démonstration hérité de l'ancien projet. Les cartes renvoient donc
 * vers la page de sortiment plutôt que vers une fiche produit inexistante.
 */
export const HOME_CONTAINERS: readonly Product[] = [
  {
    slug: "seecontainer-20-fuss-standard",
    brand: "Seecontainer",
    name: "20 Fuß Standardcontainer",
    bullets: ["6.058 × 2.438 × 2.591 mm", "33 m³ Stauraum", "Nutzlast 28.230 kg"],
    shortDescription:
      "Der Klassiker für Transport und Lagerung: robust, wetterfest und sofort einsatzbereit.",
    image: "/images/produkte/seecontainer-20-fuss-standard.jpg",
    alt: "20 Fuß Standardcontainer in Seitenansicht",
    price: "1.451,00 €",
    href: "/sortiment#seecontainer",
    inStock: true,
  },
  {
    slug: "seecontainer-10-fuss-high-cube",
    brand: "Seecontainer",
    name: "10 Fuß High Cube Seecontainer",
    bullets: ["2.991 × 2.438 mm", "IICL6-Standard", "Erhöhte Innenhöhe"],
    shortDescription:
      "Kompakte Einheit nach IICL6-Standard, wo Stellfläche knapp und Höhe gefragt ist.",
    image: "/images/produkte/seecontainer-10-fuss-high-cube.jpg",
    alt: "10 Fuß High Cube Seecontainer",
    price: "1.050,00 €",
    href: "/sortiment#seecontainer",
    inStock: true,
  },
  {
    slug: "lagercontainer-2x2-doppeltuer",
    brand: "Lagercontainer",
    name: "Lagercontainer 2 × 2 m mit Doppeltür",
    bullets: ["2,00 × 2,00 m", "Zerlegbar, ohne Kran", "Doppeltür über die volle Breite"],
    shortDescription:
      "Zerlegbare Einheit, die sich von Hand durch schmale Zugänge tragen lässt: kein Kran, kein Stapler nötig.",
    image: "/images/produkte/lagercontainer-2x2-doppeltuer.jpg",
    alt: "Anthrazitfarbener Lagercontainer 2 × 2 Meter mit Doppeltür",
    price: "1.100,00 €",
    href: "/sortiment#lagercontainer",
    inStock: true,
  },
  {
    slug: "lagercontainer-8x2-gross",
    brand: "Lagercontainer",
    name: "Großer Lagercontainer 8 × 2 m",
    bullets: ["8,00 × 2,00 m", "Durchgehender Lagerraum", "Ohne Sondertransport"],
    shortDescription:
      "Zwei gekoppelte Module ohne Trennwand: ein durchgehender Raum, wasserdicht verbunden.",
    image: "/images/produkte/lagercontainer-8x2-gross.jpg",
    alt: "Großer Lagercontainer 8 × 2 Meter mit geöffneten Türen",
    price: "3.600,00 €",
    href: "/sortiment#lagercontainer",
    inStock: true,
  },
  {
    slug: "buerocontainer-350x220",
    brand: "Bürocontainer",
    name: "Bürocontainer 3,50 × 2,20 m",
    bullets: ["Höhe 2,70 m", "75 mm Sandwichpaneele", "Heizkörper 2.000 W"],
    shortDescription:
      "Neuer Bürocontainer mit isoliertem Boden und Dach, Dreh-Kipp-Fenstern und kompletter Elektroinstallation nach CE.",
    image: "/images/produkte/buerocontainer-350x220.jpg",
    alt: "Bürocontainer 3,50 × 2,20 Meter mit Fenster und Stahltür",
    price: "1.299,00 €",
    href: "/sortiment#buerocontainer",
    inStock: true,
  },
  {
    slug: "buerocontainer-panorama",
    brand: "Bürocontainer",
    name: "Mobiler Bürocontainer mit Panoramafenstern",
    bullets: ["6.000 × 2.430 × 2.791 mm", "4 Panoramafenster", "70 mm PU-Dachdämmung"],
    shortDescription:
      "Anthrazitgrauer Rahmen, raumhohe Fenster und Steinwolldämmung: ein Büro, das auch als Empfang oder Verkaufsraum überzeugt.",
    image: "/images/produkte/buerocontainer-panorama.jpg",
    alt: "Mobiler Bürocontainer mit großen Panoramafenstern",
    price: "1.499,00 €",
    href: "/sortiment#buerocontainer",
    inStock: true,
  },
  {
    slug: "sanitaercontainer-dusche-wc",
    brand: "Sanitärcontainer",
    name: "Sanitärcontainer mit Dusche, WC und Urinal",
    bullets: ["Doppelkabine", "Durchlauferhitzer", "RAL 7016 Anthrazitgrau"],
    shortDescription:
      "Voll ausgestattete Sanitäreinheit für Baustellen und Veranstaltungen, mit sofort heißem Wasser an der Dusche.",
    image: "/images/produkte/sanitaercontainer-dusche-wc.jpg",
    alt: "Sanitärcontainer in Anthrazitgrau mit Dusche und WC",
    price: "2.550,00 €",
    href: "/sortiment#sanitaercontainer",
    inStock: true,
  },
  {
    slug: "sondercontainer-20-fuss-open-side",
    brand: "Sondercontainer",
    name: "20 Fuß Open Side Container",
    bullets: ["6.058 × 2.438 × 2.591 mm", "Voll öffnende Seitenwand", "Nutzlast 27.680 kg"],
    shortDescription:
      "Seitenwand über die gesamte Länge zu öffnen: Be- und Entladen ohne Umstapeln, auch bei sperrigem Gut.",
    image: "/images/produkte/sondercontainer-20-fuss-open-side.jpg",
    alt: "20 Fuß Open Side Container mit geöffneter Seitenwand",
    price: "1.850,00 €",
    href: "/sortiment#sondercontainer",
    inStock: true,
  },
] as const;
