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

const PRODUITS = [{ id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" }];

const CONNUS = { productIds: ["p1", "p2", "p3", "p4"] };

describe("Filtre du flux Merchant", () => {
  it("transmet tout le catalogue tant que rien n'est restreint", () => {
    assert.deepEqual(filterForFeed(PRODUITS, MERCHANT_SELECTION_DEFAULT), PRODUITS);
  });

  it("ne garde que les produits retenus", () => {
    const retenus = filterForFeed(PRODUITS, {
      restricted: true,
      includedProductIds: ["p1", "p3"],
    });
    assert.deepEqual(
      retenus.map((p) => p.id),
      ["p1", "p3"],
    );
  });

  it("laisse dehors un produit non retenu", () => {
    const selection = { restricted: true, includedProductIds: ["p3"] };
    assert.equal(isInFeed({ id: "p1" }, selection), false);
    assert.equal(isInFeed({ id: "p3" }, selection), true);
  });

  it("inclut tout produit tant que rien n'est restreint, y compris un ajouté plus tard", () => {
    const nouveau = { id: "p99" };
    assert.equal(isInFeed(nouveau, MERCHANT_SELECTION_DEFAULT), true);
  });
});

describe("Relecture du réglage enregistré", () => {
  it("retombe sur le catalogue entier devant une valeur illisible", () => {
    for (const valeur of [null, undefined, "", 42, [], "{}"]) {
      assert.equal(parseMerchantSelection(valeur).restricted, false);
    }
  });

  it("refuse de restreindre à zéro produit", () => {
    // Une restriction sans aucun produit viderait le flux : la boutique
    // disparaîtrait de Google. On préfère tout transmettre.
    const relu = parseMerchantSelection({ restricted: true, includedProductIds: [] });
    assert.equal(relu.restricted, false);
  });

  it("dédoublonne et ignore les entrées qui ne sont pas des textes", () => {
    const relu = parseMerchantSelection({
      restricted: true,
      includedProductIds: ["a", "a", "", 7, null, "b"],
    });
    assert.deepEqual(relu.includedProductIds, ["a", "b"]);
  });
});

describe("Contrôle de la saisie du back-office", () => {
  it("accepte une sélection normale", () => {
    const resultat = parseMerchantSelectionInput(
      { restricted: true, includedProductIds: ["p1", "p2"] },
      CONNUS,
    );
    assert.equal(resultat.ok, true);
    if (resultat.ok) {
      assert.deepEqual(resultat.value.includedProductIds, ["p1", "p2"]);
      assert.equal(resultat.value.restricted, true);
    }
  });

  it("écarte les identifiants inconnus sans faire échouer l'enregistrement", () => {
    // Cas réel : un produit supprimé entre l'affichage de l'écran et le clic.
    const resultat = parseMerchantSelectionInput(
      { restricted: true, includedProductIds: ["p1", "produit-supprime"] },
      CONNUS,
    );
    assert.equal(resultat.ok, true);
    if (resultat.ok) {
      assert.deepEqual(resultat.value.includedProductIds, ["p1"]);
    }
  });

  it("refuse explicitement une restriction sans aucun produit", () => {
    const resultat = parseMerchantSelectionInput({ restricted: true, includedProductIds: [] }, CONNUS);
    assert.equal(resultat.ok, false);
    if (!resultat.ok) assert.match(resultat.error, /vide|au moins un/i);
  });

  it("accepte de ne pas restreindre du tout", () => {
    const resultat = parseMerchantSelectionInput({ restricted: false }, CONNUS);
    assert.equal(resultat.ok, true);
    if (resultat.ok) assert.equal(resultat.value.restricted, false);
  });
});
