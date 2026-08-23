/**
 * Logos de marque : fichier et couleur officielle.
 *
 * Les SVG vivent dans `public/images/brands`. Ils sont monochromes et appliqués
 * en masque : la couleur ci-dessous les habille. Aucune des marques concernées
 * n'a de logotype multicolore, donc l'aplat officiel donne bien le logo réel.
 *
 * La clé est le nom **normalisé** : sans casse, sans espaces ni ponctuation.
 * Le catalogue mélange les graphies (« Samsung » et « SAMSUNG », « Siemens » et
 * « SIEMENS ») selon la source d'import ; comparer sur le nom brut laisserait
 * la moitié des marques sans logo.
 */

export interface BrandLogo {
  /** Chemin du SVG, servi par le site. */
  src: string;
  /** Couleur de la marque, appliquée au masque. */
  color: string;
}

/**
 * Les teintes viennent du jeu d'icônes officiel, à deux exceptions près.
 *
 * Sony et Apple y sont déclarés en blanc ou en noir selon la version prévue
 * pour fond sombre ; sur le fond clair de la boutique, c'est le noir qui
 * correspond au logo imprimé. Un blanc sur blanc ne montrerait rien du tout.
 *
 * AEG, Miele et Philips sont absents de ce jeu : leur tracé est composé ici
 * (voir public/images/brands) et la teinte suit leur charte connue, sans être
 * pour autant une référence officielle.
 */
const LOGOS: Record<string, BrandLogo> = {
  acer: { src: "acer", color: "#83B81A" },
  aeg: { src: "aeg", color: "#E2001A" },
  apple: { src: "apple", color: "#111111" },
  asus: { src: "asus", color: "#000000" },
  bosch: { src: "bosch", color: "#EA0016" },
  delonghi: { src: "delonghi", color: "#072240" },
  dji: { src: "dji", color: "#000000" },
  garmin: { src: "garmin", color: "#000000" },
  google: { src: "google", color: "#4285F4" },
  hp: { src: "hp", color: "#0096D6" },
  jbl: { src: "jbl", color: "#FF3300" },
  lenovo: { src: "lenovo", color: "#E2231A" },
  lg: { src: "lg", color: "#A50034" },
  microsoft: { src: "microsoft", color: "#5E5E5E" },
  miele: { src: "miele", color: "#8C1823" },
  motorola: { src: "motorola", color: "#E1140A" },
  nintendo: { src: "nintendo", color: "#E60012" },
  panasonic: { src: "panasonic", color: "#0049AB" },
  philips: { src: "philips", color: "#0065D3" },
  // Les gammes portent le nom du fabricant : « Philips Senseo » est un Philips.
  philipssenseo: { src: "philips", color: "#0065D3" },
  razer: { src: "razer", color: "#00A650" },
  samsung: { src: "samsung", color: "#1428A0" },
  siemens: { src: "siemens", color: "#009999" },
  // Déclaré en blanc dans la source, pour fond sombre : illisible ici.
  sony: { src: "sony", color: "#000000" },
  steelseries: { src: "steelseries", color: "#FF5200" },
  toshiba: { src: "toshiba", color: "#FF0000" },
  xiaomi: { src: "xiaomi", color: "#FF6900" },
};

/** « De'Longhi » et « DELONGHI » doivent tomber sur la même clé. */
function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .replace(/[àáâä]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Logo de la marque, ou `null` si elle n'en a pas. L'appelant retombe alors
 * sur le nom écrit : mieux vaut un nom lisible qu'un emplacement vide.
 */
export function brandLogo(nom: string): { src: string; color: string } | null {
  const logo = LOGOS[normaliser(nom)];
  return logo ? { src: `/images/brands/${logo.src}.svg`, color: logo.color } : null;
}
