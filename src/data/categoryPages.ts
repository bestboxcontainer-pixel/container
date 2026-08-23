import type { Product } from "@/types/home";
import { slugify } from "@/lib/slugify";

export interface CategoryGuideSection {
  heading: string;
  body: string;
}

export interface CategoryGuide {
  intro: string;
  sections: CategoryGuideSection[];
  closing: string;
}

export interface CategoryPageData {
  group: "haushalt" | "multimedia";
  slug: string;
  groupLabel: string;
  label: string;
  description: string;
  image: string;
  brands: string[];
  products: Product[];
  guide: CategoryGuide;
}

interface RawProduct {
  brand: string;
  name: string;
  bullets: string[];
  oldPrice?: string;
  price: string;
  badge?: string;
  rating: number;
  inStock: boolean;
}

function buildCategory(
  group: "haushalt" | "multimedia",
  slug: string,
  label: string,
  description: string,
  image: string,
  raw: RawProduct[],
  guide: CategoryGuide,
): CategoryPageData {
  return {
    group,
    slug,
    groupLabel: group === "haushalt" ? "Haushalt" : "Multimedia",
    label,
    description,
    image,
    brands: raw.map((product) => product.brand),
    products: raw.map((product) => {
      const productSlug = slugify(`${product.brand}-${product.name}`);
      return {
        ...product,
        image,
        alt: `${product.brand} ${product.name}`,
        href: `/${group}/${slug}/${productSlug}`,
        slug: productSlug,
        sku: productSlug.replace(/-/g, "").slice(0, 10).toUpperCase(),
      };
    }),
    guide,
  };
}

