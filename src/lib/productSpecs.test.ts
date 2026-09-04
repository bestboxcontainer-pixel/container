import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitProductSpecs } from "./productSpecs";

describe("splitProductSpecs", () => {
  it("range une donnee chiffree en ligne de tableau", () => {
    const { specRows, features } = splitProductSpecs(["Außenmaß: 6.058 × 2.438 × 2.591 mm"]);
    assert.deepEqual(specRows, [{ label: "Außenmaß", value: "6.058 × 2.438 × 2.591 mm" }]);
    assert.deepEqual(features, []);
  });

  it("garde un argument redige en phrase dans les caracteristiques", () => {
    const { specRows, features } = splitProductSpecs([
      "Kompakt und leicht: Einfach zu transportieren und zu installieren.",
    ]);
    assert.deepEqual(specRows, []);
    assert.deepEqual(features, ["Kompakt und leicht: Einfach zu transportieren und zu installieren."]);
  });

  it("garde une puce sans deux-points dans les caracteristiques", () => {
    const { specRows, features } = splitProductSpecs(["Hochwertige Materialien"]);
    assert.deepEqual(specRows, []);
    assert.deepEqual(features, ["Hochwertige Materialien"]);
  });

  it("accepte une valeur factuelle sans chiffre (norme, materiau)", () => {
    const { specRows } = splitProductSpecs([
      "Standard : IICL (höhere Qualität und optimierte Lebensdauer)",
      "Material : Robuster Cortenstahl, entwickelt, um extremen Bedingungen standzuhalten",
    ]);
    assert.equal(specRows.length, 2);
    assert.equal(specRows[0].label, "Standard");
    assert.equal(specRows[1].label, "Material");
  });

  it("trie chaque puce dans une seule des deux familles, sans perte", () => {
    const bullets = [
      "Gewicht: 800 kg",
      "Robuste Stahlkonstruktion – langlebig & stabil",
      "Farbe Paneel: RAL7016 (anthrazit)",
      "Individuelle Ausstattung – nach Ihren Anforderungen",
    ];
    const { specRows, features } = splitProductSpecs(bullets);
    assert.equal(specRows.length + features.length, bullets.length);
    assert.deepEqual(
      specRows.map((r) => r.label),
      ["Gewicht", "Farbe Paneel"],
    );
  });

  it("garde un intitulé générique en argument même sans point final", () => {
    const { specRows, features } = splitProductSpecs([
      "Mobilität: Einfach zu transportieren und zu installieren",
      "Economy: Wirtschaftliche und flexible Lösung",
    ]);
    assert.deepEqual(specRows, []);
    assert.equal(features.length, 2);
  });

  it("respecte l'ordre d'origine dans chaque famille", () => {
    const { specRows } = splitProductSpecs(["Länge: 6,0 m", "Breite: 2,4 m", "Höhe: 2,6 m"]);
    assert.deepEqual(
      specRows.map((r) => r.label),
      ["Länge", "Breite", "Höhe"],
    );
  });
});
