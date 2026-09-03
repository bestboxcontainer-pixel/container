/**
 * Tests des coordonnées de virement.
 *
 * L'enjeu : ce sont les seules données du site sur lesquelles le client envoie
 * de l'argent. Un IBAN mal recopié n'est rattrapé par personne, on vérifie
 * donc que la clé de contrôle est réellement calculée, et que le texte
 * d'instruction saisi par le vendeur ressort avec le montant et le numéro de
 * commande à la place des repères.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BANK_TRANSFER_DEFAULTS,
  bankInstructionsFor,
  coerceBankTransfer,
  formatIban,
  isValidBic,
  isValidIban,
  needsBankDetails,
  parseBankTransferInput,
  renderBankInstructions,
} from "./bankTransfer";

const VALID = {
  holder: "BBC Best Box Containerhandel e.K.",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
};

describe("Contrôle de l'IBAN", () => {
  it("accepte un IBAN valide, avec ou sans espaces", () => {
    assert.ok(isValidIban("DE89 3704 0044 0532 0130 00"));
    assert.ok(isValidIban("DE89370400440532013000"));
    assert.ok(isValidIban("de89370400440532013000"));
    assert.ok(isValidIban("FR14 2004 1010 0505 0001 3M02 606"));
  });

  it("refuse un IBAN dont la clé de contrôle ne tombe pas juste", () => {
    // Deux chiffres intervertis dans le numéro de compte : structure correcte,
    // clé fausse. C'est exactement la faute de frappe que le mod 97 attrape.
    assert.ok(!isValidIban("DE89 3704 0044 0532 0130 09"));
    assert.ok(!isValidIban("DE90 3704 0044 0532 0130 00"));
  });

  it("refuse une saisie mal formée", () => {
    assert.ok(!isValidIban(""));
    assert.ok(!isValidIban("DE89"));
    assert.ok(!isValidIban("1234 3704 0044 0532 0130 00"));
  });

  it("l'IBAN de démonstration livré avec le site est valide", () => {
    assert.ok(isValidIban(BANK_TRANSFER_DEFAULTS.iban));
  });

  it("présente l'IBAN par blocs de quatre", () => {
    assert.equal(formatIban("de89370400440532013000"), "DE89 3704 0044 0532 0130 00");
  });
});

describe("Contrôle du BIC", () => {
  it("accepte 8 et 11 caractères", () => {
    assert.ok(isValidBic("COBADEFF"));
    assert.ok(isValidBic("COBADEFFXXX"));
    assert.ok(isValidBic("byladem1001"));
  });

  it("refuse une longueur ou un format hors norme", () => {
    assert.ok(!isValidBic(""));
    assert.ok(!isValidBic("COBADEF"));
    assert.ok(!isValidBic("COBADEFFXX"));
    assert.ok(!isValidBic("12BADEFFXXX"));
  });
});

describe("Saisie du back-office", () => {
  it("normalise l'IBAN et le BIC enregistrés", () => {
    const result = parseBankTransferInput({ ...VALID, iban: "de89370400440532013000", bic: "cobadeffxxx" });
    assert.ok(result.ok);
    assert.equal(result.value.iban, "DE89 3704 0044 0532 0130 00");
    assert.equal(result.value.bic, "COBADEFFXXX");
  });

  it("exige titulaire, IBAN et BIC", () => {
    for (const missing of ["holder", "iban", "bic"] as const) {
      const result = parseBankTransferInput({ ...VALID, [missing]: "" });
      assert.ok(!result.ok, `${missing} vide devrait être refusé`);
    }
  });

  it("laisse le nom de la banque facultatif", () => {
    const result = parseBankTransferInput({ ...VALID, bank: "" });
    assert.ok(result.ok);
    assert.equal(result.value.bank, "");
  });

  it("laisse le type de virement facultatif et conserve la saisie", () => {
    const vide = parseBankTransferInput({ ...VALID, transferType: "   " });
    assert.ok(vide.ok);
    assert.equal(vide.value.transferType, "");

    const saisi = parseBankTransferInput({ ...VALID, transferType: " SEPA-Echtzeitüberweisung " });
    assert.ok(saisi.ok);
    assert.equal(saisi.value.transferType, "SEPA-Echtzeitüberweisung");
  });

  it("refuse un IBAN dont la clé est fausse, avec un message explicite", () => {
    const result = parseBankTransferInput({ ...VALID, iban: "DE90 3704 0044 0532 0130 00" });
    assert.ok(!result.ok);
    assert.match(result.error, /IBAN/);
  });

  it("un texte d'instruction vide retombe sur la formulation d'origine", () => {
    const result = parseBankTransferInput({ ...VALID, instructionsDe: "  ", instructionsEn: "" });
    assert.ok(result.ok);
    assert.equal(result.value.instructions.de, BANK_TRANSFER_DEFAULTS.instructions.de);
    assert.equal(result.value.instructions.en, BANK_TRANSFER_DEFAULTS.instructions.en);
  });

  it("conserve le texte saisi par le vendeur", () => {
    const result = parseBankTransferInput({
      ...VALID,
      instructionsDe: "Bitte innerhalb von 5 Tagen überweisen: {total}.",
      instructionsEn: "Please transfer {total} within 5 days.",
    });
    assert.ok(result.ok);
    assert.match(result.value.instructions.de, /5 Tagen/);
    assert.match(result.value.instructions.en, /5 days/);
  });
});

describe("Relecture des coordonnées enregistrées", () => {
  /**
   * Les coordonnées écrites en base avant l'ajout du type de virement n'ont pas
   * ce champ. Elles doivent continuer de sortir intactes, sans que le champ
   * manquant ne soit comblé par une valeur de démonstration, le client verrait
   * alors une consigne que le vendeur n'a jamais donnée.
   */
  it("accepte une ligne écrite avant l'ajout du type de virement", () => {
    const ancien = coerceBankTransfer({
      holder: "BBC Best Box Containerhandel e.K.",
      iban: "DE89 3704 0044 0532 0130 00",
      bic: "COBADEFFXXX",
      bank: "Commerzbank",
      instructions: { de: "Bitte überweisen Sie {total}.", en: "Please transfer {total}." },
    });

    assert.equal(ancien.transferType, "");
    assert.equal(ancien.holder, "BBC Best Box Containerhandel e.K.");
    assert.equal(ancien.configured, true);
  });

  it("relit le type de virement enregistré", () => {
    const state = coerceBankTransfer({ transferType: " Standard " });
    assert.equal(state.transferType, "Standard");
  });
});

