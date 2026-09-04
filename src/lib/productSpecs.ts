/**
 * Sépare les caractéristiques d'un produit en deux familles.
 *
 * Les fiches ne suivent pas toutes le même gabarit : certaines listent des
 * faits chiffrés (« Außenmaß: 6.058 × 2.438 × 2.591 mm »), d'autres des
 * arguments rédigés en phrase (« Kompakt und leicht: Einfach zu
 * transportieren und zu installieren. »). Les deux utilisent parfois le même
 * deux-points, alors le critère n'est pas sa présence mais la forme de ce qui
 * suit : une valeur factuelle est une donnée courte sans ponctuation de fin de
 * phrase, un argument est rédigé et se termine par un point.
 */
export interface SpecRow {
  label: string;
  value: string;
}

const LIGNE_FACTUELLE = /^([^:]{2,50}):\s*(.+)$/;

/**
 * Quelques fiches rédigent un argument sous forme d'intitulé générique suivi
 * d'un slogan, sans point final (« Economy: Wirtschaftliche und flexible
 * Lösung »). Ce sont les mêmes intitulés que d'autres fiches ponctuent
 * correctement (« Mobilität: ... Lebensdauer. ») : l'absence de point est une
 * inconsistance de saisie de la source, pas un signe que la ligne devient
 * factuelle. Ces intitulés-là restent donc toujours un argument, jamais une
 * donnée technique.
 */
const ETIQUETTES_ARGUMENT = new Set([
  "mobilität",
  "geschwindigkeit",
  "haltbarkeit",
  "economy",
  "isolierung",
]);

/** Une phrase rédigée finit par un point, un point d'exclamation ou d'interrogation. */
function estFactuelle(label: string, valeur: string): boolean {
  if (ETIQUETTES_ARGUMENT.has(label.trim().toLowerCase())) return false;
  return valeur.length > 0 && !/[.!?]$/.test(valeur);
}

export function splitProductSpecs(bullets: readonly string[]): {
  specRows: SpecRow[];
  features: string[];
} {
  const specRows: SpecRow[] = [];
  const features: string[] = [];

  for (const bullet of bullets) {
    const match = bullet.match(LIGNE_FACTUELLE);
    if (match) {
      const label = match[1].trim();
      const value = match[2].trim();
      if (estFactuelle(label, value)) {
        specRows.push({ label, value });
        continue;
      }
    }
    features.push(bullet);
  }

  return { specRows, features };
}
