import { randomUUID } from "node:crypto";
import { prisma } from "@/server/prisma";
import { adjustStock } from "@/server/stock";
import { listEnabledPaymentMethods } from "@/server/payments";
import { campaignGrantsFreeShipping, priceForOrder } from "@/server/promotions";
import { computeTotals, MAX_CART_LINES, MAX_QUANTITY_PER_LINE, VAT_RATE_PERCENT } from "@/lib/cart";
import type { CartLine } from "@/lib/cart";
import { isOrderStatus, isPaymentStatus } from "@/lib/orderStatus";
import type { OrderStatus, PaymentStatus } from "@/lib/orderStatus";

// Commandes de la boutique.
//
// Deux principes non négociables :
//  1. Le serveur ne fait jamais confiance au panier envoyé par le navigateur.
//     Seuls les identifiants de produit et les quantités sont repris ; les prix,
//     les libellés et la disponibilité sont relus en base.
//  2. Les montants sont archivés en centimes et TTC. « taxCents » est la TVA
//     contenue dans le total (Preisangabenverordnung § 3), pas un supplément.

// ---- Statuts ----
// Définis dans @/lib/orderStatus pour rester importables depuis un composant
// client sans embarquer Prisma ; réexportés ici par commodité.

export {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  ORDER_STATUS_BADGES,
  PAYMENT_STATUS_BADGES,
  isOrderStatus,
  isPaymentStatus,
} from "@/lib/orderStatus";
export type { OrderStatus, PaymentStatus } from "@/lib/orderStatus";

// ---- Types publics ----

export interface OrderAddress {
  salutation: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface OrderItemRecord {
  id: string;
  productId?: string;
  brand: string;
  name: string;
  sku: string;
  slug: string;
  image: string;
  path: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderEventRecord {
  id: string;
  kind: string;
  fromValue: string;
  toValue: string;
  note: string;
  createdAt: string;
  createdBy?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  accessToken: string;
  locale: string;
  email: string;
  phone: string;
  billing: OrderAddress;
  shippingSameAsBilling: boolean;
  shipping: OrderAddress;
  paymentMethodKey: string;
  paymentMethodLabel: string;
  paymentMethodFee: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxRatePercent: number;
  currency: string;
  customerNote: string;
  adminNote: string;
  termsAcceptedAt?: string;
  withdrawalAcknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  items: OrderItemRecord[];
  events: OrderEventRecord[];
}

/** Codes d'erreur : la couche HTTP les traduit dans la langue du client. */
export type CheckoutErrorCode =
  | "invalid_payload"
  | "cart_empty"
  | "cart_too_large"
  | "invalid_quantity"
  | "invalid_email"
  | "invalid_name"
  | "invalid_street"
  | "invalid_postal_code"
  | "invalid_city"
  | "unsupported_country"
  | "invalid_phone"
  | "invalid_payment_method"
  | "terms_required"
  | "withdrawal_required"
  | "product_unavailable"
  | "insufficient_stock"
  | "order_failed";

export class OrderError extends Error {
  readonly code: CheckoutErrorCode;
  /** Produit concerné, quand l'erreur porte sur une ligne précise. */
  readonly detail?: { name: string; available: number };

  constructor(code: CheckoutErrorCode, detail?: { name: string; available: number }) {
    super(code);
    this.name = "OrderError";
    this.code = code;
    this.detail = detail;
  }
}

export interface CheckoutInput {
  locale: string;
  email: string;
  phone: string;
  billing: OrderAddress;
  shippingSameAsBilling: boolean;
  shipping: OrderAddress;
  paymentMethodKey: string;
  customerNote: string;
  termsAccepted: boolean;
  withdrawalAcknowledged: boolean;
  items: { productId: string; quantity: number }[];
}

/** Seule zone de livraison desservie pour l'instant. */
export const SUPPORTED_COUNTRIES = ["DE"] as const;

// ---- Lecture / conversion ----

const orderInclude = {
  items: { orderBy: { name: "asc" } },
  events: { orderBy: { createdAt: "desc" } },
} as const;

type OrderRow = Awaited<ReturnType<typeof prisma.order.findFirst<{ include: typeof orderInclude }>>>;

function toRecord(row: NonNullable<OrderRow>): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    accessToken: row.accessToken,
    locale: row.locale,
    email: row.email,
    phone: row.phone,
    billing: {
      salutation: row.billingSalutation,
      firstName: row.billingFirstName,
      lastName: row.billingLastName,
      company: row.billingCompany,
      street: row.billingStreet,
      postalCode: row.billingPostalCode,
      city: row.billingCity,
      country: row.billingCountry,
    },
    shippingSameAsBilling: row.shippingSameAsBilling,
    shipping: {
      salutation: row.shippingSalutation,
      firstName: row.shippingFirstName,
      lastName: row.shippingLastName,
      company: row.shippingCompany,
      street: row.shippingStreet,
      postalCode: row.shippingPostalCode,
      city: row.shippingCity,
      country: row.shippingCountry,
    },
    paymentMethodKey: row.paymentMethodKey,
    paymentMethodLabel: row.paymentMethodLabel,
    paymentMethodFee: row.paymentMethodFee,
    status: isOrderStatus(row.status) ? row.status : "eingegangen",
    paymentStatus: isPaymentStatus(row.paymentStatus) ? row.paymentStatus : "offen",
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    taxCents: row.taxCents,
    totalCents: row.totalCents,
    taxRatePercent: row.taxRatePercent,
    currency: row.currency,
    customerNote: row.customerNote,
    adminNote: row.adminNote,
    termsAcceptedAt: row.termsAcceptedAt?.toISOString(),
    withdrawalAcknowledgedAt: row.withdrawalAcknowledgedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
    shippedAt: row.shippedAt?.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      brand: item.brand,
      name: item.name,
      sku: item.sku,
      slug: item.slug,
      image: item.image,
      path: item.path,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    events: row.events.map((event) => ({
      id: event.id,
      kind: event.kind,
      fromValue: event.fromValue,
      toValue: event.toValue,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
      createdBy: event.createdBy ?? undefined,
    })),
  };
}

