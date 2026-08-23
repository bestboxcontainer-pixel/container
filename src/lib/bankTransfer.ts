/**
 * Coordonnées bancaires du virement (Vorkasse) : forme des données, contrôle de
 * saisie et rendu du texte d'instruction.
 *
 * Ce module ne touche pas la base : la lecture et l'écriture vivent dans
 * `src/server/bankTransfer.ts`. La séparation permet de tester les règles là où
 * elles comptent : le contrôle de l'IBAN et le remplacement des repères du
 * texte d'instruction.
 */

export interface BankTransferSettings {
  /** Titulaire du compte, tel qu'il figure sur le relevé bancaire. */
  holder: string;
  iban: string;
  bic: string;
  /** Nom de l'établissement. Facultatif : masqué s'il est vide. */
  bank: string;
  /**
   * Type de virement attendu : « SEPA-Echtzeitüberweisung », « Standard »…
   * Saisie libre : la banque du vendeur impose sa propre terminologie, et une
   * liste figée finirait par ne plus correspondre à aucune d'elles. Facultatif,
   * donc masqué s'il est vide, au même titre que le nom de l'établissement.
   */
  transferType: string;
  /** Texte affiché au-dessus des coordonnées, une version par langue. */
  instructions: { de: string; en: string };
}

export interface BankTransferState extends BankTransferSettings {
  /**
   * Faux tant qu'aucune coordonnée n'a été enregistrée depuis le back-office.
   * Pilote l'avertissement « données de démonstration » affiché au client.
   */
  configured: boolean;
}

/**
 * Valeurs de repli. Les instructions reprennent mot pour mot les textes qui
 * étaient jusqu'ici dans les fichiers de traduction : vider le champ dans
 * l'administration revient à retrouver la formulation d'origine.
 */
export const BANK_TRANSFER_DEFAULTS: BankTransferSettings = {
  holder: "BBC Best Box Containerhandel e.K. (Demo)",
  iban: "DE02 1203 0000 0000 2020 51",
  bic: "BYLADEM1001",
  bank: "Musterbank (Testdaten)",
  // Vide par défaut : aucune banque n'impose le même libellé, et une valeur
  // inventée serait lue par le client comme une consigne du vendeur. Les
  // coordonnées enregistrées avant l'ajout de ce champ retombent ici, donc
  // n'affichent simplement aucune ligne de plus.
  transferType: "",
  // Une phrase, pas deux. La seconde annonçait l'expédition après réception du
  // paiement : une évidence pour qui vient de lire qu'il doit virer, et une
  // ligne de plus dans un message que le commerçant trouvait déjà trop chargé.
  instructions: {
    de: "Bitte überweisen Sie den Gesamtbetrag von {total} auf unser Konto unter Angabe der Bestellnummer {orderNumber}.",
    en: "Please transfer the total amount of {total} to our account, quoting order number {orderNumber}.",
  },
};

/**
 * Moyens de paiement qui n'appellent aucun virement : la facture se règle à
 * réception, le contre-remboursement se règle au livreur. Tous les autres
 * Vorkasse, Sofortüberweisung, et tout moyen créé depuis le back-office
 * aboutissent à un virement sur le compte de la boutique, puisque aucun
 * prestataire n'encaisse à sa place.
 */
const KEYS_SANS_VIREMENT = new Set(["rechnung", "nachnahme"]);

/**
 * Vrai lorsque le client doit voir les coordonnées bancaires : sur la page de
 * confirmation, dans son e-mail et sur la facture.
 *
 * Le test portait auparavant sur la seule clé « vorkasse ». Un commerçant qui
 * nomme son unique moyen « Sofortüberweisung » se retrouvait alors avec un
 * client sans IBAN, donc sans moyen de payer, et une commande qui n'arrivait
 * jamais. La règle est inversée : on affiche l'IBAN sauf là où il n'a
 * manifestement rien à faire.
 */
export function needsBankDetails(paymentMethodKey: string): boolean {
  return !KEYS_SANS_VIREMENT.has(paymentMethodKey);
}

// ---- Contrôle de l'IBAN et du BIC ----

/** Retire espaces et ponctuation, passe en majuscules. */
export function normalizeIban(value: string): string {
  return value.replace(/[\s.-]/g, "").toUpperCase();
}

/** Présentation par blocs de quatre, comme sur un relevé. */
export function formatIban(value: string): string {
  return normalizeIban(value).replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Validation complète : structure, longueur, puis clé de contrôle mod 97
 * (ISO 7064). Une faute de frappe dans un IBAN envoie l'argent du client dans
 * le vide : le contrôle vaut largement ses dix lignes.
 */
export function isValidIban(value: string): boolean {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;

  // Les quatre premiers caractères passent à la fin, les lettres deviennent des
  // nombres (A=10 … Z=35), et le tout doit valoir 1 modulo 97.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

  // Le nombre dépasse Number.MAX_SAFE_INTEGER : on réduit par tranches.
  let remainder = 0;
  for (const digit of digits) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** BIC/SWIFT : 8 ou 11 caractères, format ISO 9362. */
export function isValidBic(value: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/\s/g, "").toUpperCase());
}

