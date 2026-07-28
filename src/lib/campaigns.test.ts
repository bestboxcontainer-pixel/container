/**
 * Tests des calculs de campagne.
 *
 * Le projet n'a pas de cadre de test : on s'en tient au lanceur intégré de Node
 * et à `tsx`, déjà présent pour les scripts. Rien à installer, rien à
 * configurer.
 *
 * Seuls les calculs qui coûtent de l'argent quand ils sont faux sont couverts :
 * le prix remisé, les totaux du panier et le tirage de la cadence. Le reste se
 * vérifie à l'œil dans le back-office.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CADENCE_LIMITS,
  discountedPriceCents,
  effectivePercent,
  estimateSendSeconds,
  formatDuration,
  pickBatchSize,
  pickDelaySeconds,
  renderTemplate,
  savingCents,
  statusAppliesDiscount,
} from "./campaigns";
import { computeTotals, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "./cart";
import type { CartLine } from "./cart";

function line(priceCents: number, quantity = 1): CartLine {
  return {
    productId: `p-${priceCents}-${quantity}`,
    slug: "artikel",
    brand: "Bosch",
    name: "Serie 6",
    image: "/images/artikel.jpg",
    path: "/kuechengeraete/waschmaschinen/artikel",
    priceCents,
    quantity,
    stock: 10,
  };
}

describe("remise appliquée", () => {
  it("retranche le pourcentage demandé", () => {
    assert.equal(discountedPriceCents(49_900, "percent", 20), 39_920);
  });

  it("arrondit au centime plutôt que de tronquer", () => {
    // 33 % de 999 centimes vaut 669,33 : la boutique facture 669, pas 670.
    assert.equal(discountedPriceCents(999, "percent", 33), 669);
  });

  it("retranche le montant demandé", () => {
    assert.equal(discountedPriceCents(49_900, "amount", 9_980), 39_920);
  });

  it("ne descend jamais à zéro, même sur une remise absurde", () => {
    // Dernier garde-fou : le back-office refuse déjà cette saisie en amont.
    assert.equal(discountedPriceCents(4_990, "amount", 999_999), 1);
    assert.equal(discountedPriceCents(4_990, "percent", 100), 50);
  });

  it("laisse le prix intact pour la livraison offerte et pour une annonce sans remise", () => {
    assert.equal(discountedPriceCents(49_900, "free_shipping", 0), 49_900);
    assert.equal(discountedPriceCents(49_900, "none", 0), 49_900);
  });

  it("ne rend jamais une économie négative", () => {
    assert.equal(savingCents(49_900, "percent", 0), 0);
    assert.equal(savingCents(49_900, "free_shipping", 0), 0);
  });

  it("exprime une remise en euros en pourcentage, pour la pastille", () => {
    // 99,80 € sur 499,00 € : le client lit « -20 % », pas « -99,80 € ».
    assert.equal(effectivePercent(49_900, "amount", 9_980), 20);
  });
});

describe("totaux du panier", () => {
  it("applique le forfait de port sous le franco", () => {
    const totals = computeTotals([line(2_999)]);
    assert.equal(totals.shippingCents, SHIPPING_FLAT_CENTS);
    assert.equal(totals.totalCents, 2_999 + SHIPPING_FLAT_CENTS);
  });

  it("offre le port au-delà du seuil", () => {
    const totals = computeTotals([line(FREE_SHIPPING_THRESHOLD_CENTS)]);
    assert.equal(totals.shippingCents, 0);
  });

  it("offre le port quand la campagne l'accorde, quel que soit le montant", () => {
    const totals = computeTotals([line(2_999)], { freeShipping: true });
    assert.equal(totals.shippingCents, 0);
    assert.equal(totals.totalCents, 2_999);
    // Le rappel « encore X € pour la livraison offerte » n'a plus lieu d'être.
    assert.equal(totals.freeShippingMissingCents, 0);
  });

  it("garde une TVA cohérente avec le total réellement facturé", () => {
    const withShipping = computeTotals([line(2_999)]);
    const free = computeTotals([line(2_999)], { freeShipping: true });
    // La TVA est comprise dans le total, elle doit donc baisser avec lui.
    assert.ok(free.taxCents < withShipping.taxCents);
    assert.equal(free.taxCents, Math.round((2_999 * 19) / 119));
  });
});

describe("cadence d'envoi", () => {
  it("tire une taille de lot dans les bornes demandées", () => {
    for (let index = 0; index < 200; index += 1) {
      const size = pickBatchSize(3, 10);
      assert.ok(size >= 3 && size <= 10, `taille hors bornes : ${size}`);
      assert.equal(Number.isInteger(size), true);
    }
  });

  it("respecte les bornes absolues même si la saisie déborde", () => {
    for (let index = 0; index < 100; index += 1) {
      const size = pickBatchSize(-5, 9_999);
      assert.ok(size >= CADENCE_LIMITS.batchMin && size <= CADENCE_LIMITS.batchMax);

      const delay = pickDelaySeconds(0, 999_999);
      assert.ok(delay >= CADENCE_LIMITS.delayMinSec && delay <= CADENCE_LIMITS.delayMaxSec);
    }
  });

  it("supporte des bornes inversées sans boucler ni renvoyer NaN", () => {
    const size = pickBatchSize(10, 3);
    assert.ok(size >= 3 && size <= 10);
  });

  it("varie réellement d'un tirage à l'autre", () => {
    // C'est tout l'intérêt : un rythme constant est ce que repèrent les filtres
    // de réputation. Un tirage figé passerait tous les tests précédents.
    const draws = new Set(Array.from({ length: 60 }, () => pickBatchSize(3, 10)));
    assert.ok(draws.size > 1, "la taille des lots ne varie pas");
  });

  it("estime la durée d'envoi sans compter de pause après le dernier lot", () => {
    // 13 destinataires, lots de 6,5 en moyenne : 2 lots, donc une seule pause.
    assert.equal(estimateSendSeconds(13, { batchMin: 3, batchMax: 10, delayMinSec: 180, delayMaxSec: 420 }), 300);
    assert.equal(estimateSendSeconds(0, { batchMin: 3, batchMax: 10, delayMinSec: 180, delayMaxSec: 420 }), 0);
  });

  it("met la durée en français lisible", () => {
    assert.equal(formatDuration(30), "moins d'une minute");
    assert.equal(formatDuration(2_700), "45 min");
    assert.equal(formatDuration(7_200), "2 h");
    assert.equal(formatDuration(9_600), "2 h 40 min");
  });
});

describe("gabarits de message", () => {
  it("remplace les variables connues", () => {
    assert.equal(
      renderTemplate("{remise} auf {produit}", { remise: "-20 %", produit: "Serie 6" }),
      "-20 % auf Serie 6",
    );
  });

  it("laisse une variable inconnue en évidence plutôt que de la vider", () => {
    // Un trou silencieux dans un message parti à 250 clients ne se rattrape
    // pas ; un « {machin} » visible dans l'aperçu, si.
    assert.equal(renderTemplate("Hallo {machin}", {}), "Hallo {machin}");
  });
});

describe("application de la remise selon le statut", () => {
  it("n'applique rien tant que la campagne est un brouillon", () => {
    assert.equal(statusAppliesDiscount("brouillon"), false);
    assert.equal(statusAppliesDiscount("annulee"), false);
  });

  it("applique la remise dès l'envoi et jusqu'à la date de fin", () => {
    assert.equal(statusAppliesDiscount("en_cours"), true);
    assert.equal(statusAppliesDiscount("envoyee"), true);
    // En pause, les messages ne partent plus mais ceux déjà reçus annoncent un
    // prix : le retirer ferait mentir les messages en circulation.
    assert.equal(statusAppliesDiscount("pausee"), true);
  });
});
