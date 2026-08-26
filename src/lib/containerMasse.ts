/**
 * Normmaße der ISO-Container, an einer Stelle.
 *
 * Die Tabelle stand in der Seite `/container-masse`. Der Katalog braucht
 * dieselben Werte: bei Seecontainern beschreibt die Quelle das Modell oft nur
 * in Fließtext, ohne Datenblatt. Statt die Karte leer zu lassen, ergänzt
 * `scripts/collecter-containers.ts` die Normmaße des erkannten Typs. Zwei
 * Kopien derselben Zahlen wären früher oder später zwei verschiedene Zahlen.
 */
export interface ContainerTyp {
  id: string;
  name: string;
  kurz: string;
  /** Außenmaß in mm, Länge × Breite × Höhe. */
  aussen: string;
  innen: string;
  tuer: string;
  leer: string;
  nutzlast: string;
  volumen: string;
  einsatz: string;
}

/**
 * Normmaße nach ISO 668 (Baureihe 1). Es sind Nennwerte: Wandstärke,
 * Bodenaufbau und Fertigungstoleranz lassen die Innenmaße je nach Hersteller
 * um wenige Millimeter abweichen. Verbindlich sind immer die Werte im
 * konkreten Angebot, deshalb steht der Hinweis unter der Tabelle.
 */
export const CONTAINER_TYPEN: readonly ContainerTyp[] = [
  {
    id: "10-fuss",
    name: "10 Fuß",
    kurz: "Der Kompakte",
    aussen: "2.991 × 2.438 × 2.591",
    innen: "2.831 × 2.352 × 2.393",
    tuer: "2.336 × 2.280",
    leer: "ca. 1.300 kg",
    nutzlast: "ca. 8.700 kg",
    volumen: "ca. 16 m³",
    einsatz: "Kleine Grundstücke, Werkzeuglager, beengte Baustellen.",
  },
  {
    id: "20-fuss",
    name: "20 Fuß Standard",
    kurz: "Der Klassiker",
    aussen: "6.058 × 2.438 × 2.591",
    innen: "5.898 × 2.352 × 2.393",
    tuer: "2.336 × 2.280",
    leer: "ca. 2.250 kg",
    nutzlast: "ca. 28.230 kg",
    volumen: "ca. 33 m³",
    einsatz: "Der meistgefragte Typ: Lagerung, Transport, Umbau zum Büro.",
  },
  {
    id: "20-fuss-hc",
    name: "20 Fuß High Cube",
    kurz: "Der Kompakte mit Höhe",
    aussen: "6.058 × 2.438 × 2.896",
    innen: "5.898 × 2.352 × 2.698",
    tuer: "2.336 × 2.585",
    leer: "ca. 2.350 kg",
    nutzlast: "ca. 28.130 kg",
    volumen: "ca. 37 m³",
    einsatz: "Wie der 20-Fuß-Standard, wo zusätzlich Deckenhöhe zählt.",
  },
  {
    id: "40-fuss",
    name: "40 Fuß Standard",
    kurz: "Der Große",
    aussen: "12.192 × 2.438 × 2.591",
    innen: "12.032 × 2.352 × 2.393",
    tuer: "2.336 × 2.280",
    leer: "ca. 3.780 kg",
    nutzlast: "ca. 26.700 kg",
    volumen: "ca. 67 m³",
    einsatz: "Große Lagerflächen, Umzüge, mehrgeschossige Modulbauten.",
  },
  {
    id: "40-fuss-hc",
    name: "40 Fuß High Cube",
    kurz: "Der Hohe",
    aussen: "12.192 × 2.438 × 2.896",
    innen: "12.032 × 2.352 × 2.698",
    tuer: "2.336 × 2.585",
    leer: "ca. 3.940 kg",
    nutzlast: "ca. 26.520 kg",
    volumen: "ca. 76 m³",
    einsatz: "Sperrige Güter und alle Ausbauten, bei denen Deckenhöhe zählt.",
  },
  {
    id: "45-fuss-hc",
    name: "45 Fuß High Cube",
    kurz: "Der Längste",
    aussen: "13.716 × 2.438 × 2.896",
    innen: "13.556 × 2.352 × 2.698",
    tuer: "2.336 × 2.585",
    leer: "ca. 4.800 kg",
    nutzlast: "ca. 25.600 kg",
    volumen: "ca. 86 m³",
    einsatz: "Maximale Fläche am Stück, sofern die Zufahrt es hergibt.",
  },
] as const;


/**
 * Ordnet einer Bezeichnung ihren Normtyp zu.
 *
 * Gesucht wird zuerst die Länge in Fuß, dann die Bauhöhe: « High Cube » und
 * « HC » meinen dasselbe. Ohne beides bleibt es bei `undefined` — geraten wird
 * nicht, lieber keine Angabe als eine falsche.
 */
export function typDerBezeichnung(bezeichnung: string): ContainerTyp | undefined {
  const laenge = bezeichnung.match(/\b(10|20|40|45)\s*(?:Fuß|Fuss|ft|')/i)?.[1];
  if (!laenge) return undefined;

  const hochkubisch = /\bhigh\s*cube\b|\bHC\b/i.test(bezeichnung);
  const id = hochkubisch ? `${laenge}-fuss-hc` : `${laenge}-fuss`;

  return (
    CONTAINER_TYPEN.find((typ) => typ.id === id) ??
    // 45 Fuß gibt es nur als High Cube; 10 Fuß nur als Standard.
    CONTAINER_TYPEN.find((typ) => typ.id.startsWith(`${laenge}-fuss`))
  );
}

/** Die drei Angaben, die auf einer Produktkarte tatsächlich weiterhelfen. */
export function normMasseAlsMerkmale(typ: ContainerTyp): string[] {
  return [
    `Außenmaß: ${typ.aussen} mm`,
    `Innenvolumen: ${typ.volumen}`,
    `Nutzlast: ${typ.nutzlast}`,
  ];
}
