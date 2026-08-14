/**
 * Relance des tunnels de commande abandonnés — accès aux données.
 *
 * Ce module est le seul à parler à Prisma pour cette fonctionnalité. Les
 * calculs qui n'ont pas besoin de la base vivent dans
 * src/lib/checkoutRecovery.ts, importable par le back-office et par les
 * scripts. C'est la même séparation qu'entre src/lib/cart.ts et
 * src/server/orders.ts.
 */

import { randomBytes } from "node:crypto";
import { computeTotals } from "@/lib/cart";
import {
  encodeCart,
  nextSendAtFor,
  normalizeEmail,
  type RecoveryLine,
  type RecoveryStep,
  type RecoveryStoppedReason,
} from "@/lib/checkoutRecovery";
import { prisma } from "@/server/prisma";

/** Longueur du jeton de reprise, en octets avant encodage hexadécimal. */
const RESUME_TOKEN_BYTES = 32;

export interface CaptureInput {
  email: string;
  locale: string;
  step: RecoveryStep;
  /** Seules données reprises du navigateur : quoi et combien. */
  lines: { productId: string; quantity: number }[];
}

/**
 * Relit les produits en base et compose les lignes figées du panier.
 *
 * Le navigateur n'envoie que des identifiants et des quantités : prix, libellés,
 * images et stocks viennent de la base, comme dans POST /api/checkout. Sinon un
 * visiteur pourrait se faire envoyer un message annonçant un prix qu'il a
 * choisi lui-même.
 */
async function buildLines(input: CaptureInput["lines"]): Promise<RecoveryLine[]> {
  const ids = [...new Set(input.map((line) => line.productId))];
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: { category: { include: { group: true } } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: RecoveryLine[] = [];
  for (const requested of input) {
    const product = byId.get(requested.productId);
    if (!product) continue;
    const quantity = Math.min(Math.max(Math.trunc(requested.quantity), 1), 20);
    lines.push({
      productId: product.id,
      brand: product.brand,
      name: product.name,
      image: product.image ?? "",
      path: `${product.category.group.slug}/${product.category.slug}/${product.slug}`,
      unitPriceCents: product.priceCents,
      quantity,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      condition: product.condition,
    });
  }
  return lines;
}

/** Totaux d'un panier figé, avec le mode de livraison standard par défaut. */
function totalsFor(lines: RecoveryLine[]) {
  return computeTotals(
    lines.map((line) => ({
      productId: line.productId,
      slug: "",
      brand: line.brand,
      name: line.name,
      image: line.image,
      path: line.path,
      priceCents: line.unitPriceCents,
      quantity: line.quantity,
      stock: line.stock,
    })),
  );
}

/**
 * Enregistre ou rafraîchit la session de récupération.
 *
 * Trois cas, et trois seulement :
 *   1. aucune ligne          -> création, premier message dans dix minutes ;
 *   2. ligne active          -> panier, montants et étape rafraîchis. La date
 *      du prochain envoi n'est repoussée que si aucun message n'est encore
 *      parti : quelqu'un qui revient et repart ne doit pas recommencer la
 *      séquence depuis le début ;
 *   3. ligne stoppée         -> rien. Une séquence convertie, terminée ou
 *      désabonnée ne se relance jamais.
 */
export async function captureRecovery(input: CaptureInput): Promise<void> {
  const email = input.email.trim();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized) return;

  // Refus définitif : vérifié avant toute écriture, y compris avant la lecture
  // des produits, pour ne rien faire d'inutile.
  const suppressed = await prisma.emailSuppression.findUnique({ where: { email: emailNormalized } });
  if (suppressed) return;

  const lines = await buildLines(input.lines);
  if (lines.length === 0) return;

  const totals = totalsFor(lines);
  const now = new Date();

  const existing = await prisma.checkoutRecovery.findUnique({ where: { emailNormalized } });

  if (existing?.stoppedAt) return;

  const snapshot = {
    email,
    locale: input.locale === "en" ? "en" : "de",
    cartJson: encodeCart(lines),
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    lastStep: input.step,
  };

  if (!existing) {
    await prisma.checkoutRecovery.create({
      data: {
        ...snapshot,
        emailNormalized,
        resumeToken: randomBytes(RESUME_TOKEN_BYTES).toString("hex"),
        nextSendAt: nextSendAtFor(0, now),
      },
    });
    return;
  }

  await prisma.checkoutRecovery.update({
    where: { id: existing.id },
    data: {
      ...snapshot,
      // Le jeton reste inchangé : un lien déjà parti dans un message doit
      // continuer de fonctionner.
      nextSendAt: existing.sentCount === 0 ? nextSendAtFor(0, now) : existing.nextSendAt,
    },
  });
}

/**
 * Arrête la séquence d'une adresse. Passe par updateMany : la plupart des
 * commandes n'ont aucune session de récupération, et un update sur une ligne
 * absente lèverait une erreur au beau milieu d'une commande payante.
 */
export async function stopRecoveryForEmail(
  email: string,
  reason: RecoveryStoppedReason,
): Promise<void> {
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized) return;

  await prisma.checkoutRecovery.updateMany({
    where: { emailNormalized, stoppedAt: null },
    data: { stoppedReason: reason, stoppedAt: new Date(), nextSendAt: null, claimedAt: null },
  });
}

/** Session désignée par le jeton d'un message. */
export async function findRecoveryByToken(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return prisma.checkoutRecovery.findUnique({ where: { resumeToken: token } });
}
