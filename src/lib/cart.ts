// Panier de la boutique.
//
// Ce module est volontairement isolé de React : il contient les constantes
// tarifaires, les calculs de montants — repris tels quels côté serveur dans
// src/server/orders.ts — et un petit magasin persisté dans localStorage que
// CartProvider branche sur React via useSyncExternalStore.
//
// Aucune directive "use client" ici : le serveur importe les constantes et les
// fonctions de calcul, jamais le magasin (protégé par un test sur `window`).

/** Clé localStorage, versionnée pour pouvoir invalider un ancien format. */
export const CART_STORAGE_KEY = "hgp.cart.v1";

/** Franco de port à partir de 50,00 € de marchandise. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;

/** Forfait de livraison en dessous du franco : 4,95 €. */
export const SHIPPING_FLAT_CENTS = 495;

/** TVA allemande standard, en points de pourcentage. */
export const VAT_RATE_PERCENT = 19;

/** Garde-fou : au-delà, il s'agit d'une commande professionnelle à traiter à part. */
export const MAX_QUANTITY_PER_LINE = 20;

/** Nombre maximal de lignes distinctes dans un panier. */
export const MAX_CART_LINES = 40;

export interface CartLine {
  /** Identifiant du produit en base — seule donnée à laquelle le serveur se fie. */
  productId: string;
  slug: string;
  brand: string;
  name: string;
  image: string;
  /** Chemin de la fiche produit, par ex. « /kuechengeraete/kuehlschraenke/xyz ». */
  path: string;
  /** Prix unitaire TTC en centimes, instantané au moment de l'ajout. */
  priceCents: number;
  quantity: number;
  /** Stock connu au moment de l'ajout ; recontrôlé côté serveur à la commande. */
  stock: number;
}

export interface CartTotals {
  /** Nombre d'articles, quantités comprises. */
  itemCount: number;
  /** Marchandise TTC. */
  subtotalCents: number;
  shippingCents: number;
  /** TVA *contenue* dans le total, jamais un supplément. */
  taxCents: number;
  totalCents: number;
  /** Reste à atteindre pour la livraison gratuite ; 0 si déjà atteint. */
  freeShippingMissingCents: number;
}

// ---- Calculs ----

/**
 * Formatage identique à `formatPrice` de src/server/store.ts, mais utilisable
 * dans un composant client : ce module n'importe pas Prisma.
 * Le format reste allemand dans les deux langues, comme partout dans la
 * boutique — c'est un magasin allemand, les prix sont en euros.
 */