// ---- Instructions ----

/**
 * Remplace les deux seuls repères acceptés dans le texte d'instruction.
 * Un repère inconnu est laissé tel quel : c'est du texte, pas une erreur.
 */
export function renderBankInstructions(
  template: string,
  values: { total: string; orderNumber: string },
): string {
  return template
    .replaceAll("{total}", values.total)
    .replaceAll("{orderNumber}", values.orderNumber);
}

/** Instruction dans la langue de la commande, l'allemand faisant foi par défaut. */
export function bankInstructionsFor(settings: BankTransferSettings, locale: string): string {
  const english = settings.instructions.en.trim();
  if (locale === "en" && english) return english;
  return settings.instructions.de.trim() || BANK_TRANSFER_DEFAULTS.instructions.de;
}

// ---- Contrôle de la saisie ----

export type BankTransferInput = Partial<{
  holder: string;
  iban: string;
  bic: string;
  bank: string;
  transferType: string;
  instructionsDe: string;
  instructionsEn: string;
}>;

/**
 * Contrôle la saisie du back-office, sans toucher à la base : rendu testable
 * seul, et réutilisable par la route API comme message d'erreur au vendeur.
 */
export function parseBankTransferInput(
  input: BankTransferInput,
): { ok: true; value: BankTransferSettings } | { ok: false; error: string } {
  const holder = (input.holder ?? "").trim();
  const iban = normalizeIban(input.iban ?? "");
  const bic = (input.bic ?? "").replace(/\s/g, "").toUpperCase();
  const bank = (input.bank ?? "").trim();
  const transferType = (input.transferType ?? "").trim();

  if (!holder) {
    return { ok: false, error: "Le titulaire du compte est obligatoire." };
  }
  if (!iban) {
    return { ok: false, error: "L'IBAN est obligatoire." };
  }
  if (!isValidIban(iban)) {
    return {
      ok: false,
      error: "IBAN invalide : vérifiez la saisie, le calcul de la clé de contrôle échoue.",
    };
  }
  if (!bic) {
    return { ok: false, error: "Le BIC / SWIFT est obligatoire." };
  }
  if (!isValidBic(bic)) {
    return {
      ok: false,
      error: "BIC / SWIFT invalide : 8 ou 11 caractères, par exemple BYLADEM1001.",
    };
  }

  // Un texte vide n'est pas une erreur : il fait simplement retomber sur la
  // formulation d'origine.
  const instructionsDe =
    (input.instructionsDe ?? "").trim() || BANK_TRANSFER_DEFAULTS.instructions.de;
  const instructionsEn =
    (input.instructionsEn ?? "").trim() || BANK_TRANSFER_DEFAULTS.instructions.en;

  return {
    ok: true,
    value: {
      holder,
      iban: formatIban(iban),
      bic,
      bank,
      transferType,
      instructions: { de: instructionsDe, en: instructionsEn },
    },
  };
}

/**
 * Réinterprète la valeur relue en base. Tout champ manquant ou illisible
 * retombe sur la démonstration : une ligne corrompue ne doit pas vider les
 * coordonnées affichées au client.
 */
export function coerceBankTransfer(value: unknown): BankTransferState {
  if (!value || typeof value !== "object") {
    return { ...BANK_TRANSFER_DEFAULTS, configured: false };
  }

  const raw = value as Record<string, unknown>;
  const text = (entry: unknown, fallback: string) =>
    typeof entry === "string" && entry.trim() ? entry.trim() : fallback;
  const instructions =
    raw.instructions && typeof raw.instructions === "object"
      ? (raw.instructions as Record<string, unknown>)
      : {};

  return {
    holder: text(raw.holder, BANK_TRANSFER_DEFAULTS.holder),
    iban: text(raw.iban, BANK_TRANSFER_DEFAULTS.iban),
    bic: text(raw.bic, BANK_TRANSFER_DEFAULTS.bic),
    // Les deux seuls champs qui acceptent le vide : toutes les banques ne
    // tiennent pas à voir leur nom affiché, et le virement part sans lui comme
    // sans mention de son type.
    bank: typeof raw.bank === "string" ? raw.bank.trim() : BANK_TRANSFER_DEFAULTS.bank,
    transferType:
      typeof raw.transferType === "string"
        ? raw.transferType.trim()
        : BANK_TRANSFER_DEFAULTS.transferType,
    instructions: {
      de: text(instructions.de, BANK_TRANSFER_DEFAULTS.instructions.de),
      en: text(instructions.en, BANK_TRANSFER_DEFAULTS.instructions.en),
    },
    configured: true,
  };
}
