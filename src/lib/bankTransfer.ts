/**
 * Coordonnées bancaires du virement (Vorkasse) : forme des données, contrôle de
 * saisie et rendu du texte d'instruction.
 *
 * Ce module ne touche pas la base — la lecture et l'écriture vivent dans
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
  holder: "Hausgeräte Pfeffer OHG (Demo)",
  iban: "DE02 1203 0000 0000 2020 51",
  bic: "BYLADEM1001",
  bank: "Musterbank (Testdaten)",
  instructions: {
    de: "Bitte überweisen Sie den Gesamtbetrag von {total} unter Angabe der Bestellnummer {orderNumber}. Ihre Ware wird nach Zahlungseingang versandt.",
    en: "Please transfer the total of {total} quoting the order number {orderNumber}. Your goods will be dispatched once the payment has arrived.",
  },
};

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
 * le vide — le contrôle vaut largement ses dix lignes.
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
    // Seul champ qui accepte le vide : toutes les banques ne tiennent pas à
    // voir leur nom affiché, et le virement part sans lui.
    bank: typeof raw.bank === "string" ? raw.bank.trim() : BANK_TRANSFER_DEFAULTS.bank,
    instructions: {
      de: text(instructions.de, BANK_TRANSFER_DEFAULTS.instructions.de),
      en: text(instructions.en, BANK_TRANSFER_DEFAULTS.instructions.en),
    },
    configured: true,
  };
}