export async function getOrder(id: string): Promise<OrderRecord | undefined> {
  const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return row ? toRecord(row) : undefined;
}

/**
 * Consultation par numéro de commande. Le jeton est exigé côté boutique :
 * le numéro est séquentiel, donc devinable, et la commande contient l'adresse
 * complète du client.
 */
export async function getOrderByNumber(
  orderNumber: string,
  accessToken?: string,
): Promise<OrderRecord | undefined> {
  const row = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: orderInclude,
  });
  if (!row) return undefined;
  if (accessToken !== undefined && row.accessToken !== accessToken) return undefined;
  return toRecord(row);
}

export interface OrderListFilter {
  page?: number;
  perPage?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Recherche sur le numéro, l'e-mail ou le nom du client. */
  query?: string;
}

export interface OrderListResult {
  orders: OrderRecord[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listOrders(filter: OrderListFilter = {}): Promise<OrderListResult> {
  const perPage = Math.min(Math.max(filter.perPage ?? 25, 1), 100);
  const query = filter.query?.trim() ?? "";

  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.paymentStatus ? { paymentStatus: filter.paymentStatus } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query } },
            { email: { contains: query } },
            { billingLastName: { contains: query } },
            { billingFirstName: { contains: query } },
          ],
        }
      : {}),
  };

  const total = await prisma.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(filter.page ?? 1, 1), pageCount);

  const rows = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { orders: rows.map(toRecord), total, page, perPage, pageCount };
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus | "total", number>> {
  const grouped = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<OrderStatus | "total", number> = {
    eingegangen: 0,
    in_bearbeitung: 0,
    versandt: 0,
    zugestellt: 0,
    storniert: 0,
    total: 0,
  };
  for (const entry of grouped) {
    counts.total += entry._count._all;
    if (isOrderStatus(entry.status)) counts[entry.status] = entry._count._all;
  }
  return counts;
}

/** Commandes qui demandent encore une action : ni livrées ni annulées. */
export async function countOpenOrders(): Promise<number> {
  return prisma.order.count({ where: { status: { in: ["eingegangen", "in_bearbeitung"] } } });
}

