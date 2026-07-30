/**
 * Correspondance entre le nom de marque du catalogue et son logo.
 *
 * Les fichiers vivent dans `public/images/brands`. Ce sont des SVG monochromes
 * qui héritent de `currentColor` : la rangée de marques reste homogène quelle
 * que soit l'identité colorielle de chacune, et le survol peut la faire passer
 * du gris au noir sans toucher aux fichiers.
 *
 * La clé est le nom **normalisé** — sans casse, sans espaces ni ponctuation.
 * Le catalogue mélange les graphies (« Samsung » et « SAMSUNG », « BOSCH » et
 * « Bosch ») selon la source d'import ; comparer sur le nom brut laisserait
 * la moitié des marques sans logo.
 */

/** Nom de marque → nom de fichier, sans l'extension. */
const LOGOS: Record<string, string> = {
  acer: "acer",
  aeg: "aeg",
  apple: "apple",
  asus: "asus",
  bosch: "bosch",
  delonghi: "delonghi",
  dji: "dji",
  garmin: "garmin",
  google: "google",
  hp: "hp",
  jbl: "jbl",
  lenovo: "lenovo",
  lg: "lg",
  microsoft: "microsoft",
  miele: "miele",
  motorola: "motorola",
  nintendo: "nintendo",
  panasonic: "panasonic",
  philips: "philips",
  // Les gammes portent le nom du fabricant : « Philips Senseo » est un Philips.
  philipssenseo: "philips",
  razer: "razer",
  samsung: "samsung",
  siemens: "siemens",
  sony: "sony",
  steelseries: "steelseries",
  toshiba: "toshiba",
  xiaomi: "xiaomi",
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
 * Chemin du logo, ou `null` si la marque n'en a pas. L'appelant retombe alors
 * sur le nom écrit — mieux vaut un nom lisible qu'un emplacement vide.
 */
export function brandLogo(nom: string): string | null {
  const fichier = LOGOS[normaliser(nom)];
  return fichier ? `/images/brands/${fichier}.svg` : null;
}
