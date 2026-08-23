/**
 * Tests des prix annoncés dans le flux Google Merchant.
 *
 * L'enjeu : `sale_price` déclare une promotion, pas un bon prix. L'attribuer à
 * un ancien prix saisi à la main revient à annoncer une remise sans terme
 * l'un des motifs qui font basculer un compte en contrôle manuel. À l'inverse,
 * taire la remise d'une campagne réelle prive la boutique de l'affichage promo
 * auquel elle a droit. Les deux erreurs se paient.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prixDuFlux } from "./merchantPrice";

describe("ancien prix saisi à la main", () => {
  it("n'annonce aucune remise : seul le prix pratiqué part", () => {
    const prix = prixDuFlux({
      prixCourantCents: 6378,
      prixReferenceCents: 12999,
      campagneDatee: false,
    });

    assert.equal(prix.priceCents, 6378);
    assert.equal(prix.salePriceCents, undefined);
    assert.equal(prix.remiseDeclaree, false);
  });

  it("se comporte pareil quand aucun prix barré n'existe", () => {
    // Hors campagne, la référence retombe sur le prix courant lui-même.
    const prix = prixDuFlux({
      prixCourantCents: 6378,
      prixReferenceCents: 6378,
      campagneDatee: false,
    });

    assert.equal(prix.priceCents, 6378);
    assert.equal(prix.salePriceCents, undefined);
  });
});

describe("campagne datée", () => {
  it("annonce la remise : référence en price, prix payé en sale_price", () => {
    const prix = prixDuFlux({
      prixCourantCents: 10399,
      prixReferenceCents: 12999,
      campagneDatee: true,
    });

    assert.equal(prix.priceCents, 12999);
    assert.equal(prix.salePriceCents, 10399);
    assert.equal(prix.remiseDeclaree, true);
  });

  it("n'annonce rien quand la campagne ne baisse pas le prix", () => {
    // Cas d'une campagne « livraison offerte » : elle ne touche pas au montant.
    const prix = prixDuFlux({
      prixCourantCents: 12999,
      prixReferenceCents: 12999,
      campagneDatee: true,
    });

    assert.equal(prix.priceCents, 12999);
    assert.equal(prix.salePriceCents, undefined);
    assert.equal(prix.remiseDeclaree, false);
  });

  it("refuse une référence inférieure au prix payé", () => {
    // Saisie incohérente : mieux vaut un prix nu qu'une remise négative.
    const prix = prixDuFlux({
      prixCourantCents: 12999,
      prixReferenceCents: 6378,
      campagneDatee: true,
    });

    assert.equal(prix.priceCents, 12999);
    assert.equal(prix.salePriceCents, undefined);
    assert.equal(prix.remiseDeclaree, false);
  });
});