// ---- Validation de la commande ----

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL_CODE_PATTERNS: Record<string, RegExp> = { DE: /^\d{5}$/ };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readAddress(value: unknown): OrderAddress {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    salutation: text(raw.salutation, 20),
    firstName: text(raw.firstName, 80),
    lastName: text(raw.lastName, 80),
    company: text(raw.company, 120),
    street: text(raw.street, 160),
    postalCode: text(raw.postalCode, 12).toUpperCase(),
    city: text(raw.city, 80),
    country: (text(raw.country, 2) || "DE").toUpperCase(),
  };
}

function validateAddress(address: OrderAddress): CheckoutErrorCode | undefined {
  if (address.firstName.length < 2 || address.lastName.length < 2) return "invalid_name";
  if (address.street.length < 4) return "invalid_street";
  if (!(SUPPORTED_COUNTRIES as readonly string[]).includes(address.country)) {
    return "unsupported_country";
  }
  const pattern = POSTAL_CODE_PATTERNS[address.country];
  if (pattern && !pattern.test(address.postalCode)) return "invalid_postal_code";
  if (address.city.length < 2) return "invalid_city";
  return undefined;
}

/**
 * Analyse la charge utile publique du tunnel de commande.
 * Ne touche pas à la base : uniquement forme et cohérence des champs.
 */
export function parseCheckoutPayload(payload: unknown): {
  input?: CheckoutInput;
  errors: CheckoutErrorCode[];
} {
  if (!payload || typeof payload !== "object") return { errors: ["invalid_payload"] };
  const raw = payload as Record<string, unknown>;
  const errors: CheckoutErrorCode[] = [];

  const email = text(raw.email, 160).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) errors.push("invalid_email");

  // Le téléphone est exigé : le transporteur en a besoin pour les livraisons
  // de gros électroménager, qui se prennent sur rendez-vous.
  const phone = text(raw.phone, 40);
  if (!phone || !/^[+0-9\s()/.-]{6,40}$/.test(phone)) errors.push("invalid_phone");

  const billing = readAddress(raw.billing);
  const billingError = validateAddress(billing);
  if (billingError) errors.push(billingError);

  const shippingSameAsBilling = raw.shippingSameAsBilling !== false;
  const shipping = shippingSameAsBilling ? { ...billing } : readAddress(raw.shipping);
  if (!shippingSameAsBilling) {
    const shippingError = validateAddress(shipping);
    if (shippingError) errors.push(shippingError);
  }

  const paymentMethodKey = text(raw.paymentMethodKey, 60);
  if (!paymentMethodKey) errors.push("invalid_payment_method");

  // Button-Lösung (§ 312j BGB) : le client doit avoir accepté les CGV et pris
  // connaissance du droit de rétractation avant que le bouton ne l'engage.
  if (raw.termsAccepted !== true) errors.push("terms_required");
  if (raw.withdrawalAcknowledged !== true) errors.push("withdrawal_required");

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const seen = new Set<string>();
  const items: { productId: string; quantity: number }[] = [];
  let badQuantity = false;
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const line = entry as Record<string, unknown>;
    const productId = text(line.productId, 60);
    const quantity = typeof line.quantity === "number" ? Math.floor(line.quantity) : 0;
    if (!productId || seen.has(productId)) continue;
    // Une quantité hors bornes est signalée, jamais corrigée en silence :
    // livrer 20 pièces là où le client en a demandé 50 modifierait sa commande.
    if (quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      badQuantity = true;
      continue;
    }
    seen.add(productId);
    items.push({ productId, quantity });
  }
  if (badQuantity) errors.push("invalid_quantity");
  else if (items.length === 0) errors.push("cart_empty");
  if (items.length > MAX_CART_LINES) errors.push("cart_too_large");

  if (errors.length > 0) return { errors };

  return {
    input: {
      locale: text(raw.locale, 5) === "en" ? "en" : "de",
      email,
      phone,
      billing,
      shippingSameAsBilling,
      shipping,
      paymentMethodKey,
      customerNote: text(raw.customerNote, 1000),
      termsAccepted: true,
      withdrawalAcknowledged: true,
      items,
    },
    errors: [],
  };
}

