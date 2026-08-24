export interface HomeCategoryCard {
  id: "seecontainer" | "lagercontainer" | "buerocontainer" | "sanitaercontainer" | "sondercontainer";
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
}

export const HOME_CATEGORY_CARDS: readonly HomeCategoryCard[] = [
  {
    id: "seecontainer",
    title: "Seecontainer",
    text: "Robuste ISO-Container für Transport und Lagerung, neu und geprüft gebraucht.",
    imageSrc: "/images/kategorien/seecontainer-villex.png",
    imageAlt: "Blauer Seecontainer mit Doppelflügeltür auf einem Betriebsgelände",
  },
  {
    id: "lagercontainer",
    title: "Lagercontainer",
    text: "Wetterfeste Container zur sicheren Lagerung von Material, Werkzeug und Waren.",
    imageSrc: "/images/kategorien/lagercontainer-villex.png",
    imageAlt: "Grauer Lagercontainer mit seitlicher Tür vor einem hellen Hintergrund",
  },
  {
    id: "buerocontainer",
    title: "Bürocontainer",
    text: "Einzel- und Mehrfachanlagen als mobiles Büro auf der Baustelle oder im Betrieb.",
    imageSrc: "/images/kategorien/buerocontainer-villex.png",
    imageAlt: "Moderner Bürocontainer mit großen Fenstern und dunklem Rahmen",
  },
  {
    id: "sanitaercontainer",
    title: "Sanitärcontainer",
    text: "WC-, Dusch- und Waschcontainer für Baustellen, Events und Betriebsgelände.",
    imageSrc: "/images/kategorien/sanitaercontainer-villex.png",
    imageAlt: "Sanitärcontainer mit dunklem Außenrahmen und heller Fassadenverkleidung",
  },
  {
    id: "sondercontainer",
    title: "Sondercontainer",
    text: "Individuelle Umbauten und Sonderanfertigungen nach Ihren Maßen und Anforderungen.",
    imageSrc: "/images/kategorien/sondercontainer-villex.png",
    imageAlt: "Ausgebauter Verkaufscontainer als Beispiel für einen Sondercontainer",
  },
] as const;
