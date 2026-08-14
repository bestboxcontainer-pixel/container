import assert from "node:assert/strict";
import { prisma } from "../../src/server/prisma";
import {
  captureRecovery,
  runRecoveryTick,
  stopRecoveryForEmail,
} from "../../src/server/checkoutRecovery";
import { decodeCart, normalizeEmail } from "../../src/lib/checkoutRecovery";

const EMAIL = "test-relance@example.invalid";
const NORMALIZED = normalizeEmail(EMAIL);

/** Efface les traces du test précédent : le script doit pouvoir tourner deux fois. */
async function cleanup(): Promise<void> {
  await prisma.checkoutRecovery.deleteMany({ where: { emailNormalized: NORMALIZED } });
  await prisma.emailSuppression.deleteMany({ where: { email: NORMALIZED } });
}

async function main(): Promise<void> {
  await cleanup();

  // Un produit réel du catalogue : la capture relit la base, un identifiant
  // inventé ne produirait aucune ligne.
  const product = await prisma.product.findFirst({ where: { active: true } });
  assert.ok(product, "aucun produit actif en base : lancer npm run db:seed d'abord");

  // ---- Création ----

  await captureRecovery({
    email: `  ${EMAIL.toUpperCase()}  `,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 2 }],
  });

  const created = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(created, "aucune ligne créée par la capture");
  // L'adresse est stockée dans les deux formes : brute pour l'envoi, normalisée
  // pour les rapprochements.
  assert.equal(created.emailNormalized, NORMALIZED);
  assert.equal(created.sentCount, 0);
  assert.equal(created.lastStep, "contact");
  assert.ok(created.nextSendAt, "nextSendAt non programmé");
  // Le premier message est dû dans dix minutes, à quelques secondes près.
  const delay = created.nextSendAt.getTime() - created.createdAt.getTime();
  assert.ok(delay > 9 * 60_000 && delay < 11 * 60_000, `délai inattendu : ${delay} ms`);
  // Le jeton circule en clair dans le message : 64 caractères hexadécimaux.
  assert.match(created.resumeToken, /^[0-9a-f]{64}$/);

  // Les prix viennent de la base, jamais du navigateur.
  const lines = decodeCart(created.cartJson);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].unitPriceCents, product.priceCents);
  assert.equal(lines[0].quantity, 2);
  assert.equal(created.subtotalCents, product.priceCents * 2);

  // ---- Mise à jour d'une ligne active ----

  const firstToken = created.resumeToken;
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "payment",
    lines: [{ productId: product.id, quantity: 1 }],
  });

  const updated = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(updated);
  assert.equal(updated.lastStep, "payment", "l'étape n'a pas été mise à jour");
  assert.equal(updated.subtotalCents, product.priceCents, "les montants n'ont pas été rafraîchis");
  // Le jeton ne change pas : un lien déjà parti dans un message doit continuer
  // de fonctionner.
  assert.equal(updated.resumeToken, firstToken, "le jeton de reprise a changé");

  // ---- Une ligne stoppée n'est jamais relancée ----

  await stopRecoveryForEmail(EMAIL, "converted");
  const stopped = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(stopped);
  assert.equal(stopped.stoppedReason, "converted");
  assert.equal(stopped.nextSendAt, null);

  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 5 }],
  });
  const afterStop = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(afterStop);
  assert.equal(afterStop.stoppedReason, "converted", "une séquence stoppée a été réactivée");
  assert.equal(afterStop.nextSendAt, null, "une séquence stoppée a été reprogrammée");

  // ---- Un email désabonné n'est jamais capturé ----

  await cleanup();
  await prisma.emailSuppression.create({
    data: { email: NORMALIZED, reason: "desinscription" },
  });
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 1 }],
  });
  const suppressed = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.equal(suppressed, null, "une adresse désabonnée a été capturée");

  // ---- Répartiteur ----

  await cleanup();
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 1 }],
  });

  // Rien n'est dû dans l'immédiat : le premier message est à dix minutes.
  const idle = await runRecoveryTick({ dryRun: true });
  assert.equal(idle.sent, 0, "un message est parti avant l'heure");

  // On avance l'échéance à la main, comme le fera le test manuel.
  async function makeDue(): Promise<void> {
    await prisma.checkoutRecovery.updateMany({
      where: { emailNormalized: NORMALIZED },
      data: { nextSendAt: new Date(Date.now() - 1_000), claimedAt: null },
    });
  }

  // Les quatre messages partent l'un après l'autre, jamais deux au même tick.
  for (const expected of [1, 2, 3, 4]) {
    await makeDue();
    const result = await runRecoveryTick({ dryRun: true });
    assert.equal(result.sent, 1, `le tick n'a pas envoyé le message ${expected}`);
    const row = await prisma.checkoutRecovery.findUnique({
      where: { emailNormalized: NORMALIZED },
    });
    assert.ok(row);
    assert.equal(row.sentCount, expected, `sentCount incorrect après le message ${expected}`);
    assert.equal(row.claimedAt, null, "le verrou n'a pas été relâché");
    assert.ok(row.lastSentAt, "lastSentAt non renseigné");
  }

  // Après le quatrième, la séquence est terminée et ne repart pas.
  const finished = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(finished);
  assert.equal(finished.sentCount, 4);
  assert.equal(finished.stoppedReason, "completed");
  assert.equal(finished.nextSendAt, null);

  await makeDue();
  const afterEnd = await runRecoveryTick({ dryRun: true });
  assert.equal(afterEnd.sent, 0, "un cinquième message est parti");

  // ---- Une commande arrête la séquence ----

  await cleanup();
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "review",
    lines: [{ productId: product.id, quantity: 1 }],
  });
  await stopRecoveryForEmail(EMAIL, "converted");
  await makeDue();
  const converted = await runRecoveryTick({ dryRun: true });
  assert.equal(converted.sent, 0, "un message est parti après la commande");

  // ---- Un désabonnement arrête la séquence, même échéance atteinte ----

  await cleanup();
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 1 }],
  });
  await prisma.emailSuppression.create({
    data: { email: NORMALIZED, reason: "desinscription" },
  });
  await makeDue();
  const unsubscribed = await runRecoveryTick({ dryRun: true });
  assert.equal(unsubscribed.sent, 0, "un message est parti vers une adresse désabonnée");
  const stoppedRow = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(stoppedRow);
  assert.equal(stoppedRow.stoppedReason, "unsubscribed");

  await cleanup();
  console.log("recovery-flow : capture conforme");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
