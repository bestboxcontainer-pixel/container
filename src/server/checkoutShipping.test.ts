/**
 * Tests du mode de livraison dans le contrôle de la charge utile du tunnel.
 *
 * L'enjeu : le navigateur choisit un mode, il n'en fixe jamais le prix. On
 * vérifie donc qu'une clé inconnue est refusée plutôt que ramenée en silence au
 * standard — livrer en standard un client qui a demandé et cru payer l'express
 * modifierait sa commande — et qu'un champ absent reste toléré.
 *
 * `parseCheckoutPayload` ne touche pas la base : ces tests tournent sans
 * PostgreSQL.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCheckoutPayload } from "./checkoutInput";

const ADDRESS = {
  salutation: "frau",
  firstName: "Anna",
  lastName: "Beispiel",
  company: "",
  street: "Hauptstraße 12a",
  postalCode: "10115",
  city: "Berlin",
  country: "DE",
};

function payload(overrides: Record<string, unknown> = {}) {
  return {
    locale: "de",
    email: "anna.beispiel@example.de",
    phone: "+49 30 1234567",
    billing: ADDRESS,
    shippingSameAsBilling: true,
    paymentMethodKey: "vorkasse",
    termsAccepted: true,
    withdrawalAcknowledged: true,
    items: [{ productId: "prod_1", quantity: 1 }],
    ...overrides,
  };
}

describe("mode de livraison soumis par le tunnel", () => {
  it("accepte le standard et l'express", () => {
    for (const key of ["standard", "express"] as const) {
      const { input, errors } = parseCheckoutPayload(payload({ shippingMethodKey: key }));
      assert.deepEqual(errors, []);
      assert.equal(input?.shippingMethodKey, key);
    }
  });

  it("retient le standard quand le champ est absent", () => {
    // Un client venu d'une version antérieure du formulaire ne doit pas voir sa
    // commande refusée pour un champ qui n'existait pas.
    const { input, errors } = parseCheckoutPayload(payload());
    assert.deepEqual(errors, []);
    assert.equal(input?.shippingMethodKey, "standard");
  });

  it("tolère les espaces autour de la clé", () => {
    // Tous les champs du tunnel sont détrimés : « express » entouré d'espaces
    // reste « express », comme un e-mail ou un code postal.
    const { input, errors } = parseCheckoutPayload(payload({ shippingMethodKey: "  express " }));
    assert.deepEqual(errors, []);
    assert.equal(input?.shippingMethodKey, "express");
  });

  it("refuse une clé inconnue au lieu de la corriger", () => {
    // La casse compte : « EXPRESS » n'est pas une clé, et deviner l'intention du
    // client sur un champ tarifaire n'est pas au programme.
    for (const key of ["gratuit", "EXPRESS", "standard;express", "1"]) {
      const { input, errors } = parseCheckoutPayload(payload({ shippingMethodKey: key }));
      assert.ok(
        errors.includes("invalid_shipping_method"),
        `« ${key} » aurait dû être refusé`,
      );
      assert.equal(input, undefined);
    }
  });

  it("ignore un champ qui n'est pas une chaîne", () => {
    // `text()` rend "" pour tout ce qui n'est pas une chaîne : on retombe donc
    // sur le standard, sans erreur, comme pour un champ absent.
    for (const key of [null, 42, { key: "express" }, ["express"]]) {
      const { input, errors } = parseCheckoutPayload(payload({ shippingMethodKey: key }));
      assert.deepEqual(errors, []);
      assert.equal(input?.shippingMethodKey, "standard");
    }
  });

  it("ne laisse pas le client fixer lui-même les frais de port", () => {
    // Le tarif ne fait pas partie de la charge utile : même en l'envoyant, il
    // n'apparaît nulle part dans l'entrée validée.
    const { input, errors } = parseCheckoutPayload(
      payload({ shippingMethodKey: "express", shippingCents: 0, totalCents: 1 }),
    );
    assert.deepEqual(errors, []);
    assert.ok(input);
    assert.ok(!("shippingCents" in input!), "shippingCents ne doit pas traverser le contrôle");
    assert.ok(!("totalCents" in input!), "totalCents ne doit pas traverser le contrôle");
  });
});

describe("pays de livraison", () => {
  it("accepte une adresse étrangère avec son format postal", () => {
    // Le sélecteur du formulaire propose la liste complète des pays : le
    // serveur ne doit pas refuser ce que le client vient d'y choisir.
    const france = { ...ADDRESS, postalCode: "75008", city: "Paris", country: "FR" };
    const { input, errors } = parseCheckoutPayload(payload({ billing: france }));
    assert.deepEqual(errors, []);
    assert.equal(input?.billing.country, "FR");
  });

  it("accepte un code postal alphanumérique britannique", () => {
    const londres = { ...ADDRESS, postalCode: "SW1A 1AA", city: "London", country: "GB" };
    const { errors } = parseCheckoutPayload(payload({ billing: londres }));
    assert.deepEqual(errors, []);
  });

  it("refuse un code postal qui ne colle pas au pays", () => {
    const faux = { ...ADDRESS, postalCode: "123", country: "FR" };
    const { errors } = parseCheckoutPayload(payload({ billing: faux }));
    assert.deepEqual(errors, ["invalid_postal_code"]);
  });

  it("refuse un code pays inconnu", () => {
    const inconnu = { ...ADDRESS, country: "XX" };
    const { errors } = parseCheckoutPayload(payload({ billing: inconnu }));
    assert.deepEqual(errors, ["unsupported_country"]);
  });
});
