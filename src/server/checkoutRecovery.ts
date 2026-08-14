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
  decodeCart,
  encodeCart,
  MAX_SEND_ATTEMPTS,
  nextSendAtFor,
  normalizeEmail,
  RECOVERY_BATCH_SIZE,
  RECOVERY_CLAIM_TIMEOUT_MS,
  RECOVERY_ENABLED_SETTING,
  RECOVERY_RETENTION_DAYS,
  RECOVERY_RETRY_DELAY_MS,
  RECOVERY_SEND_SPACING_MS,
  type RecoveryLine,
  type RecoveryStep,
  type RecoveryStoppedReason,
} from "@/lib/checkoutRecovery";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { recoveryMail } from "@/server/emails/checkoutRecovery";
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

// ---- Interrupteur global ----

/**
 * Coupe-circuit lu à chaque tick. Il vit en base et non dans une variable
 * d'environnement : le jour où il faut arrêter les envois, il faut pouvoir le
 * faire depuis le back-office, sans redéploiement.
 */
export async function isRecoveryEnabled(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: RECOVERY_ENABLED_SETTING } });
  // Absent = activé : la fonctionnalité est en service dès l'installation.
  return setting?.value !== "false";
}

export async function setRecoveryEnabled(enabled: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: RECOVERY_ENABLED_SETTING },
    create: { key: RECOVERY_ENABLED_SETTING, value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" },
  });
}

// ---- Répartiteur ----

export interface TickResult {
  sent: number;
  skipped: number;
  failed: number;
  purged: number;
}

/** Avertissement d'absence de configuration : une seule fois par processus. */
let mailWarningShown = false;

/**
 * Rafraîchit les lignes figées depuis le catalogue.
 *
 * Prix, stock, image et nom sont ceux du jour de l'envoi. Annoncer l'ancien
 * prix d'un article qui a augmenté serait trompeur : le tunnel facturerait le
 * nouveau. Un article retiré du catalogue retombe sur les valeurs figées avec
 * un stock à zéro, donc « Derzeit nicht verfügbar ».
 */
