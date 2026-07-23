import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryRow } from "@/components/CategoryRow";
import { ProductGrid } from "@/components/ProductGrid";
import { PromoGrid } from "@/components/PromoGrid";
import type { Product } from "@/types/home";

const highlights: Product[] = [
  {
    brand: "Bosch",
    name: "Serie 6 Kühl-Gefrierkombination, No Frost",
    bullets: ["359 L Nutzinhalt", "Energieeffizienzklasse D", "VitaFresh Fach"],
    image: "/images/products/fridge.jpg",
    alt: "Bosch Kühl-Gefrierkombination",
    oldPrice: "1.099,99 €",
    price: "899,99 €",
    badge: "-18%",
    href: "/kuehlen-gefrieren",
  },
  {
    brand: "Samsung",
    name: "QuickDrive Waschmaschine, 9 kg",
    bullets: ["1400 U/Min", "AddWash Funktion", "WLAN-Steuerung"],
    image: "/images/products/washing-machine.jpg",
    alt: "Samsung Waschmaschine",
    oldPrice: "699,00 €",
    price: "549,00 €",
    badge: "-21%",
    href: "/waschen-trocknen",
  },
  {
    brand: "De'Longhi",
    name: "Magnifica Kaffeevollautomat",
    bullets: ["Kegelmahlwerk", "Milchaufschäumer", "5 Getränke auf Knopfdruck"],
    image: "/images/products/coffee-machine.jpg",
    alt: "De'Longhi Kaffeevollautomat",
    oldPrice: "449,00 €",
    price: "349,00 €",
    badge: "Bestseller",
    href: "/kleingeraete",
  },
  {
    brand: "LG",
    name: "OLED evo 55\" 4K Fernseher",
    bullets: ["120 Hz Gaming", "Dolby Vision", "webOS Smart TV"],
    image: "/images/products/tv.jpg",
    alt: "LG OLED Fernseher",
    oldPrice: "1.499,00 €",
    price: "1.199,00 €",
    badge: "-20%",
    href: "/tv-audio",
  },
  {
    brand: "iRobot",
    name: "Roomba Saugroboter mit Wischfunktion",
    bullets: ["App-Steuerung", "Automatische Absaugstation", "Für Tierhaare"],
    image: "/images/products/vacuum.jpg",
    alt: "iRobot Saugroboter",
    oldPrice: "549,00 €",
    price: "399,00 €",
    badge: "-27%",
    href: "/reinigung",
  },
  {
    brand: "Miele",
    name: "Einbaubackofen mit Pyrolyse",
    bullets: ["73 L Garraum", "Umluft plus", "Selbstreinigung"],
    image: "/images/products/oven.jpg",
    alt: "Miele Einbaubackofen",
    price: "799,00 €",
    badge: "Neu",
    href: "/kueche",
  },
];

const deals: Product[] = [
  {
    brand: "Philips",
    name: "Standmixer 1200 W",
    bullets: ["ProBlend 6 Technologie", "2 L Glasbehälter", "Eiscrush-Funktion"],
    image: "/images/products/blender.jpg",
    alt: "Philips Standmixer",
    oldPrice: "89,99 €",
    price: "59,99 €",
    badge: "-33%",
    href: "/kleingeraete",
  },
  {
    brand: "Amazon",
    name: "Echo Dot Smart Speaker",
    bullets: ["Sprachsteuerung Alexa", "Smart-Home-Zentrale", "Kompaktes Design"],
    image: "/images/products/smart-speaker.jpg",
    alt: "Smart Speaker",
    oldPrice: "59,99 €",
    price: "39,99 €",
    badge: "-33%",
    href: "/smart-home",
  },
  {
    brand: "Daikin",
    name: "Split-Klimagerät 3,5 kW",
    bullets: ["Kühlen & Heizen", "WLAN-fähig", "Flüsterleiser Betrieb"],
    image: "/images/products/aircon.jpg",
    alt: "Daikin Klimagerät",
    oldPrice: "899,00 €",
    price: "699,00 €",
    badge: "-22%",
    href: "/klimageraete",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <CategoryRow />
        <ProductGrid heading="Highlights" ctaLabel="Alle Highlights anzeigen" ctaHref="/highlights" products={highlights} />
        <PromoGrid />
        <ProductGrid heading="Aktuelle Deals" ctaLabel="Alle Angebote anzeigen" ctaHref="/angebote" products={deals} />
      </main>
      <Footer />
    </>
  );
}
