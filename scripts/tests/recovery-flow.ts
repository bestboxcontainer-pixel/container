import assert from "node:assert/strict";
import { prisma } from "../../src/server/prisma";
import { captureRecovery, stopRecoveryForEmail } from "../../src/server/checkoutRecovery";
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

  await cleanup();
  console.log("recovery-flow : capture conforme");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