export const categoryPages: CategoryPageData[] = [
  buildCategory(
    "haushalt",
    "kaffeemaschinen",
    "Kaffeemaschinen",
    "Kaffeevollautomaten und Filterkaffeemaschinen für perfekten Genuss jeden Morgen.",
    "/images/products/coffee-machine.jpg",
    [
      {
        brand: "De'Longhi",
        name: "Magnifica Kaffeevollautomat",
        bullets: ["Kegelmahlwerk", "Milchaufschäumer", "5 Getränke auf Knopfdruck"],
        oldPrice: "449,00 €",
        price: "349,00 €",
        badge: "Bestseller",
        rating: 4.7,
        inStock: true,
      },
      {
        brand: "Siemens",
        name: "EQ.6 plus s700 Kaffeevollautomat",
        bullets: ["OneTouch DoubleCup", "sensoFlow System", "iAroma System"],
        price: "899,00 €",
        badge: "Neu",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Krups",
        name: "Evidence Kaffeevollautomat",
        bullets: ["15 Kaffeespezialitäten", "Quattro Force Technologie", "Reinigungsautomatik"],
        oldPrice: "799,00 €",
        price: "649,00 €",
        badge: "-19%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Philips",
        name: "Series 2200 Kaffeevollautomat",
        bullets: ["Klassisches Milchsystem", "LatteGo", "5 Kaffeespezialitäten"],
        oldPrice: "379,00 €",
        price: "299,00 €",
        badge: "-21%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Jura",
        name: "ENA 4 Kaffeevollautomat",
        bullets: ["Pulse Extraction Process", "P.E.P.® Aroma", "Kompaktes Design"],
        price: "649,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "Melitta",
        name: "Caffeo Solo Kaffeevollautomat",
        bullets: ["Kegelmahlwerk", "One-Touch-Bedienung", "Aroma Extraction Technology"],
        oldPrice: "279,00 €",
        price: "219,00 €",
        badge: "-21%",
        rating: 4.2,
        inStock: true,
      },
    ],
    {
      intro:
        "Vom klassischen Kaffeevollautomaten bis zur kompakten Siebträgermaschine, bei BBC Best Box Containerhandel e.K. finden Sie die passende Lösung für Ihren perfekten Kaffeegenuss.",
      sections: [
        {
          heading: "Kaffeevollautomat oder Siebträgermaschine?",
          body: "Vollautomaten übernehmen Mahlen, Brühen und Milchaufschäumen auf Knopfdruck, ideal für den Alltag. Wer Wert auf volle Kontrolle über Mahlgrad, Brühdruck und Crema legt, greift zur klassischen Siebträgermaschine.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf ein Kegelmahlwerk statt Schlagmahlwerk für ein gleichmäßigeres Mahlergebnis, eine einfache Reinigungsautomatik sowie die Anzahl der wählbaren Kaffeespezialitäten.",
        },
        {
          heading: "Beliebte Marken im Bereich Kaffeemaschinen",
          body: "De'Longhi, Siemens, Jura, Krups, Philips und Melitta zählen zu den gefragtesten Herstellern, bei uns finden Sie aktuelle Modelle aller Marken im direkten Vergleich.",
        },
      ],
      closing:
        "Sie sind sich unsicher, welche Kaffeemaschine zu Ihrem Kaffeekonsum passt? Unser Serviceteam berät Sie gerne persönlich.",
    },
  ),
  buildCategory(
    "haushalt",
    "waschmaschinen",
    "Waschmaschinen",
    "Frontlader mit hoher Schleuderleistung, Dosierautomatik und leiser Betrieb.",
    "/images/products/washing-machine.jpg",
    [
      {
        brand: "Samsung",
        name: "QuickDrive Waschmaschine, 9 kg",
        bullets: ["1400 U/Min", "AddWash Funktion", "WLAN-Steuerung"],
        oldPrice: "699,00 €",
        price: "549,00 €",
        badge: "-21%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "Bosch",
        name: "Serie 6 Waschmaschine, 8 kg",
        bullets: ["i-DOS Dosierautomatik", "AllergyPlus", "EcoSilence Antrieb"],
        oldPrice: "649,00 €",
        price: "499,00 €",
        badge: "-22%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Siemens",
        name: "iQ500 Waschmaschine, 9 kg",
        bullets: ["varioPerfect", "aquaStop", "Home Connect"],
        price: "749,00 €",
        badge: "Neu",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "LG",
        name: "AI DD Waschmaschine, 10,5 kg",
        bullets: ["Direct Drive Motor", "TurboWash 360°", "WLAN-Steuerung"],
        oldPrice: "799,00 €",
        price: "629,00 €",
        badge: "-21%",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Miele",
        name: "W1 Waschmaschine, 8 kg",
        bullets: ["PowerWash System", "Schontrommel", "Made in Germany"],
        price: "999,00 €",
        badge: "Premium",
        rating: 4.9,
        inStock: false,
      },
      {
        brand: "AEG",
        name: "6000 Series Waschmaschine, 7 kg",
        bullets: ["ÖkoMix Technologie", "SensiCare System", "Startzeitvorwahl"],
        oldPrice: "549,00 €",
        price: "429,00 €",
        badge: "-22%",
        rating: 4.2,
        inStock: true,
      },
    ],
    {
      intro:
        "Saubere Wäsche, geringer Energieverbrauch und leiser Betrieb, unsere Waschmaschinen überzeugen mit moderner Technik für jeden Haushalt.",
      sections: [
        {
          heading: "Frontlader oder Toplader?",
          body: "Frontlader bieten ein größeres Trommelvolumen und lassen sich als Waschturm mit einem Trockner kombinieren. Toplader punkten mit geringerem Platzbedarf und einfacher Beladung von oben.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtige Kennzahlen sind die Schleuderdrehzahl (mind. 1400 U/Min für schnelleres Trocknen), die Energieeffizienzklasse sowie Sonderprogramme wie Mischgewebe oder Sportwäsche.",
        },
        {
          heading: "Beliebte Marken im Bereich Waschmaschinen",
          body: "Samsung, Bosch, Siemens, LG, Miele und AEG bieten zuverlässige Modelle mit smarter App-Steuerung und geringem Wasserverbrauch.",
        },
      ],
      closing: "Fragen zu Anschluss, Maßen oder passendem Zubehör? Unser Serviceteam hilft Ihnen gerne weiter.",
    },
  ),
  buildCategory(
    "haushalt",
    "geschirrspueler",
    "Geschirrspüler",
    "Vollintegrierbare und teilintegrierbare Geschirrspüler für jede Küche.",
    "/images/products/dishwasher.jpg",
    [
      {
        brand: "Bosch",
        name: "Geschirrspüler vollintegrierbar",
        bullets: ["14 Maßgedecke", "Home Connect", "Energieeffizienzklasse C"],
        oldPrice: "649,00 €",
        price: "499,00 €",
        badge: "-22%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Siemens",
        name: "iQ300 Geschirrspüler",
        bullets: ["varioSpeed Plus", "Aqua-Sensor", "3 Körbe"],
        oldPrice: "599,00 €",
        price: "479,00 €",
        badge: "-20%",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Miele",
        name: "G 7000 Geschirrspüler",
        bullets: ["AutoDos", "3D-Besteckschublade", "Made in Germany"],
        price: "1.099,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "AEG",
        name: "6000 Series Geschirrspüler",
        bullets: ["AirDry Technologie", "SoftGrip Körbe", "60-Minuten-Programm"],
        oldPrice: "549,00 €",
        price: "429,00 €",
        badge: "-22%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Beko",
        name: "Geschirrspüler teilintegrierbar",
        bullets: ["AquaIntense", "EcoNightWash", "13 Maßgedecke"],
        price: "379,00 €",
        badge: "Neu",
        rating: 4.1,
        inStock: true,
      },
      {
        brand: "Neff",
        name: "N 50 Geschirrspüler",
        bullets: ["emotionLight", "Zeolith-Trocknung", "FlexRack Plus"],
        oldPrice: "749,00 €",
        price: "599,00 €",
        badge: "-20%",
        rating: 4.4,
        inStock: true,
      },
    ],
    {
      intro:
        "Ob vollintegrierbar oder freistehend: ein guter Geschirrspüler spart Zeit, Wasser und Energie im Vergleich zum Abwasch von Hand.",
      sections: [
        {
          heading: "Vollintegrierbar, teilintegrierbar oder freistehend?",
          body: "Vollintegrierbare Geräte verschwinden komplett hinter einer Möbelfront, teilintegrierbare zeigen nur das Bedienfeld, und freistehende Modelle lassen sich flexibel überall aufstellen.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf die Anzahl der Maßgedecke, den Wasserverbrauch pro Spülgang sowie praktische Extras wie Besteckschublade und automatische Dosierung.",
        },
        {
          heading: "Beliebte Marken im Bereich Geschirrspüler",
          body: "Bosch, Siemens, Miele, AEG, Neff und Beko gehören zu den zuverlässigsten Herstellern mit langer Lebensdauer und leisen Programmen.",
        },
      ],
      closing: "Unsicher bei der passenden Einbaugröße? Kontaktieren Sie unser Serviceteam für eine unverbindliche Beratung.",
    },
  ),
  buildCategory(
    "haushalt",
    "staubsauger",
    "Staubsauger",
    "Saugroboter, Akkusauger und Bodenstaubsauger für mühelose Sauberkeit.",
    "/images/products/vacuum.jpg",
    [
      {
        brand: "iRobot",
        name: "Roomba Saugroboter mit Wischfunktion",
        bullets: ["App-Steuerung", "Automatische Absaugstation", "Für Tierhaare"],
        oldPrice: "549,00 €",
        price: "399,00 €",
        badge: "-27%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "Dyson",
        name: "V15 Detect Akkusauger",
        bullets: ["Laser-Staubsichtbarkeit", "LCD-Display", "Bis 60 Min. Laufzeit"],
        price: "649,00 €",
        badge: "Premium",
        rating: 4.7,
        inStock: false,
      },
      {
        brand: "Miele",
        name: "Complete C3 Bodenstaubsauger",
        bullets: ["HEPA-Filter", "Variabler Saugkraftregler", "Made in Germany"],
        oldPrice: "349,00 €",
        price: "279,00 €",
        badge: "-20%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Kärcher",
        name: "VC 6 Bodenstaubsauger",
        bullets: ["RotorTurbine", "Geräuscharm", "Beutellos"],
        price: "199,00 €",
        badge: "Neu",
        rating: 4.0,
        inStock: true,
      },
      {
        brand: "Philips",
        name: "3000 Series Saugroboter",
        bullets: ["Kartierung per App", "AquaProtect", "Automatische Ladefunktion"],
        oldPrice: "399,00 €",
        price: "299,00 €",
        badge: "-25%",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Rowenta",
        name: "X-Force Flex Akkusauger",
        bullets: ["3-in-1-Reinigung", "Flexibles Gelenk", "LED-Nachleuchten"],
        oldPrice: "279,00 €",
        price: "219,00 €",
        badge: "-21%",
        rating: 4.3,
        inStock: true,
      },
    ],
    {
      intro:
        "Von klassischen Bodenstaubsaugern über wendige Akkusauger bis zum selbstständigen Saugroboter, wir haben die passende Lösung für jeden Boden.",
      sections: [
        {
          heading: "Beutellos, mit Beutel oder Saugroboter?",
          body: "Beutellose Modelle sparen Folgekosten, Beutelsauger halten die Hygiene beim Entleeren höher, und Saugroboter übernehmen die Reinigung vollautomatisch nach Zeitplan.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtig sind Saugleistung, Akkulaufzeit bei kabellosen Geräten, ein HEPA-Filter für Allergiker sowie die Eignung für Hartböden und Teppiche gleichermaßen.",
        },
        {
          heading: "Beliebte Marken im Bereich Staubsauger",
          body: "iRobot, Dyson, Miele, Kärcher, Philips und Rowenta bieten Modelle für jeden Bedarf und jedes Budget.",
        },
      ],
      closing: "Noch Fragen zur passenden Saugleistung für Ihre Wohnfläche? Wir beraten Sie gerne.",
    },
  ),
  buildCategory(
    "haushalt",
    "backoefen-herde",
    "Backöfen & Herde",
    "Einbaubacköfen, Herd-Sets und Kochfelder mit Pyrolyse und smarten Funktionen.",
    "/images/products/oven.jpg",
    [
      {
        brand: "Miele",
        name: "Einbaubackofen mit Pyrolyse",
        bullets: ["73 L Garraum", "Umluft plus", "Selbstreinigung"],
        price: "799,00 €",
        badge: "Neu",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Bosch",
        name: "Serie 6 Einbaubackofen",
        bullets: ["3D-Heißluft", "PerfectBake", "Assistenzfunktionen"],
        oldPrice: "899,00 €",
        price: "699,00 €",
        badge: "-22%",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Siemens",
        name: "iQ500 Einbaubackofen",
        bullets: ["coolStart", "activeClean", "Home Connect"],
        price: "849,00 €",
        badge: "Neu",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "AEG",
        name: "SurroundCook Einbaubackofen",
        bullets: ["SteamBake Funktion", "Pyrolyse-Selbstreinigung", "Vollteleskopauszug"],
        oldPrice: "999,00 €",
        price: "799,00 €",
        badge: "-20%",
        rating: 4.2,
        inStock: true,
      },
      {
        brand: "Neff",
        name: "Slide&Hide Einbaubackofen",
        bullets: ["Versenkbare Backofentür", "CircoTherm", "VarioSteam"],
        price: "949,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "Bauknecht",
        name: "Einbauherd-Set",
        bullets: ["Autark-Kochfeld inklusive", "4 Kochzonen", "Aqua-Clean"],
        oldPrice: "699,00 €",
        price: "549,00 €",
        badge: "-21%",
        rating: 4.1,
        inStock: true,
      },
    ],
    {
      intro:
        "Vom Einbaubackofen mit Pyrolyse-Selbstreinigung bis zum kompletten Herd-Set, für jede Küche die passende Wärmequelle.",
      sections: [
        {
          heading: "Einbaubackofen oder Herd-Set?",
          body: "Ein separater Einbaubackofen lässt sich frei in Augenhöhe platzieren, ein Herd-Set kombiniert Backofen und Kochfeld platzsparend in einer Einheit.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf Garraumgröße, Umluft- und Heißluftfunktionen, Selbstreinigung per Pyrolyse sowie smarte Assistenzprogramme.",
        },
        {
          heading: "Beliebte Marken im Bereich Backöfen & Herde",
          body: "Miele, Bosch, Siemens, AEG, Neff und Bauknecht überzeugen mit langlebiger Technik und intuitiver Bedienung.",
        },
      ],
      closing: "Wir beraten Sie gerne zu Einbaumaßen und dem passenden Kochfeld für Ihren neuen Backofen.",
    },
  ),
  buildCategory(
    "haushalt",
    "kuechenmaschinen",
    "Küchenmaschinen",
    "Küchenmaschinen und Mixer für Teig, Smoothies und alles dazwischen.",
    "/images/products/blender.jpg",
    [
      {
        brand: "Philips",
        name: "Küchenmaschine 1200 W",
        bullets: ["ProBlend 6 Technologie", "2 L Glasbehälter", "Eiscrush-Funktion"],
        oldPrice: "89,99 €",
        price: "59,99 €",
        badge: "-33%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Bosch",
        name: "MUM5 Küchenmaschine",
        bullets: ["1000 W Motor", "3D PlanetaryMixing", "3,9 L Edelstahlschüssel"],
        oldPrice: "349,00 €",
        price: "279,00 €",
        badge: "-20%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "KitchenAid",
        name: "Artisan Küchenmaschine",
        bullets: ["4,8 L Edelstahlschüssel", "10 Geschwindigkeitsstufen", "Robuster Metallkorpus"],
        price: "599,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "Kenwood",
        name: "Chef Titanium Küchenmaschine",
        bullets: ["1400 W Motor", "Planetarisches Rührsystem", "Umfangreiches Zubehör"],
        oldPrice: "499,00 €",
        price: "379,00 €",
        badge: "-24%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "WMF",
        name: "Kult X Küchenmaschine",
        bullets: ["Kompaktes Design", "500 W Motor", "Mix & Go Trinkflasche"],
        price: "149,00 €",
        badge: "Neu",
        rating: 4.0,
        inStock: true,
      },
      {
        brand: "Krups",
        name: "Prep&Cook Küchenmaschine",
        bullets: ["Kochfunktion bis 130°C", "4,5 L Schüssel", "Integrierte Waage"],
        oldPrice: "449,00 €",
        price: "349,00 €",
        badge: "-22%",
        rating: 4.4,
        inStock: true,
      },
    ],
    {
      intro:
        "Kneten, Rühren, Mixen und mehr: eine Küchenmaschine erleichtert die tägliche Zubereitung in der Küche erheblich.",
      sections: [
        {
          heading: "Kompakte Küchenmaschine oder Profi-Modell?",
          body: "Kompakte Modelle eignen sich für gelegentliches Mixen und kleine Mengen, Profi-Küchenmaschinen mit großer Schüssel und starkem Motor meistern auch schwere Teige mühelos.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtig sind Motorleistung, Schüsselvolumen, die Anzahl der Geschwindigkeitsstufen sowie mitgeliefertes Zubehör wie Rühr-, Knet- und Schneidwerkzeuge.",
        },
        {
          heading: "Beliebte Marken im Bereich Küchenmaschinen",
          body: "Philips, Bosch, KitchenAid, Kenwood, WMF und Krups zählen zu den beliebtesten Herstellern für Hobby- und Profiköche.",
        },
      ],
      closing: "Fragen zum passenden Zubehör für Ihre Küchenmaschine? Unser Serviceteam hilft gerne weiter.",
    },
  ),
  buildCategory(
    "haushalt",
    "klimageraete",
    "Klimageräte",
    "Split- und mobile Klimageräte zum Kühlen und Heizen mit App-Steuerung.",
    "/images/products/aircon.jpg",
    [
      {
        brand: "Daikin",
        name: "Split-Klimagerät 3,5 kW",
        bullets: ["Kühlen & Heizen", "WLAN-fähig", "Flüsterleiser Betrieb"],
        oldPrice: "899,00 €",
        price: "699,00 €",
        badge: "-22%",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "LG",
        name: "Dualcool Klimagerät",
        bullets: ["Wi-Fi Steuerung", "Dual Inverter Kompressor", "Schlafmodus"],
        oldPrice: "799,00 €",
        price: "649,00 €",
        badge: "-19%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "De'Longhi",
        name: "Mobiles Klimagerät",
        bullets: ["3-in-1-Funktion", "Real Feel Technologie", "LED-Display"],
        price: "449,00 €",
        badge: "Neu",
        rating: 4.1,
        inStock: true,
      },
      {
        brand: "Comfee",
        name: "Mobiles Klimagerät 9000 BTU",
        bullets: ["App-Steuerung", "Entfeuchtungsfunktion", "Fensterkit inklusive"],
        oldPrice: "399,00 €",
        price: "329,00 €",
        badge: "-18%",
        rating: 4.0,
        inStock: true,
      },
      {
        brand: "Klarstein",
        name: "Split-Klimagerät 2,6 kW",
        bullets: ["Eco-Modus", "Timerfunktion", "Fernbedienung inklusive"],
        price: "599,00 €",
        badge: "Premium",
        rating: 4.7,
        inStock: false,
      },
      {
        brand: "Panasonic",
        name: "Etherea Split-Klimagerät",
        bullets: ["nanoeX Luftreinigung", "Flüsterleiser Betrieb", "WLAN-fähig"],
        oldPrice: "999,00 €",
        price: "799,00 €",
        badge: "-20%",
        rating: 4.6,
        inStock: true,
      },
    ],
    {
      intro:
        "Angenehme Temperaturen an heißen Tagen: mit unseren Split- und mobilen Klimageräten behalten Sie in jedem Raum einen kühlen Kopf.",
      sections: [
        {
          heading: "Mobiles Klimagerät oder fest installierte Split-Anlage?",
          body: "Mobile Geräte lassen sich ohne Montage sofort in Betrieb nehmen, Split-Klimaanlagen mit fest installierter Außeneinheit arbeiten leiser und effizienter im Dauerbetrieb.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf die Kühlleistung in kW passend zur Raumgröße, den Energieeffizienzstandard sowie Zusatzfunktionen wie Entfeuchtung und Heizen im Winter.",
        },
        {
          heading: "Beliebte Marken im Bereich Klimageräte",
          body: "Daikin, LG, De'Longhi, Comfee, Klarstein und Panasonic bieten zuverlässige Lösungen für Wohnung und Homeoffice.",
        },
      ],
      closing: "Unsicher bei der passenden Kühlleistung? Unser Serviceteam berät Sie gerne zu Ihrem Raum.",
    },
  ),
  buildCategory(
    "multimedia",
    "smartphones",
    "Smartphones",
    "Aktuelle Smartphone-Modelle mit starken Kameras und langer Akkulaufzeit.",
    "/images/products/smartphone.jpg",
    [
      {
        brand: "Apple",
        name: "iPhone 16, 128 GB",
        bullets: ["6,1\" Super Retina Display", "A18 Chip", "Dual-Kamera-System"],
        oldPrice: "899,00 €",
        price: "799,00 €",
        badge: "-11%",
        rating: 4.7,
        inStock: true,
      },
      {
        brand: "Samsung",
        name: "Galaxy S24, 256 GB",
        bullets: ["6,2\" Dynamic AMOLED", "Snapdragon 8 Gen 3", "Galaxy AI"],
        oldPrice: "899,00 €",
        price: "749,00 €",
        badge: "-17%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "Google",
        name: "Pixel 9, 128 GB",
        bullets: ["Tensor G4 Chip", "Google KI-Funktionen", "6,3\" OLED-Display"],
        price: "699,00 €",
        badge: "Neu",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Xiaomi",
        name: "14T, 256 GB",
        bullets: ["Leica-Kamerasystem", "120 W HyperCharge", "6,67\" AMOLED"],
        oldPrice: "649,00 €",
        price: "499,00 €",
        badge: "-23%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "OnePlus",
        name: "12, 256 GB",
        bullets: ["Hasselblad-Kamera", "100 W SUPERVOOC-Laden", "Snapdragon 8 Gen 3"],
        price: "749,00 €",
        badge: "Premium",
        rating: 4.5,
        inStock: false,
      },
      {
        brand: "Sony",
        name: "Xperia 1 VI, 256 GB",
        bullets: ["4K-Display", "Zeiss-Optik", "Triple-Kamera mit Zoom"],
        oldPrice: "1.299,00 €",
        price: "999,00 €",
        badge: "-23%",
        rating: 4.2,
        inStock: true,
      },
    ],
    {
      intro:
        "Von der Kamera bis zur Akkulaufzeit: bei uns finden Sie aktuelle Smartphones aller großen Hersteller im Vergleich.",
      sections: [
        {
          heading: "Welches Betriebssystem passt zu mir?",
          body: "iOS überzeugt mit nahtloser Integration ins Apple-Ökosystem, Android bietet mehr Auswahl an Herstellern, Preisklassen und individuellen Anpassungsmöglichkeiten.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtige Kriterien sind Displaygröße und -technologie, Kameraqualität, Akkukapazität sowie interner Speicherplatz und Update-Garantie.",
        },
        {
          heading: "Beliebte Marken im Bereich Smartphones",
          body: "Apple, Samsung, Google, Xiaomi, OnePlus und Sony liefern sich einen ständigen Wettlauf um Kamera, Leistung und Display.",
        },
      ],
      closing: "Fragen zum passenden Speicherplatz oder Zubehör? Unser Serviceteam berät Sie gerne.",
    },
  ),
  buildCategory(
    "multimedia",
    "videospiele",
    "Videospiele",
    "Controller, Headsets und Zubehör für Konsole und PC.",
    "/images/products/game-controller.jpg",
    [
      {
        brand: "Sony",
        name: "DualSense Wireless Controller",
        bullets: ["Haptisches Feedback", "Adaptive Trigger", "Eingebautes Mikrofon"],
        oldPrice: "74,99 €",
        price: "59,99 €",
        badge: "-20%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Microsoft",
        name: "Xbox Wireless Controller",
        bullets: ["Hybrid D-Pad", "Strukturierte Griffe", "Bluetooth-Kompatibilität"],
        oldPrice: "64,99 €",
        price: "54,99 €",
        badge: "-15%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Nintendo",
        name: "Switch Pro Controller",
        bullets: ["Amiibo-Funktion", "Bewegungssteuerung", "Integriertes HD-Rumble"],
        price: "69,99 €",
        badge: "Bestseller",
        rating: 4.8,
        inStock: true,
      },
      {
        brand: "Razer",
        name: "Kitty Edition Gaming-Headset",
        bullets: ["THX Spatial Audio", "Kabelloses Design", "RGB-Beleuchtung"],
        oldPrice: "129,00 €",
        price: "99,99 €",
        badge: "-22%",
        rating: 4.2,
        inStock: true,
      },
      {
        brand: "Logitech",
        name: "G29 Lenkrad mit Pedalen",
        bullets: ["Force-Feedback", "Echtleder-Lenkrad", "PS/PC-kompatibel"],
        price: "349,00 €",
        badge: "Premium",
        rating: 4.6,
        inStock: false,
      },
      {
        brand: "8BitDo",
        name: "Ultimate Controller 2.4G",
        bullets: ["Hall-Effekt-Sticks", "Programmierbare Tasten", "Ladestation inklusive"],
        oldPrice: "79,99 €",
        price: "64,99 €",
        badge: "-19%",
        rating: 4.4,
        inStock: true,
      },
    ],
    {
      intro:
        "Controller, Headsets und Gaming-Zubehör für ein noch intensiveres Spielerlebnis auf Konsole und PC.",
      sections: [
        {
          heading: "Kabelgebunden oder kabellos?",
          body: "Kabellose Controller und Headsets bieten mehr Bewegungsfreiheit, kabelgebundenes Zubehör punktet mit minimaler Latenz und entfällt bei der Akkuladung.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf Kompatibilität mit Ihrer Plattform, Akkulaufzeit bei kabellosen Geräten sowie Zusatzfunktionen wie haptisches Feedback oder programmierbare Tasten.",
        },
        {
          heading: "Beliebte Marken im Bereich Videospiele",
          body: "Sony, Microsoft, Nintendo, Razer, Logitech und 8BitDo zählen zu den bekanntesten Namen für Controller und Gaming-Zubehör.",
        },
      ],
      closing: "Unsicher, welches Zubehör zu Ihrer Konsole passt? Unser Serviceteam hilft gerne weiter.",
    },
  ),
  buildCategory(
    "multimedia",
    "fernseher",
    "Fernseher",
    "OLED, QLED und 4K-Fernseher für Kino-Feeling zu Hause.",
    "/images/products/tv.jpg",
    [
      {
        brand: "LG",
        name: "OLED evo 55\" 4K Fernseher",
        bullets: ["120 Hz Gaming", "Dolby Vision", "webOS Smart TV"],
        oldPrice: "1.499,00 €",
        price: "1.199,00 €",
        badge: "-20%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "Samsung",
        name: "Neo QLED 65\" 4K Fernseher",
        bullets: ["Quantum Matrix Technologie", "120 Hz Gaming", "Tizen Smart TV"],
        oldPrice: "1.799,00 €",
        price: "1.399,00 €",
        badge: "-22%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Sony",
        name: "Bravia XR 55\" OLED Fernseher",
        bullets: ["Cognitive Processor XR", "Acoustic Surface Audio", "Google TV"],
        price: "1.599,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "Philips",
        name: "Ambilight 50\" 4K Fernseher",
        bullets: ["3-seitiges Ambilight", "P5 Perfect Picture Engine", "Android TV"],
        oldPrice: "899,00 €",
        price: "699,00 €",
        badge: "-22%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Panasonic",
        name: "43\" 4K Fernseher",
        bullets: ["HDR10+", "Dolby Atmos", "Kompaktes Design"],
        price: "449,00 €",
        badge: "Neu",
        rating: 4.1,
        inStock: true,
      },
      {
        brand: "Hisense",
        name: "ULED 65\" 4K Fernseher",
        bullets: ["Quantum-Dot-Technologie", "Dolby Vision IQ", "Game Mode Pro"],
        oldPrice: "999,00 €",
        price: "749,00 €",
        badge: "-25%",
        rating: 4.4,
        inStock: true,
      },
    ],
    {
      intro:
        "OLED, QLED oder LED: für echtes Kino-Feeling zu Hause bieten wir aktuelle Fernseher aller gängigen Bildschirmtechnologien.",
      sections: [
        {
          heading: "OLED, QLED oder LED?",
          body: "OLED-Fernseher liefern perfektes Schwarz und starke Kontraste, QLED punktet mit hoher Spitzenhelligkeit, klassische LED-Modelle überzeugen preislich.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtig sind Bildschirmgröße passend zum Sitzabstand, Bildwiederholrate für Gaming, HDR-Unterstützung sowie die Smart-TV-Plattform.",
        },
        {
          heading: "Beliebte Marken im Bereich Fernseher",
          body: "LG, Samsung, Sony, Philips, Panasonic und Hisense bieten Modelle für jedes Budget und jeden Anspruch.",
        },
      ],
      closing: "Fragen zur passenden Bildschirmgröße für Ihr Wohnzimmer? Unser Serviceteam berät Sie gerne.",
    },
  ),
  buildCategory(
    "multimedia",
    "computer",
    "Computer",
    "Notebooks und Desktop-PCs für Arbeit, Kreativität und Gaming.",
    "/images/products/computer.jpg",
    [
      {
        brand: "Apple",
        name: "MacBook Air 13\" M3",
        bullets: ["8-Core CPU", "18 Std. Akkulaufzeit", "Liquid Retina Display"],
        oldPrice: "1.299,00 €",
        price: "1.149,00 €",
        badge: "-12%",
        rating: 4.7,
        inStock: true,
      },
      {
        brand: "Dell",
        name: "XPS 13 Notebook",
        bullets: ["Intel Core Ultra 7", "16 GB RAM", "InfinityEdge Display"],
        oldPrice: "1.399,00 €",
        price: "1.199,00 €",
        badge: "-14%",
        rating: 4.5,
        inStock: true,
      },
      {
        brand: "Lenovo",
        name: "ThinkPad X1 Carbon",
        bullets: ["14\" 2.8K-Display", "Robustes Carbon-Gehäuse", "Schnelle Aufladung"],
        price: "1.499,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "HP",
        name: "Pavilion Desktop PC",
        bullets: ["AMD Ryzen 7", "16 GB RAM", "512 GB SSD"],
        oldPrice: "799,00 €",
        price: "649,00 €",
        badge: "-19%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Asus",
        name: "ROG Strix Gaming-Notebook",
        bullets: ["RTX 4060", "165 Hz Display", "RGB-Tastatur"],
        price: "1.699,00 €",
        badge: "Neu",
        rating: 4.4,
        inStock: true,
      },
      {
        brand: "Acer",
        name: "Swift Go 14 Notebook",
        bullets: ["Intel Core i5", "OLED-Display", "10 Std. Akkulaufzeit"],
        oldPrice: "899,00 €",
        price: "749,00 €",
        badge: "-17%",
        rating: 4.2,
        inStock: true,
      },
    ],
    {
      intro:
        "Ob Notebook für unterwegs oder leistungsstarker Desktop-PC, bei uns finden Sie die passende Ausstattung für Arbeit, Kreativität und Gaming.",
      sections: [
        {
          heading: "Notebook oder Desktop-PC?",
          body: "Notebooks überzeugen durch Mobilität und integrierten Akku, Desktop-PCs bieten mehr Leistung, Erweiterbarkeit und meist ein besseres Preis-Leistungs-Verhältnis.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Achten Sie auf Prozessor und Arbeitsspeicher passend zum Einsatzzweck, ausreichend SSD-Speicher sowie bei Notebooks auf Akkulaufzeit und Displayqualität.",
        },
        {
          heading: "Beliebte Marken im Bereich Computer",
          body: "Apple, Dell, Lenovo, HP, Asus und Acer bieten Geräte für Büro, Kreativarbeit und Gaming gleichermaßen.",
        },
      ],
      closing: "Unsicher bei der passenden Konfiguration? Unser Serviceteam berät Sie gerne persönlich.",
    },
  ),
  buildCategory(
    "multimedia",
    "smartwatches",
    "Smartwatches",
    "Fitness-Tracking, Benachrichtigungen und lange Akkulaufzeit am Handgelenk.",
    "/images/products/smartwatch.jpg",
    [
      {
        brand: "Garmin",
        name: "Venu 3 Smartwatch",
        bullets: ["AMOLED-Display", "14 Tage Akkulaufzeit", "Schlaf- & Fitness-Tracking"],
        oldPrice: "449,00 €",
        price: "349,00 €",
        badge: "-22%",
        rating: 4.6,
        inStock: true,
      },
      {
        brand: "Apple",
        name: "Watch Series 10",
        bullets: ["Größtes Retina-Display", "Blutsauerstoffmessung", "Wassergeschützt"],
        oldPrice: "449,00 €",
        price: "399,00 €",
        badge: "-11%",
        rating: 4.7,
        inStock: true,
      },
      {
        brand: "Samsung",
        name: "Galaxy Watch 7",
        bullets: ["BioActive Sensor", "Wear OS", "Sturzerkennung"],
        price: "329,00 €",
        badge: "Neu",
        rating: 4.2,
        inStock: true,
      },
      {
        brand: "Fitbit",
        name: "Sense 2",
        bullets: ["Stresstracking", "6 Tage Akkulaufzeit", "Google-Integration"],
        oldPrice: "299,00 €",
        price: "229,00 €",
        badge: "-23%",
        rating: 4.3,
        inStock: true,
      },
      {
        brand: "Withings",
        name: "ScanWatch 2",
        bullets: ["Hybride Analoguhr", "EKG-Funktion", "30 Tage Akkulaufzeit"],
        price: "299,00 €",
        badge: "Premium",
        rating: 4.8,
        inStock: false,
      },
      {
        brand: "Amazfit",
        name: "GTR 4",
        bullets: ["AMOLED-Display", "Zepp OS", "14 Tage Akkulaufzeit"],
        oldPrice: "219,00 €",
        price: "169,00 €",
        badge: "-23%",
        rating: 4.1,
        inStock: true,
      },
    ],
    {
      intro:
        "Fitness-Tracking, Benachrichtigungen und smarte Funktionen direkt am Handgelenk, für einen aktiven und vernetzten Alltag.",
      sections: [
        {
          heading: "Smartwatch oder Fitness-Tracker?",
          body: "Smartwatches bieten App-Unterstützung, Benachrichtigungen und teils Mobilfunkanbindung, reine Fitness-Tracker punkten mit längerer Akkulaufzeit und kompakterem Design.",
        },
        {
          heading: "Worauf Sie beim Kauf achten sollten",
          body: "Wichtig sind Akkulaufzeit, Kompatibilität mit Ihrem Smartphone-Betriebssystem, Wasserdichtigkeit sowie Gesundheitsfunktionen wie Pulsmessung oder EKG.",
        },
        {
          heading: "Beliebte Marken im Bereich Smartwatches",
          body: "Garmin, Apple, Samsung, Fitbit, Withings und Amazfit bieten Modelle für Sportler ebenso wie für den Alltag.",
        },
      ],
      closing: "Fragen zur passenden Smartwatch für Ihr Betriebssystem? Unser Serviceteam berät Sie gerne.",
    },
  ),
];

export function getCategoryPage(group: string, slug: string): CategoryPageData | undefined {
  return categoryPages.find((category) => category.group === group && category.slug === slug);
}

export function getProduct(group: string, categorySlug: string, productSlug: string) {
  const category = getCategoryPage(group, categorySlug);
  const product = category?.products.find((item) => item.slug === productSlug);
  if (!category || !product) return undefined;
  return { category, product };
}

export function getRelatedProducts(category: CategoryPageData, excludeSlug: string, limit = 6): Product[] {
  return category.products.filter((product) => product.slug !== excludeSlug).slice(0, limit);
}