async function refreshLines(lines: RecoveryLine[]): Promise<RecoveryLine[]> {
  const ids = lines.map((line) => line.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    select: {
      id: true,
      brand: true,
      name: true,
      image: true,
      priceCents: true,
      stock: true,
      lowStockThreshold: true,
      condition: true,
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  return lines.map((line) => {
    const fresh = byId.get(line.productId);
    if (!fresh) return { ...line, stock: 0 };
    return {
      ...line,
      brand: fresh.brand,
      name: fresh.name,
      image: fresh.image ?? line.image,
      unitPriceCents: fresh.priceCents,
      stock: fresh.stock,
      lowStockThreshold: fresh.lowStockThreshold,
      condition: fresh.condition,
    };
  });
}

/**
 * Un passage du répartiteur.
 *
 * Appelé toutes les soixante secondes par le planificateur, et à la demande par
 * la route protégée. `dryRun` compose les messages sans les envoyer : c'est ce
 * qui permet de vérifier la machine à états sans configuration SMTP.
 */
export async function runRecoveryTick(
  options: { now?: Date; dryRun?: boolean } = {},
): Promise<TickResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const result: TickResult = { sent: 0, skipped: 0, failed: 0, purged: 0 };

  if (!(await isRecoveryEnabled())) return result;

  // Sans configuration d'envoi, on ne touche à rien : consommer la séquence
  // parce que le SMTP manque en local reviendrait à perdre les relances.
  if (!dryRun && !isMailConfigured()) {
    if (!mailWarningShown) {
      console.warn(
        "[recovery] SMTP_HOST, SMTP_USER ou SMTP_PASSWORD manquant : les relances ne partent pas.",
      );
      mailWarningShown = true;
    }
    return result;
  }

  const staleClaim = new Date(now.getTime() - RECOVERY_CLAIM_TIMEOUT_MS);

  const due = await prisma.checkoutRecovery.findMany({
    where: {
      stoppedAt: null,
      nextSendAt: { lte: now },
      OR: [{ claimedAt: null }, { claimedAt: { lt: staleClaim } }],
    },
    orderBy: { nextSendAt: "asc" },
    take: RECOVERY_BATCH_SIZE,
  });

  for (const row of due) {
    // Verrou : conditionné sur l'état lu, donc si un autre tick a pris la ligne
    // entre-temps, le compte de lignes modifiées vaut zéro et on passe.
    const claimed = await prisma.checkoutRecovery.updateMany({
      where: {
        id: row.id,
        stoppedAt: null,
        OR: [{ claimedAt: null }, { claimedAt: { lt: staleClaim } }],
      },
      data: { claimedAt: now },
    });
    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }

    // Refus définitif enregistré depuis la lecture.
    const suppressed = await prisma.emailSuppression.findUnique({
      where: { email: row.emailNormalized },
    });
    if (suppressed) {
      await stopRecovery(row.id, "unsubscribed");
      result.skipped += 1;
      continue;
    }

    // Commande passée entre-temps. Correspondance exacte : Order.email est
    // archivé tel que saisi. L'arrêt qui fait autorité est le crochet de
    // createOrder ; ceci n'est qu'un filet.
    const order = await prisma.order.findFirst({
      where: { email: row.email },
      select: { id: true },
    });
    if (order) {
      await stopRecovery(row.id, "converted");
      result.skipped += 1;
      continue;
    }

    const lines = await refreshLines(decodeCart(row.cartJson));
    if (lines.length === 0) {
      // Panier illisible ou entièrement vidé du catalogue : plus rien à
      // relancer, et un message sans produit n'a aucun sens.
      await stopRecovery(row.id, "failed");
      result.skipped += 1;
      continue;
    }

    const rank = (row.sentCount + 1) as 1 | 2 | 3 | 4;
    const message = recoveryMail({
      rank,
      lines,
      totalCents: row.totalCents,
      resumeToken: row.resumeToken,
    });

    try {
      if (!dryRun) {
        await sendMail({ ...message, to: row.email });
      }
      const sentCount = row.sentCount + 1;
      const next = nextSendAtFor(sentCount, now);
      await prisma.checkoutRecovery.update({
        where: { id: row.id },
        data: {
          sentCount,
          lastSentAt: now,
          nextSendAt: next,
          sendAttempts: 0,
          claimedAt: null,
          ...(next === null ? { stoppedReason: "completed", stoppedAt: now } : {}),
        },
      });
      result.sent += 1;
    } catch (error) {
      const attempts = row.sendAttempts + 1;
      if (attempts >= MAX_SEND_ATTEMPTS) {
        console.error(`[recovery] abandon de ${row.emailNormalized} après ${attempts} échecs:`, error);
        await stopRecovery(row.id, "failed");
        result.failed += 1;
      } else {
        console.error(`[recovery] échec d'envoi vers ${row.emailNormalized}, report:`, error);
        await prisma.checkoutRecovery.update({
          where: { id: row.id },
          data: {
            sendAttempts: attempts,
            nextSendAt: new Date(now.getTime() + RECOVERY_RETRY_DELAY_MS),
            claimedAt: null,
          },
        });
        result.failed += 1;
      }
    }

    if (!dryRun && due.length > 1) {
      // Le serveur SMTP n'apprécie pas les rafales : un envoi toutes les 250 ms.
      await new Promise((resolve) => setTimeout(resolve, RECOVERY_SEND_SPACING_MS));
    }
  }

  result.purged = await purgeOldRecoveries(now);
  return result;
}

async function stopRecovery(id: string, reason: RecoveryStoppedReason): Promise<void> {
  await prisma.checkoutRecovery.update({
    where: { id },
    data: { stoppedReason: reason, stoppedAt: new Date(), nextSendAt: null, claimedAt: null },
  });
}

/**
 * Minimisation des données : une adresse sans commande n'a aucune raison
 * d'être conservée plus de trente jours. EmailSuppression, lui, n'est jamais
 * purgé — c'est la preuve du refus.
 */
async function purgeOldRecoveries(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - RECOVERY_RETENTION_DAYS * 24 * 60 * 60_000);
  const deleted = await prisma.checkoutRecovery.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return deleted.count;
}
