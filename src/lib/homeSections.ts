export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeSizeOption {
  label: string;
  imageSrc: string;
  imageAlt: string;
  imageWidthPercent: number;
  featured?: boolean;
}

export interface HomeSizeGroup {
  id: "laengen" | "breiten" | "hoehen";
  title: string;
  subtitle: string;
  options: readonly HomeSizeOption[];
}

const SIZE_IMAGES = {
  "3m": "/images/sizes/3m.png",
  "4m": "/images/sizes/4m.png",
  "5m": "/images/sizes/5m.png",
  "6m": "/images/sizes/6m.png",
  "7m": "/images/sizes/7m.png",
  "8m": "/images/sizes/8m.png",
  "9m": "/images/sizes/9m.png",
  "10m": "/images/sizes/10m.png",
  "11m": "/images/sizes/11m.png",
  "12m": "/images/sizes/12m.png",
} as const;

/**
 * Convertit le libellé d'une option ("3m", "2,60m") en cote millimétrique
 * formatée à l'allemande ("3.000 mm"). Rien n'est inventé : la valeur est
 * dérivée du libellé, elle sert de seconde lecture technique dans les cartes.
 */
export function formatSizeDetail(label: string): string {
  const metres = Number.parseFloat(label.replace(",", ".").replace(/[^\d.]/g, ""));

  if (!Number.isFinite(metres)) {
    return "";
  }

  const millimetres = Math.round(metres * 1000);

  return `${String(millimetres).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} mm`;
}

export const HOME_SIZE_GROUPS: readonly HomeSizeGroup[] = [
  {
    id: "laengen",
    title: "Längen",
    subtitle: "3,00 m bis 12,00 m",
    options: [
      { label: "3m", imageSrc: SIZE_IMAGES["3m"], imageAlt: "Container in 3 Meter Länge", imageWidthPercent: 100 },
      { label: "4m", imageSrc: SIZE_IMAGES["4m"], imageAlt: "Container in 4 Meter Länge", imageWidthPercent: 100 },
      { label: "5m", imageSrc: SIZE_IMAGES["5m"], imageAlt: "Container in 5 Meter Länge", imageWidthPercent: 100 },
      { label: "6m", imageSrc: SIZE_IMAGES["6m"], imageAlt: "Container in 6 Meter Länge", imageWidthPercent: 100 },
      { label: "7m", imageSrc: SIZE_IMAGES["7m"], imageAlt: "Container in 7 Meter Länge", imageWidthPercent: 100 },
      { label: "8m", imageSrc: SIZE_IMAGES["8m"], imageAlt: "Container in 8 Meter Länge", imageWidthPercent: 100 },
      { label: "9m", imageSrc: SIZE_IMAGES["9m"], imageAlt: "Container in 9 Meter Länge", imageWidthPercent: 100 },
      { label: "10m", imageSrc: SIZE_IMAGES["10m"], imageAlt: "Container in 10 Meter Länge", imageWidthPercent: 100 },
      { label: "11m", imageSrc: SIZE_IMAGES["11m"], imageAlt: "Container in 11 Meter Länge", imageWidthPercent: 100, featured: true },
      { label: "12m", imageSrc: SIZE_IMAGES["12m"], imageAlt: "Container in 12 Meter Länge", imageWidthPercent: 100 },
    ],
  },
  {
    id: "breiten",
    title: "Breiten",
    subtitle: "2,4 m oder 3,0 m",
    options: [
      { label: "2,4m", imageSrc: SIZE_IMAGES["8m"], imageAlt: "Container in 2,4 Meter Breite", imageWidthPercent: 88 },
      { label: "3,0m", imageSrc: SIZE_IMAGES["12m"], imageAlt: "Container in 3,0 Meter Breite", imageWidthPercent: 100 },
    ],
  },
  {
    id: "hoehen",
    title: "Höhen",
    subtitle: "2,60 m bis 3,00 m",
    options: [
      { label: "2,60m", imageSrc: SIZE_IMAGES["7m"], imageAlt: "Container in 2,60 Meter Höhe", imageWidthPercent: 88 },
      { label: "2,80m", imageSrc: SIZE_IMAGES["9m"], imageAlt: "Container in 2,80 Meter Höhe", imageWidthPercent: 94 },
      { label: "3,00m", imageSrc: SIZE_IMAGES["11m"], imageAlt: "Container in 3,00 Meter Höhe", imageWidthPercent: 100 },
    ],
  },
] as const;

export const HOME_FAQS: readonly HomeFaqItem[] = [
  {
    question: "Welche Containerarten bietet BBC Best Box an?",
    answer:
      "Wir führen Seecontainer, Lagercontainer, Bürocontainer, Sanitärcontainer und Sondercontainer. Je nach Projekt liefern wir Standardgrößen ab Lager oder planen individuelle Umbauten nach Einsatz, Fläche und Zugänglichkeit.",
  },
  {
    question: "Kann ich die Container kaufen oder auch mieten?",
    answer:
      "Beides ist möglich. Für kurzfristige Einsätze oder wechselnde Standorte ist die Miete oft sinnvoll, während sich beim dauerhaften Einsatz auf dem eigenen Gelände der Kauf meist schneller rechnet.",
  },
  {
    question: "Welche Größen sind verfügbar?",
    answer:
      "Viele Modelle sind in mehreren Längen, Breiten und Höhen verfügbar. Dadurch lassen sich einzelne Module genauso planen wie kombinierte Anlagen für Büro, Lager, Sanitär oder Sondernutzung.",
  },
  {
    question: "Liefert BBC Best Box auch bundesweit?",
    answer:
      "Ja. Wir organisieren Lieferung und Aufstellung deutschlandweit. Vorab klären wir mit Ihnen Zufahrt, Stellfläche, Untergrund und ob für die Entladung ein Kran oder ein anderes Hebemittel nötig ist.",
  },
  {
    question: "Sind auch Sonderanfertigungen möglich?",
    answer:
      "Ja. Wenn Standardcontainer nicht ausreichen, planen wir Sondercontainer passend zu Ihrem Vorhaben, zum Beispiel als Verkaufsmodul, Technikraum, Werkstatt oder projektspezifischen Ausbau.",
  },
] as const;