// ---- Numéro de commande ----

/**
 * Numéro lisible « HP-AAAA-NNNNNN », séquentiel par année civile.
 * L'unicité réelle est garantie par la contrainte en base ; la boucle d'appel
 * réessaie en cas de collision entre deux commandes simultanées.
 */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `HP-${year}-`;
  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const previous = last ? Number.parseInt(last.orderNumber.slice(prefix.length), 10) : 0;
  const next = Number.isFinite(previous) ? previous + 1 : 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}

// ---- Création ----

interface ReservedLine {
  productId: string;
  quantity: number;
}

/**
 * Rattachement d'une commande à la campagne qui l'a provoquée. Reconstitué par
 * l'appelant HTTP à partir du cookie d'attribution — jamais depuis la charge
 * utile du formulaire.
 */
export interface CampaignContext {
  campaignId: string;
  recipientId: string | null;
}

/**
 * Vérifie que la campagne et le destinataire cités par le cookie existent
 * réellement, et que le destinataire appartient bien à cette campagne.
 *
 * Sans ce contrôle, un cookie forgé ferait échouer l'écriture de la commande
 * sur la contrainte de clé étrangère : le client perdrait une commande valable
 * à cause d'une donnée purement statistique. Un rattachement introuvable est
 * donc simplement ignoré, la commande passe sans attribution.
 */
async function resolveCampaignAttribution(
  context: CampaignContext,
): Promise<CampaignContext | undefined> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: context.campaignId },
    select: { id: true },
  });
  if (!campaign) return undefined;

  if (!context.recipientId) return { campaignId: campaign.id, recipientId: null };

  const recipient = await prisma.campaignRecipient.findFirst({
    where: { id: context.recipientId, campaignId: campaign.id },
    select: { id: true },
  });

  return { campaignId: campaign.id, recipientId: recipient?.id ?? null };
}

/** Recrédite le stock déjà pris quand la commande échoue en cours de route. */
async function releaseReservations(reserved: ReservedLine[], reference: string): Promise<void> {
  for (const line of reserved) {
    try {
      await adjustStock(
        line.productId,
        line.quantity,
        "korrektur",
        `Rücknahme der Reservierung ${reference}`,
        "system",
      );
    } catch {
      // Une compensation qui échoue ne doit pas masquer l'erreur d'origine ;
      // l'écart reste visible dans l'historique des mouvements.
    }
  }
}

/**
 * Crée une commande à partir d'un panier vérifié en base.
 *
 * Déroulé : lecture des produits → recalcul complet des montants → réservation
 * du stock ligne par ligne (chaque appel à adjustStock est transactionnel et
 * journalisé) → écriture de la commande et de ses lignes en une seule opération.
 * Toute erreur après la réservation libère le stock déjà pris.
 *
 * `customerId` est un paramètre distinct de la charge utile, et non un champ de
 * `CheckoutInput` : il vient exclusivement du cookie de session côté serveur.
 * Le navigateur ne doit jamais pouvoir désigner le compte auquel une commande
 * est rattachée. Sans compte connecté, il reste vide — la commande en tant
 * qu'invité fonctionne exactement comme avant.
 *
 * `campaignContext` suit la même règle : il est reconstitué côté serveur depuis
 * le cookie d'attribution. Il ne fait qu'énoncer une prétention, que cette
 * fonction revalide entièrement — existence de la campagne, période, avantage
 * réellement accordé.
 */
