/**
 * Socle commun de la relance des tunnels de commande abandonnés.
 *
 * Ce module ne connaît ni Prisma ni React : il tient les délais de la séquence,
 * les libellés allemands et l'encodage du panier figé. Il est importé par le
 * répartiteur, par les gabarits d'e-mail, par le back-office et par les scripts
 * de test : exactement le rôle que src/lib/cart.ts joue pour le panier.
 *
 * La séquence complète est décrite dans
 * docs/superpowers/specs/2026-07-26-warenkorb-erinnerungen-design.md
 */

// ---- Types ----

/** Étape du tunnel atteinte avant l'abandon. */
export type RecoveryStep = "contact" | "payment" | "review";

/** Motif d'arrêt. Chaîne vide = séquence encore active. */
export type RecoveryStoppedReason = "" | "converted" | "unsubscribed" | "completed" | "failed";

/**
 * Ligne de panier figée dans `CheckoutRecovery.cartJson`.
 *
 * Les libellés sont recopiés plutôt que référencés, comme dans OrderItem : le
 * message doit rester lisible si l'article quitte le catalogue entre l'abandon
 * et le septième jour. Le prix et le stock, eux, sont rafraîchis en base avant
 * chaque envoi : ces valeurs-ci ne servent que de repli.
 */
export interface RecoveryLine {
  productId: string;
  brand: string;
  name: string;
  image: string;
  /** Chemin de la fiche produit, sans barre oblique initiale : « gruppe/kategorie/produkt ». */
  path: string;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  lowStockThreshold: number;
  /** new | refurbished | used, repris de Product.condition. */
  condition: string;
}

// ---- Calendrier ----

/** Trois messages, pas plus : au-delà, une relance devient du harcèlement. */
export const RECOVERY_MAIL_COUNT = 3;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Délais **relatifs au message précédent**, indexés par le nombre de messages
 * déjà envoyés. Le premier compte depuis la capture.
 *
 * Vingt minutes pour le premier : assez pour laisser le visiteur revenir de
 * lui-même, encore assez tôt pour un simple rappel. Huit heures avant le
 * deuxième : le temps d'une nuit ou d'une journée de travail. Vingt-quatre
 * heures avant le troisième, dernière relance avant suppression du panier.
 */
export const RECOVERY_DELAYS_MS: readonly number[] = [20 * MINUTE, 8 * HOUR, 24 * HOUR];

/** Date du prochain envoi, ou null quand la séquence est épuisée. */
export function nextSendAtFor(sentCount: number, from: Date): Date | null {
  const delay = RECOVERY_DELAYS_MS[sentCount];
  if (delay === undefined) return null;
  return new Date(from.getTime() + delay);
}

// ---- Réglages du répartiteur ----

/** Échecs consécutifs tolérés sur un même message avant abandon de la ligne. */
export const MAX_SEND_ATTEMPTS = 3;

/** Durée de conservation d'une session sans commande, en jours. */
export const RECOVERY_RETENTION_DAYS = 30;

/** Au-delà, un verrou est considéré comme laissé par un processus mort. */
export const RECOVERY_CLAIM_TIMEOUT_MS = 5 * MINUTE;

/** Envois maximum par tick. */
export const RECOVERY_BATCH_SIZE = 20;

/** Période du tick. */
export const RECOVERY_TICK_MS = MINUTE;

/** Pause entre deux envois d'un même tick, pour ne pas rafaler le serveur SMTP. */
export const RECOVERY_SEND_SPACING_MS = 250;

/** Report après un refus du serveur d'envoi. */
export const RECOVERY_RETRY_DELAY_MS = 30 * MINUTE;

/** Clé de l'interrupteur global dans la table Setting. */
export const RECOVERY_ENABLED_SETTING = "checkoutRecovery.enabled";

/** Paramètre d'URL porteur du jeton de reprise sur la page caisse. */
export const RESUME_QUERY_PARAM = "fortsetzen";

// ---- Code promotionnel du troisième message ----
//
// Code fixe, à saisir manuellement au panier : pas de lien qui l'appliquerait
// tout seul, pour rester sur le même mécanisme que n'importe quel coupon de la
// boutique. La ligne Coupon correspondante vit en base (table Coupon, code
// ci-dessous) : c'est elle qui fait foi pour le pourcentage et le seuil,
// jamais recalculée ici. Ces deux constantes ne servent qu'à composer le texte
// du message ; les changer ne change pas ce que Prisma applique réellement.

/** Code annoncé dans le troisième message. */
export const RECOVERY_COUPON_CODE = "WARENKORB10";
/** Pourcentage de remise du coupon ci-dessus, pour le texte du message. */
export const RECOVERY_COUPON_PERCENT = 10;
/** Panier minimum exigé, en centimes, pour le texte du message. */
export const RECOVERY_COUPON_MIN_SUBTOTAL_CENTS = 30_000;

// ---- Libellés allemands ----

/**
 * Disponibilité affichée dans le message. Calculée à l'envoi, sur le stock
 * relu en base : annoncer « Auf Lager » un article épuisé se retourne contre
 * la boutique dès que le client clique.
 */
export function availabilityLabel(line: RecoveryLine): string {
  if (line.stock <= 0) return "Derzeit nicht verfügbar";
  if (line.stock <= line.lowStockThreshold) return `Nur noch ${line.stock} verfügbar`;
  return "Auf Lager";
}

/** État de l'appareil, depuis Product.condition. */
export function conditionLabel(condition: string): string {
  if (condition === "refurbished") return "Generalüberholt";
  if (condition === "used") return "Gebraucht";
  return "Neuware";
}

// ---- Adresse ----

/** Forme servant à tous les rapprochements : minuscules, sans espaces autour. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---- Panier figé ----

function isRecoveryLine(value: unknown): value is RecoveryLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    typeof line.brand === "string" &&
    typeof line.name === "string" &&
    typeof line.image === "string" &&
    typeof line.path === "string" &&
    typeof line.unitPriceCents === "number" &&
    typeof line.quantity === "number" &&
    typeof line.stock === "number" &&
    typeof line.lowStockThreshold === "number" &&
    typeof line.condition === "string"
  );
}

export function encodeCart(lines: RecoveryLine[]): string {
  return JSON.stringify(lines);
}

/**
 * Décodage tolérant. Une ligne illisible ne doit pas interrompre le tick : le
 * répartiteur traite vingt sessions à la suite, et une donnée abîmée dans l'une
 * priverait les dix-neuf autres de leur message.
 */
export function decodeCart(json: string): RecoveryLine[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isRecoveryLine);
}

