import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compterParTaille,
  correspondALaTaille,
  longueurDuProduit,
  longueurEnMetres,
  metresDepuisSlug,
  produitsDeLaTaille,
  slugDeTaille,
  TOLERANCE_METRES,
} from "./containerSize";
import type { Product } from "@/types/home";

function fiche(name: string, bullets: string[] = []): Product {
  return {
    brand: "Container",
    name,
    bullets,
    image: "/images/container/exemple.jpg",
    alt: name,
    price: "1.000,00 €",
    href: "/container",
  };
}

describe("longueurEnMetres", () => {
  it("lit la cote ecrite en metres", () => {
    assert.equal(longueurEnMetres("Bürocontainer 6,00 x 2,44 Tür Stirnseitig"), 6);
    assert.equal(longueurEnMetres("Sanitärcontainer 2,00 x 2,00 m"), 2);
    assert.equal(longueurEnMetres("Imbisscontainer 18,60 x 6,50 m"), 18.6);
  });

  it("accepte le point et le signe multiplie typographique", () => {
    assert.equal(longueurEnMetres("Lagercontainer 8.00 × 2.00 Meter"), 8);
  });

  it("convertit les pieds en metres", () => {
    // 20 pieds = 6,096 m, arrondi au centimetre.
    assert.equal(longueurEnMetres("20 Fuß Standardcontainer"), 6.1);
    assert.equal(longueurEnMetres("40-Fuß Seecontainer"), 12.19);
    assert.equal(longueurEnMetres("10 Fuß HC Seecontainer"), 3.05);
  });

  it("prefere la cote en metres quand les deux figurent", () => {
    // « 20 Fuß Lagercontainer 6,00 x 2,44 m » : la cote est plus precise.
    assert.equal(longueurEnMetres("20 Fuß Lagercontainer / Seecontainer 6,00 x 2,44 m"), 6);
  });

  it("renvoie null faute de cote", () => {
    assert.equal(longueurEnMetres("NEUER TOP SABA Baucontainer"), null);
    assert.equal(longueurEnMetres(""), null);
  });
});

describe("longueurDuProduit", () => {
  it("se rabat sur les caracteristiques quand le nom est muet", () => {
    assert.equal(longueurDuProduit(fiche("Premium-Modulcontainer", ["3,50 × 2,20 m"])), 3.5);
  });

  it("renvoie null quand rien ne porte de cote", () => {
    assert.equal(longueurDuProduit(fiche("MODULARES HAUS ATHEN", ["18 m² Wohnfläche"])), null);
  });
});

describe("metresDepuisSlug / slugDeTaille", () => {
  it("fait l'aller-retour entre identifiant et mesure", () => {
    assert.equal(metresDepuisSlug("6m"), 6);
    assert.equal(metresDepuisSlug("12m"), 12);
    assert.equal(slugDeTaille(6), "6m");
  });

  it("rejette un identifiant hors format", () => {
    for (const invalide of ["6", "6 m", "abc", "2,4m", ""]) {
      assert.equal(metresDepuisSlug(invalide), null, invalide);
    }
  });
});

describe("correspondALaTaille", () => {
  it("range un 20 pieds avec les 6 metres", () => {
    // 6,10 m contre 6 m : 10 cm d'ecart, sous la tolerance.
    assert.equal(correspondALaTaille(fiche("20 Fuß Standardcontainer"), 6), true);
  });

  it("range un 10 pieds avec les 3 metres", () => {
    assert.equal(correspondALaTaille(fiche("10 Fuß HC Seecontainer"), 3), true);
  });

  it("ne confond pas deux tailles voisines", () => {
    assert.equal(correspondALaTaille(fiche("Bürocontainer 3,50 x 2,20 m"), 3), false);
    assert.equal(correspondALaTaille(fiche("Bürocontainer 3,50 x 2,20 m"), 4), false);
  });

  it("garde la tolerance sous le demi-metre", () => {
    // Au-dela, un 3,50 m tomberait a la fois dans 3 m et dans 4 m.
    assert.equal(TOLERANCE_METRES < 0.5, true);
  });

  it("ecarte une fiche sans cote", () => {
    assert.equal(correspondALaTaille(fiche("NEUER TOP SABA Baucontainer"), 6), false);
  });
});

describe("produitsDeLaTaille", () => {
  it("ne retient que les fiches de la taille demandee", () => {
    const catalogue = [
      fiche("20 Fuß Standardcontainer"),
      fiche("Bürocontainer 6,00 x 2,44"),
      fiche("Bürocontainer 3,00 x 2,00 m"),
      fiche("NEUER TOP SABA Baucontainer"),
    ];

    assert.deepEqual(
      produitsDeLaTaille(catalogue, 6).map((p) => p.name),
      ["20 Fuß Standardcontainer", "Bürocontainer 6,00 x 2,44"],
    );
  });
});

describe("compterParTaille", () => {
  it("compte par identifiant, zero compris", () => {
    const catalogue = [
      fiche("20 Fuß Standardcontainer"),
      fiche("Bürocontainer 6,00 x 2,44"),
      fiche("Bürocontainer 12,00 x 6,00 m"),
    ];

    const comptes = compterParTaille(catalogue, ["6m", "7m", "12m"]);

    assert.equal(comptes.get("6m"), 2);
    // Une taille sans stock doit ressortir a zero, pas manquer.
    assert.equal(comptes.get("7m"), 0);
    assert.equal(comptes.get("12m"), 1);
  });
});
