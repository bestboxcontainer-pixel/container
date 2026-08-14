import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { recoveryMail, resumeUrl, unsubscribeUrl } from "../../src/server/emails/checkoutRecovery";
import type { RecoveryLine } from "../../src/lib/checkoutRecovery";

const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

const LINES: RecoveryLine[] = [
  {
    productId: "prod-1",
    brand: "Siemens",
    name: "Kaffeevollautomat EQ.500 integral",
    image: "https://res.cloudinary.com/demo/image/upload/eq500.jpg",
    path: "haushalt/kaffeemaschinen/siemens-eq-500-integral",
    unitPriceCents: 64900,
    quantity: 1,
    stock: 3,
    lowStockThreshold: 5,
    condition: "new",
  },
  {
    productId: "prod-2",
    brand: "Bosch",
    name: "Waschmaschine Serie 6 WGG244A20",
    image: "https://res.cloudinary.com/demo/image/upload/wgg244.jpg",
    path: "haushalt/waschmaschinen/bosch-serie-6-wgg244a20",
    unitPriceCents: 54900,
    quantity: 2,
    stock: 40,
    lowStockThreshold: 5,
    condition: "refurbished",
  },
];

const OUT = join(process.cwd(), ".next", "cache", "recovery-preview");
mkdirSync(OUT, { recursive: true });

const SUBJECTS = [
  "Brauchen Sie Hilfe bei Ihrer Bestellung?",
  "Ihr Gerät ist noch für Sie verfügbar",
  "Noch Fragen zu Ihrem Gerät?",
  "Wir sind weiterhin für Sie da",
];

for (const rank of [1, 2, 3, 4] as const) {
  const mail = recoveryMail({ rank, lines: LINES, totalCents: 174_700, resumeToken: TOKEN });

  // Objet exact, repris de la spec.
  assert.equal(mail.subject, SUBJECTS[rank - 1], `objet du message ${rank}`);

  // Le message porte le produit : image, marque, nom, prix.
  assert.ok(mail.html.includes("eq500.jpg"), `image produit absente du message ${rank}`);
  assert.ok(mail.html.includes("Siemens"), `marque absente du message ${rank}`);
  assert.ok(mail.html.includes("649,00"), `prix absent du message ${rank}`);

  // Disponibilité et état, calculés depuis le stock fourni.
  assert.ok(mail.html.includes("Nur noch 3 verfügbar"), `disponibilité absente du message ${rank}`);
  assert.ok(mail.html.includes("Generalüberholt"), `état absent du message ${rank}`);

  // Le bouton de reprise, sauf le quatrième message : son bouton pointe vers
  // la catégorie (« weitere Geräte »), vérifié séparément plus bas.
  if (rank !== 4) {
    assert.ok(mail.html.includes(resumeUrl(TOKEN)), `lien de reprise absent du message ${rank}`);
  }
  assert.ok(mail.html.includes("/kontakt"), `lien contact absent du message ${rank}`);

  // Le lien de désabonnement, dans les quatre messages sans exception.
  assert.ok(
    mail.html.includes(unsubscribeUrl(TOKEN)),
    `lien de désabonnement absent du message ${rank}`,
  );
  assert.ok(
    mail.html.includes("Keine Erinnerungen mehr erhalten"),
    `libellé de désabonnement absent du message ${rank}`,
  );

  // En-têtes exigés par Gmail et Yahoo depuis 2024 pour les envois
  // automatisés : sans eux, les messages partent en indésirables.
  assert.equal(mail.headers?.["List-Unsubscribe"], `<${unsubscribeUrl(TOKEN)}>`);
  assert.equal(mail.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");

  // Version texte non vide : un message sans partie texte est pénalisé par les
  // filtres, et illisible pour qui coupe le HTML.
  assert.ok(mail.text.trim().length > 80, `version texte trop courte pour le message ${rank}`);

  // Aucun emoji, nulle part.
  assert.ok(
    !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(mail.html),
    `emoji détecté dans le message ${rank}`,
  );

  writeFileSync(join(OUT, `mail-${rank}.html`), mail.html, "utf8");
}

// Le deuxième message annonce le standard gratuit sans montant minimum, comme
// src/lib/cart.ts (SHIPPING_METHODS[0].cents === 0, sans seuil) : aucun montant
// à interpoler, mais la mention doit rester présente.
const second = recoveryMail({ rank: 2, lines: LINES, totalCents: 174_700, resumeToken: TOKEN });
assert.ok(
  second.html.includes("Standardversand ist bei uns immer kostenlos"),
  "mention du standard gratuit absente du deuxième message",
);

// Le quatrième message renvoie vers la catégorie du premier article.
const fourth = recoveryMail({ rank: 4, lines: LINES, totalCents: 174_700, resumeToken: TOKEN });
assert.ok(
  fourth.html.includes("/haushalt/kaffeemaschinen"),
  "lien catégorie absent du quatrième message",
);

// Panier de plus de trois lignes : les suivantes sont résumées.
const many: RecoveryLine[] = [
  LINES[0],
  { ...LINES[1], productId: "p2" },
  { ...LINES[1], productId: "p3" },
  { ...LINES[1], productId: "p4" },
  { ...LINES[1], productId: "p5" },
];
const crowded = recoveryMail({ rank: 1, lines: many, totalCents: 300_000, resumeToken: TOKEN });
assert.ok(crowded.html.includes("und 2 weitere Artikel"), "résumé des lignes surnuméraires absent");

// Panier vide : aucun message ne doit être fabriqué, l'appelant doit être
// prévenu plutôt que d'envoyer une coquille vide.
assert.throws(
  () => recoveryMail({ rank: 1, lines: [], totalCents: 0, resumeToken: TOKEN }),
  /panier vide/,
);

console.log(`recovery-mails : quatre aperçus écrits dans ${OUT}`);
