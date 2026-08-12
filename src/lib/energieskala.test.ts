/**
 * Tests des échelles d'efficacité énergétique.
 *
 * L'enjeu : la lettre affichée près du prix engage le vendeur. Annoncer « A »
 * sans dire sur quelle échelle, ou reprendre un « A+ » d'avant le
 * rééchelonnage de 2021 sur un lave-linge, revient à surestimer l'appareil aux
 * yeux de l'acheteur. Le filtre doit donc préférer le silence au doute.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classeCoherente, echelleEnergie } from "./energieskala";

describe("echelleEnergie", () => {
  it("donne l'échelle A–G aux familles rééchelonnées en 2021", () => {
    for (const slug of ["waschmaschinen", "geschirrspueler", "fernseher", "smartphones"]) {
      assert.deepEqual(echelleEnergie(slug), { meilleure: "A", pire: "G" }, slug);
    }
  });

  it("garde l'échelle A+++–D pour les fours et les climatiseurs", () => {
    for (const slug of ["backoefen-herde", "klimageraete"]) {
      assert.deepEqual(echelleEnergie(slug), { meilleure: "A+++", pire: "D" }, slug);
    }
  });

  it("ne donne rien pour une famille sans étiquetage obligatoire", () => {
    // Les aspirateurs ont perdu leur étiquette avec l'annulation du règlement
    // 665/2013 ; cafetières, robots et montres n'en ont jamais eu.
    for (const slug of ["staubsauger", "kaffeemaschinen", "kuechenmaschinen", "smartwatches"]) {
      assert.equal(echelleEnergie(slug), undefined, slug);
    }
  });

  it("ne donne rien pour une catégorie inconnue", () => {
    assert.equal(echelleEnergie("categorie-qui-nexiste-pas"), undefined);
  });
});

describe("classeCoherente", () => {
  const aG = { meilleure: "A", pire: "G" } as const;
  const historique = { meilleure: "A+++", pire: "D" } as const;

  it("accepte une lettre simple sur l'échelle A–G", () => {
    for (const classe of ["A", "B", "C", "D", "E", "F", "G"]) {
      assert.equal(classeCoherente(classe, aG), true, classe);
    }
  });

  it("refuse une classe à plus sur une famille rééchelonnée", () => {
    // C'est le cas qui compte : une donnée catalogue jamais reprise depuis 2021.
    for (const classe of ["A+", "A++", "A+++"]) {
      assert.equal(classeCoherente(classe, aG), false, classe);
    }
  });

  it("accepte les classes à plus sur l'échelle historique", () => {
    for (const classe of ["A+++", "A++", "A+", "A", "B", "C", "D"]) {
      assert.equal(classeCoherente(classe, historique), true, classe);
    }
  });

  it("refuse les classes sous D sur l'échelle historique", () => {
    // L'échelle des fours et des climatiseurs s'arrête à D : un « F » n'y a pas
    // de sens, et le trouver signale une donnée saisie sur la mauvaise échelle.
    for (const classe of ["E", "F", "G"]) {
      assert.equal(classeCoherente(classe, historique), false, classe);
    }
  });

  it("refuse ce qui n'est pas une classe", () => {
    for (const valeur of ["", "  ", "H", "AA", "A++++", "classe A", "1"]) {
      assert.equal(classeCoherente(valeur, aG), false, JSON.stringify(valeur));
    }
  });

  it("tolère la casse et les espaces d'une saisie manuelle", () => {
    assert.equal(classeCoherente(" a ", aG), true);
    assert.equal(classeCoherente("a++", historique), true);
  });
});
