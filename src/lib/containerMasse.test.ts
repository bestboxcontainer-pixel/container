import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTAINER_TYPEN, normMasseAlsMerkmale, typDerBezeichnung } from "./containerMasse";

describe("typDerBezeichnung", () => {
  it("distingue le High Cube du standard a longueur egale", () => {
    assert.equal(typDerBezeichnung("20 Fuß Standardcontainer")?.id, "20-fuss");
    assert.equal(typDerBezeichnung("20 Fuß High Cube Seecontainer")?.id, "20-fuss-hc");
    assert.equal(typDerBezeichnung("20 Fuß HC Container mit Doppeltüren")?.id, "20-fuss-hc");
  });

  it("reconnait les quatre longueurs normalisees", () => {
    assert.equal(typDerBezeichnung("10 Fuß Standardcontainer")?.id, "10-fuss");
    assert.equal(typDerBezeichnung("40 Fuß High Cube Container")?.id, "40-fuss-hc");
    assert.equal(typDerBezeichnung("45 Fuß Container")?.id, "45-fuss-hc");
  });

  it("ne devine rien pour ce que la norme ne couvre pas", () => {
    // Un bureau, un sanitaire ou un sur-mesure n'a pas de cote normalisee :
    // mieux vaut aucune caracteristique qu'une cote fausse.
    assert.equal(typDerBezeichnung("Bürocontainer 3,50 × 2,20 (Ref: 2351)"), undefined);
    assert.equal(typDerBezeichnung("Sanitärcontainer mit Dusche, WC und Urinal"), undefined);
    assert.equal(typDerBezeichnung("Modulares Haus Athen"), undefined);
  });

  it("se rabat sur la seule variante existante d'une longueur", () => {
    // 45 pieds n'existe qu'en High Cube, 10 pieds qu'en standard.
    assert.equal(typDerBezeichnung("45 Fuß High Cube")?.id, "45-fuss-hc");
    assert.equal(typDerBezeichnung("10 Fuß HC Seecontainer")?.id, "10-fuss");
  });
});

describe("normMasseAlsMerkmale", () => {
  it("rend trois lignes lisibles, cote exterieure en tete", () => {
    const vingtPieds = CONTAINER_TYPEN.find((typ) => typ.id === "20-fuss");
    assert.ok(vingtPieds);
    const merkmale = normMasseAlsMerkmale(vingtPieds);
    assert.equal(merkmale.length, 3);
    assert.equal(merkmale[0], "Außenmaß: 6.058 × 2.438 × 2.591 mm");
    assert.match(merkmale[1], /^Innenvolumen: /);
    assert.match(merkmale[2], /^Nutzlast: /);
  });
});

describe("CONTAINER_TYPEN", () => {
  it("n'expose jamais deux fois le meme identifiant", () => {
    assert.equal(new Set(CONTAINER_TYPEN.map((typ) => typ.id)).size, CONTAINER_TYPEN.length);
  });

  it("donne au High Cube la hauteur qui le definit", () => {
    for (const typ of CONTAINER_TYPEN.filter((t) => t.id.endsWith("-hc"))) {
      assert.match(typ.aussen, /2\.896$/, typ.id);
    }
    for (const typ of CONTAINER_TYPEN.filter((t) => !t.id.endsWith("-hc"))) {
      assert.match(typ.aussen, /2\.591$/, typ.id);
    }
  });
});