export async function createOrder(
  input: CheckoutInput,
  customerId?: string,
  campaignContext?: CampaignContext,
): Promise<OrderRecord> {
  // 1. Produits réels, actifs uniquement.
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, active: true },
    select: {
      id: true,
      brand: true,
      name: true,
      sku: true,
      slug: true,
      image: true,
      priceCents: true,
      stock: true,
      category: { select: { slug: true, image: true, group: { select: { slug: true } } } },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: CartLine[] = [];
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new OrderError("product_unavailable");
    if (product.stock < item.quantity) {
      throw new OrderError("insufficient_stock", {
        name: `${product.brand} ${product.name}`,
        available: Math.max(0, product.stock),
      });
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      image: product.image || product.category.image,
      path: `/${product.category.group.slug}/${product.category.slug}/${product.slug}`,
      priceCents: product.priceCents,
      quantity: item.quantity,
      stock: product.stock,
    });
  }

  // 2. Prix réellement dus. Le prix catalogue relu ci-dessus repasse par le
  // moteur de promotions : un client qui trafique son localStorage n'y gagne
  // rien, et celui qui commande pendant une campagne paie bien le prix annoncé
  // sans avoir à saisir quoi que ce soit. Les appels partent ensemble, un
  // panier de quarante lignes ne doit pas coûter quarante allers-retours en
  // série.
  const priced = await Promise.all(
    lines.map((line) => priceForOrder(line.productId, line.priceCents)),
  );
  const billed: CartLine[] = lines.map((line, index) => ({
    ...line,
    priceCents: priced[index].priceCents,
  }));

  // 3. Moyen de paiement : seuls ceux réellement activés sont acceptés.
  const methods = await listEnabledPaymentMethods();
  const method = methods.find((entry) => entry.key === input.paymentMethodKey);
  if (!method) throw new OrderError("invalid_payment_method");

  // 4. Attribution marketing et avantage associé. La campagne est retenue dès
  // qu'elle existe — c'est ce qui rend le chiffre d'affaires attribué
  // exploitable —, mais la livraison offerte, elle, n'est accordée que si la
  // campagne l'accorde vraiment et court encore.
  const attribution = campaignContext
    ? await resolveCampaignAttribution(campaignContext)
    : undefined;
  const freeShipping = attribution ? await campaignGrantsFreeShipping(attribution.campaignId) : false;

  // 5. Montants recalculés à partir de la base, jamais depuis le client.
  const totals = computeTotals(billed, { freeShipping });
  const now = new Date();

  // 6. Réservation du stock.
  const reserved: ReservedLine[] = [];
  let orderNumber = await nextOrderNumber();

  try {
    for (const line of billed) {
      const result = await adjustStock(
        line.productId,
        -line.quantity,
        "verkauf",
        `Bestellung ${orderNumber}`,
        "shop",
      );
      if (!result) throw new OrderError("product_unavailable");
      // adjustStock plafonne à 0 : si le stock était insuffisant, la réservation
      // n'est que partielle et la commande doit être refusée.
      if (result.previousStock < line.quantity) {
        reserved.push({ productId: line.productId, quantity: result.previousStock - result.stock });
        throw new OrderError("insufficient_stock", {
          name: `${line.brand} ${line.name}`,
          available: Math.max(0, result.previousStock),
        });
      }
      reserved.push({ productId: line.productId, quantity: line.quantity });
    }

    // 7. Écriture de la commande. La création imbriquée est atomique.
    const accessToken = randomUUID().replace(/-/g, "");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const row = await prisma.order.create({
          data: {
            orderNumber,
            accessToken,
            customerId: customerId ?? null,
            locale: input.locale,
            email: input.email,
            phone: input.phone,
            billingSalutation: input.billing.salutation,
            billingFirstName: input.billing.firstName,
            billingLastName: input.billing.lastName,
            billingCompany: input.billing.company,
            billingStreet: input.billing.street,
            billingPostalCode: input.billing.postalCode,
            billingCity: input.billing.city,
            billingCountry: input.billing.country,
            shippingSameAsBilling: input.shippingSameAsBilling,
            shippingSalutation: input.shipping.salutation,
            shippingFirstName: input.shipping.firstName,
            shippingLastName: input.shipping.lastName,
            shippingCompany: input.shipping.company,
            shippingStreet: input.shipping.street,
            shippingPostalCode: input.shipping.postalCode,
            shippingCity: input.shipping.city,
            shippingCountry: input.shipping.country,
            paymentMethodKey: method.key,
            paymentMethodLabel: method.label,
            paymentMethodFee: method.feeLabel,
            status: "eingegangen",
            paymentStatus: "offen",
            subtotalCents: totals.subtotalCents,
            shippingCents: totals.shippingCents,
            taxCents: totals.taxCents,
            totalCents: totals.totalCents,
            taxRatePercent: VAT_RATE_PERCENT,
            currency: "EUR",
            customerNote: input.customerNote,
            termsAcceptedAt: now,
            withdrawalAcknowledgedAt: now,
            campaignId: attribution?.campaignId ?? null,
            campaignRecipientId: attribution?.recipientId ?? null,
            // Tracé à part du port à zéro, qui peut aussi venir du franco
            // habituel : seule cette colonne dit que c'est la campagne qui a payé.
            campaignFreeShipping: freeShipping,
            items: {
              create: billed.map((line) => ({
                productId: line.productId,
                brand: line.brand,
                name: line.name,
                sku: byId.get(line.productId)?.sku ?? "",
                slug: line.slug,
                image: line.image,
                path: line.path,
                unitPriceCents: line.priceCents,
                quantity: line.quantity,
                lineTotalCents: line.priceCents * line.quantity,
              })),
            },
            events: {
              create: {
                kind: "status",
                toValue: "eingegangen",
                note: `Bestellung im Shop eingegangen (${method.label})`,
                createdBy: "shop",
              },
            },
          },
          include: orderInclude,
        });
        return toRecord(row);
      } catch (error) {
        // Collision sur le numéro : on en reprend un et on réessaie.
        const code = (error as { code?: string }).code;
        if (code !== "P2002" || attempt === 4) throw error;
        orderNumber = await nextOrderNumber();
      }
    }

    throw new OrderError("order_failed");
  } catch (error) {
    await releaseReservations(reserved, orderNumber);
    if (error instanceof OrderError) throw error;
    throw new OrderError("order_failed");
  }
}