export function formatCents(cents: number): string {
  return `${(cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function shippingCostFor(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

/**
 * Part de TVA comprise dans un montant TTC.
 * Les prix affichés sont bruts (Preisangabenverordnung § 3), la TVA se déduit
 * donc du total : brut × 19 / 119.
 */
export function includedVatCents(grossCents: number, ratePercent = VAT_RATE_PERCENT): number {
  if (grossCents <= 0) return 0;
  return Math.round((grossCents * ratePercent) / (100 + ratePercent));
}

export interface TotalsOptions {
  /**
   * Livraison offerte accordée par une campagne marketing, indépendamment du
   * franco de port habituel. L'autorité reste au serveur : le panier peut
   * l'annoncer, seule la commande la valide (src/server/orders.ts).
   */
  freeShipping?: boolean;
}

/**
 * Le paramètre `options` est facultatif : tous les appels antérieurs à la
 * livraison offerte des campagnes continuent de fonctionner sans changement.
 */
export function computeTotals(
  lines: readonly CartLine[],
  options?: TotalsOptions,
): CartTotals {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);

  const grantedFreeShipping = options?.freeShipping === true;
  const shippingCents = grantedFreeShipping ? 0 : shippingCostFor(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  return {
    itemCount,
    subtotalCents,
    shippingCents,
    taxCents: includedVatCents(totalCents),
    totalCents,
    // Le port est déjà offert : réclamer « encore 12,40 € pour la livraison
    // gratuite » n'aurait plus aucun sens dans le récapitulatif.
    freeShippingMissingCents: grantedFreeShipping
      ? 0
      : Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents),
  };
}

export function clampQuantity(quantity: number, stock: number): number {
  const upperBound = Math.min(MAX_QUANTITY_PER_LINE, stock > 0 ? stock : MAX_QUANTITY_PER_LINE);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(1, Math.floor(quantity)), Math.max(1, upperBound));
}

// ---- Magasin persisté ----

type Listener = () => void;

/**
 * Instantané rendu par le serveur : toujours le même objet, sans quoi React
 * boucle à l'infini et l'hydratation diverge.
 */
const EMPTY_LINES: readonly CartLine[] = Object.freeze([]);

let snapshot: readonly CartLine[] = EMPTY_LINES;
let hydrated = false;
const listeners = new Set<Listener>();

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    line.productId.length > 0 &&
    typeof line.priceCents === "number" &&
    Number.isFinite(line.priceCents) &&
    typeof line.quantity === "number" &&
    Number.isFinite(line.quantity)
  );
}

function normalize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];

  const lines: CartLine[] = [];
  for (const entry of raw) {
    if (!isCartLine(entry)) continue;
    if (lines.some((line) => line.productId === entry.productId)) continue;

    lines.push({
      productId: entry.productId,
      slug: typeof entry.slug === "string" ? entry.slug : "",
      brand: typeof entry.brand === "string" ? entry.brand : "",
      name: typeof entry.name === "string" ? entry.name : "",
      image: typeof entry.image === "string" ? entry.image : "",
      path: typeof entry.path === "string" ? entry.path : "",
      priceCents: Math.max(0, Math.round(entry.priceCents)),
      stock: typeof entry.stock === "number" && Number.isFinite(entry.stock) ? entry.stock : 0,
      quantity: clampQuantity(entry.quantity, entry.stock ?? 0),
    });

    if (lines.length >= MAX_CART_LINES) break;
  }
  return lines;
}

function readStorage(): readonly CartLine[] {
  if (typeof window === "undefined") return EMPTY_LINES;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return EMPTY_LINES;
    const lines = normalize(JSON.parse(raw));
    return lines.length > 0 ? lines : EMPTY_LINES;
  } catch {
    return EMPTY_LINES;
  }
}

function writeStorage(lines: readonly CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    if (lines.length === 0) window.localStorage.removeItem(CART_STORAGE_KEY);
    else window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Mode privé ou quota atteint : le panier reste valable pour la session.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(lines: readonly CartLine[]): void {
  snapshot = lines.length > 0 ? lines : EMPTY_LINES;
  hydrated = true;
  writeStorage(snapshot);
  emit();
}

/** Instantané client : lu paresseusement une seule fois, puis stable par référence. */
export function getCartSnapshot(): readonly CartLine[] {
  if (!hydrated) {
    snapshot = readStorage();
    hydrated = true;
  }
  return snapshot;
}

/** Instantané utilisé au rendu serveur et pendant l'hydratation : panier vide. */
export function getCartServerSnapshot(): readonly CartLine[] {
  return EMPTY_LINES;
}

// Un panier modifié dans un autre onglet doit se refléter ici. Le gestionnaire
// est unique et posé une seule fois, quel que soit le nombre d'abonnés React.
let storageListenerAttached = false;

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
  snapshot = readStorage();
  hydrated = true;
  emit();
}

export function subscribeCart(listener: Listener): () => void {
  listeners.add(listener);

  if (typeof window !== "undefined" && !storageListenerAttached) {
    window.addEventListener("storage", onStorage);
    storageListenerAttached = true;
  }

  return () => {
    listeners.delete(listener);
  };
}

export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1): void {
  const current = getCartSnapshot();
  const existing = current.find((entry) => entry.productId === line.productId);

  if (existing) {
    commit(
      current.map((entry) =>
        entry.productId === line.productId
          ? {
              ...entry,
              // Le prix et le stock sont rafraîchis à chaque ajout
              ...line,
              quantity: clampQuantity(entry.quantity + quantity, line.stock),
            }
          : entry,
      ),
    );
    return;
  }

  if (current.length >= MAX_CART_LINES) return;
  commit([...current, { ...line, quantity: clampQuantity(quantity, line.stock) }]);
}

export function setCartQuantity(productId: string, quantity: number): void {
  const current = getCartSnapshot();
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  commit(
    current.map((entry) =>
      entry.productId === productId
        ? { ...entry, quantity: clampQuantity(quantity, entry.stock) }
        : entry,
    ),
  );
}

export function removeFromCart(productId: string): void {
  commit(getCartSnapshot().filter((entry) => entry.productId !== productId));
}

export function clearCart(): void {
  commit([]);
}

/**
 * Remplace le panier par une version revalidée côté serveur (prix, stock,
 * disponibilité). Ne notifie que si quelque chose a réellement changé, pour ne
 * pas déclencher de rendu inutile.
 */
export function replaceCart(lines: readonly CartLine[]): void {
  const current = getCartSnapshot();
  const next = normalize(lines);
  if (JSON.stringify(current) === JSON.stringify(next)) return;
  commit(next);
}