describe("Rendu de l'instruction", () => {
  const values = { total: "903,95 €", orderNumber: "HP-2026-000042" };

  it("remplace le montant et le numéro de commande", () => {
    const text = renderBankInstructions(BANK_TRANSFER_DEFAULTS.instructions.de, values);
    assert.match(text, /903,95 €/);
    assert.match(text, /HP-2026-000042/);
    assert.doesNotMatch(text, /\{total\}|\{orderNumber\}/);
  });

  it("remplace toutes les occurrences d'un même repère", () => {
    const text = renderBankInstructions("{orderNumber}, Referenz: {orderNumber}", values);
    assert.equal(text, "HP-2026-000042, Referenz: HP-2026-000042");
  });

  it("laisse intact un repère inconnu", () => {
    assert.equal(renderBankInstructions("Betrag {betrag}", values), "Betrag {betrag}");
  });

  it("sert l'anglais à une commande anglaise, l'allemand sinon", () => {
    const settings = {
      ...BANK_TRANSFER_DEFAULTS,
      instructions: { de: "Deutscher Text", en: "English text" },
    };
    assert.equal(bankInstructionsFor(settings, "en"), "English text");
    assert.equal(bankInstructionsFor(settings, "de"), "Deutscher Text");
  });

  it("retombe sur l'allemand si l'anglais n'a pas été saisi", () => {
    const settings = {
      ...BANK_TRANSFER_DEFAULTS,
      instructions: { de: "Deutscher Text", en: "" },
    };
    assert.equal(bankInstructionsFor(settings, "en"), "Deutscher Text");
  });
});

describe("Moyens de paiement qui appellent un virement", () => {
  it("affiche l'IBAN pour la Vorkasse", () => {
    assert.equal(needsBankDetails("vorkasse"), true);
  });

  it("affiche l'IBAN pour un moyen nommé autrement par le commerçant", () => {
    // Cas réel : la boutique n'a activé que « Sofortüberweisung ». Aucun
    // prestataire n'encaisse à sa place, le client doit donc virer.
    assert.equal(needsBankDetails("sofort"), true);
    assert.equal(needsBankDetails("ueberweisung"), true);
  });

  it("n'affiche rien pour un paiement réglé à réception", () => {
    assert.equal(needsBankDetails("rechnung"), false);
    assert.equal(needsBankDetails("nachnahme"), false);
  });
});