// ---- Suivi ----

/**
 * Change le statut de la commande. L'annulation remet la marchandise en stock,
 * une seule fois, via un mouvement « retoure » tracé.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actor?: string,
  note?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, orderNumber: true, stockRestored: true },
  });
  if (!current) return undefined;
  if (current.status === status) return getOrder(id);

  let stockRestored = current.stockRestored;

  if (status === "storniert" && !current.stockRestored) {
    const items = await prisma.orderItem.findMany({
      where: { orderId: id, productId: { not: null } },
      select: { productId: true, quantity: true },
    });
    for (const item of items) {
      if (!item.productId) continue;
      try {
        await adjustStock(
          item.productId,
          item.quantity,
          "retoure",
          `Stornierung ${current.orderNumber}`,
          actor ?? "admin",
        );
      } catch {
        // Un produit supprimé entre-temps ne doit pas bloquer l'annulation.
      }
    }
    stockRestored = true;
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      stockRestored,
      shippedAt: status === "versandt" ? new Date() : undefined,
      events: {
        create: {
          kind: "status",
          fromValue: current.status,
          toValue: status,
          note: note?.trim() ?? "",
          createdBy: actor ?? null,
        },
      },
    },
  });

  return getOrder(id);
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  actor?: string,
  note?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({
    where: { id },
    select: { id: true, paymentStatus: true },
  });
  if (!current) return undefined;
  if (current.paymentStatus === paymentStatus) return getOrder(id);

  await prisma.order.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "bezahlt" ? new Date() : undefined,
      events: {
        create: {
          kind: "payment",
          fromValue: current.paymentStatus,
          toValue: paymentStatus,
          note: note?.trim() ?? "",
          createdBy: actor ?? null,
        },
      },
    },
  });

  return getOrder(id);
}

export async function updateAdminNote(
  id: string,
  adminNote: string,
  actor?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!current) return undefined;

  await prisma.order.update({
    where: { id },
    data: {
      adminNote: adminNote.trim().slice(0, 2000),
      events: {
        create: { kind: "note", note: "Note interne mise à jour", createdBy: actor ?? null },
      },
    },
  });

  return getOrder(id);
}

/** Suppression réservée aux commandes de test du back-office. */
export async function deleteOrder(id: string): Promise<boolean> {
  const current = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!current) return false;
  await prisma.order.delete({ where: { id } });
  return true;
}
