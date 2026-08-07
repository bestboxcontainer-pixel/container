/**
 * Tests du bloc bancaire de la facture et de la préparation des vignettes.
 *
 * L'enjeu : la facture d'une commande payée d'avance doit porter le compte sur
 * lequel virer et la référence à indiquer — c'est la pièce que le client passe
 * à sa banque. Inversement, une facture déjà réglée, ou réglée autrement, ne
 * doit surtout pas réclamer un virement de plus.
 *
 * Les vignettes, elles, ne doivent jamais faire échouer la composition : une
 * adresse inutilisable se traduit par une case vide, pas par une exception.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BankTransferSettings } from "@/lib/bankTransfer";
import { lignesVirement, urlVignette } from "./invoice";

const BANK: BankTransferSettings = {
  holder: "Hausgeräte Pfeffer OHG",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
  transferType: "SEPA-Echtzeitüberweisung",
  instructions: { de: "Bitte überweisen Sie {total}.", en: "Please transfer {total}." },
};

const COMMANDE = {
  paymentMethodKey: "vorkasse",
  paidAt: undefined,
  orderNumber: "HP-2026-000042",
};

/** Les paires sont mises à plat pour vérifier la présence d'une mention. */
function aplati(paires: Array<[string, string]>): string {
  return paires.map(([etiquette, valeur]) => `${etiquette}: ${valeur}`).join("\n");
}

describe("Bloc bancaire de la facture", () => {
  it("porte le compte et la référence sur une commande en virement non réglée", () => {
    const lignes = aplati(lignesVirement(COMMANDE, BANK));

    assert.match(lignes, /Kontoinhaber: Hausgeräte Pfeffer OHG/);
    assert.match(lignes, /IBAN: DE89 3704 0044 0532 0130 00/);
    assert.match(lignes, /BIC: COBADEFFXXX/);
    assert.match(lignes, /Bank: Commerzbank/);
    assert.match(lignes, /Überweisungsart: SEPA-Echtzeitüberweisung/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });

  it("passe le type de virement sous silence quand il n'est pas renseigné", () => {
    const lignes = aplati(lignesVirement(COMMANDE, { ...BANK, transferType: "" }));

    assert.doesNotMatch(lignes, /Überweisungsart/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });

  it("ne réclame rien sur une commande déjà payée", () => {
    const paid = { ...COMMANDE, paidAt: "2026-08-01T10:00:00.000Z" };
    assert.deepEqual(lignesVirement(paid, BANK), []);
  });

  it("ne réclame rien sur un autre moyen de paiement", () => {
    assert.deepEqual(lignesVirement({ ...COMMANDE, paymentMethodKey: "rechnung" }, BANK), []);
    assert.deepEqual(lignesVirement({ ...COMMANDE, paymentMethodKey: "nachnahme" }, BANK), []);
  });

  it("ne réclame rien sans coordonnées disponibles", () => {
    assert.deepEqual(lignesVirement(COMMANDE, undefined), []);
  });

  it("omet le nom de la banque quand il n'est pas renseigné", () => {
    const lignes = aplati(lignesVirement(COMMANDE, { ...BANK, bank: "" }));
    assert.doesNotMatch(lignes, /Bank:/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });
});

describe("Adresse des vignettes produits", () => {
  it("force le JPEG sur une image Cloudinary livrée en format automatique", () => {
    const source =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1712345678/produits/waschmaschine.jpg";
    const url = urlVignette(source);

    // pdf-lib ne sait embarquer ni AVIF ni WebP : le format doit être imposé.
    assert.ok(url);
    assert.match(url, /f_jpg/);
    assert.doesNotMatch(url, /f_auto/);
    assert.match(url, /w_160/);
  });

  it("insère la transformation quand l'URL Cloudinary n'en porte aucune", () => {
    const url = urlVignette("https://res.cloudinary.com/demo/image/upload/v1/produits/tv.jpg");
    assert.ok(url);
    assert.match(url, /\/upload\/f_jpg,q_auto,w_160,c_fit\/v1\//);
  });

  it("laisse intacte une image hébergée ailleurs", () => {
    const source = "https://exemple.de/bilder/kuehlschrank.png";
    assert.equal(urlVignette(source), source);
  });

  it("ignore un chemin local, faute d'origine à laquelle le rattacher", () => {
    // La facture est composée hors requête HTTP : « /images/x.png » n'est
    // rattachable à aucun domaine, la case restera vide.
    assert.equal(urlVignette("/images/produkte/herd.png"), null);
    assert.equal(urlVignette(""), null);
  });
});
