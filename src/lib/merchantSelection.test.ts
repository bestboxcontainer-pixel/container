/**
 * Tests du choix des produits transmis au flux Google Merchant.
 *
 * L'enjeu : ce filtre décide de ce que Google voit du catalogue. Trop large, il
 * diffuse ce que le commerçant voulait retirer ; trop étroit, il retire la
 * boutique des résultats sans que personne ne s'en aperçoive avant la chute des
 * visites. Les deux erreurs se paient, la seconde plus cher.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MERCHANT_SELECTION_DEFAULT,
  filterForFeed,
  isInFeed,
  parseMerchantSelection,
  parseMerchantSelectionInput,
} from "./merchantSelection";

const PRODUITS = [
  { id: "p1", categoryId: "waschmaschinen" },
  { id: "p2", categoryId: "waschmaschinen" },
  { id: "p3", categoryId: "fernseher" },
  { id: "p4", categoryId: "kuehlgeraete" },
];

const CONNUS = {
  categoryIds: ["waschmaschinen", "fernseher", "kuehlgeraete"],
  productIds: ["p1", "p2", "p3", "p4"],
};

describe("Filtre du flux Merchant", () => {
  it("transmet tout le catalogue tant que rien n'est restreint", () => {
    assert.deepEqual(filterForFeed(PRODUITS, MERCHANT_SELECTION_DEFAULT), PRODUITS);
  });

  it("ne garde que les catégories retenues", () => {
    const retenus = filterForFeed(PRODUITS, {
      restricted: true,
      categoryIds: ["waschmaschinen"],
      excludedProductIds: [],
    });
    assert.deepEqual(
      retenus.map((p) => p.id),
      ["p1", "p2"],
    );
  });

  it("écarte un produit précis à l'intérieur d'une catégorie retenue", () => {
    const retenus = filterForFeed(PRODUITS, {
      restricted: true,
      categoryIds: ["waschmaschinen", "fernseher"],
      excludedProductIds: ["p2"],
    });
    assert.deepEqual(
      retenus.map((p) => p.id),
      ["p1", "p3"],
    );
  });

  it("inclut d'office un produit ajouté plus tard dans une catégorie retenue", () => {
    // C'est la promesse faite au commerçant : cocher une catégorie vaut pour
    // ses articles futurs, sans avoir à repasser par cet écran.
    const selection = {
      restricted: true,
      categoryIds: ["fernseher"],
      excludedProductIds: [],
    };
    const nouveau = { id: "p99", categoryId: "fernseher" };
    assert.equal(isInFeed(nouveau, selection), true);
  });

  it("laisse dehors un produit d'une catégorie non retenue, même non exclu", () => {
    const selection = {
      restricted: true,
      categoryIds: ["fernseher"],
      excludedProductIds: [],
    };
    assert.equal(isInFeed({ id: "p1", categoryId: "waschmaschinen" }, selection), false);
  });
});

describe("Relecture du réglage enregistré", () => {
  it("retombe sur le catalogue entier devant une valeur illisible", () => {
    for (const valeur of [null, undefined, "", 42, [], "{}"]) {
      assert.equal(parseMerchantSelection(valeur).restricted, false);
    }
  });

  it("refuse de restreindre à zéro catégorie", () => {
    // Une restriction sans aucune catégorie viderait le flux : la boutique
    // disparaîtrait de Google. On préfère tout transmettre.
    const relu = parseMerchantSelection({ restricted: true, categoryIds: [] });
    assert.equal(relu.restricted, false);
  });

  it("dédoublonne et ignore les entrées qui ne sont pas des textes", () => {
    const relu = parseMerchantSelection({
      restricted: true,
      categoryIds: ["a", "a", "", 7, null, "b"],
      excludedProductIds: ["x", "x"],
    });
    assert.deepEqual(relu.categoryIds, ["a", "b"]);
    assert.deepEqual(relu.excludedProductIds, ["x"]);
  });
});

describe("Contrôle de la saisie du back-office", () => {
  it("accepte une sélection normale", () => {
    const resultat = parseMerchantSelectionInput(
      { restricted: true, categoryIds: ["waschmaschinen"], excludedProductIds: ["p2"] },
      CONNUS,
    );
    assert.equal(resultat.ok, true);
    if (resultat.ok) {
      assert.deepEqual(resultat.value.categoryIds, ["waschmaschinen"]);
      assert.deepEqual(resultat.value.excludedProductIds, ["p2"]);
    }
  });

  it("écarte les identifiants inconnus sans faire échouer l'enregistrement", () => {
    // Cas réel : une catégorie supprimée entre l'affichage de l'écran et le clic.
    const resultat = parseMerchantSelectionInput(
      {
        restricted: true,
        categoryIds: ["waschmaschinen", "categorie-supprimee"],
        excludedProductIds: ["p1", "produit-supprime"],
      },
      CONNUS,
    );
    assert.equal(resultat.ok, true);
    if (resultat.ok) {
      assert.deepEqual(resultat.value.categoryIds, ["waschmaschinen"]);
      assert.deepEqual(resultat.value.excludedProductIds, ["p1"]);
    }
  });

  it("refuse explicitement une restriction sans aucune catégorie", () => {
    const resultat = parseMerchantSelectionInput(
      { restricted: true, categoryIds: [], excludedProductIds: [] },
      CONNUS,
    );
    assert.equal(resultat.ok, false);
    if (!resultat.ok) assert.match(resultat.error, /vide|au moins une/i);
  });

  it("accepte de ne pas restreindre du tout", () => {
    const resultat = parseMerchantSelectionInput({ restricted: false }, CONNUS);
    assert.equal(resultat.ok, true);
    if (resultat.ok) assert.equal(resultat.value.restricted, false);
  });
});
