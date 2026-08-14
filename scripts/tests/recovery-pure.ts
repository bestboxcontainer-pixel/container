import assert from "node:assert/strict";
import {
  RECOVERY_MAIL_COUNT,
  availabilityLabel,
  categoryPathFromProductPath,
  conditionLabel,
  decodeCart,
  encodeCart,
  nextSendAtFor,
  normalizeEmail,
  type RecoveryLine,
} from "../../src/lib/checkoutRecovery";

// Base de temps fixe : un test qui dépend de l'heure courante finit par échouer
// une nuit de changement d'heure.
const T0 = new Date("2026-07-26T10:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function line(overrides: Partial<RecoveryLine> = {}): RecoveryLine {
  return {
    productId: "prod-1",
    brand: "Siemens",
    name: "Kaffeevollautomat EQ.500",
    image: "https://res.cloudinary.com/demo/eq500.jpg",
    path: "haushalt/kaffeemaschinen/siemens-eq-500",
    unitPriceCents: 64900,
    quantity: 1,
    stock: 12,
    lowStockThreshold: 5,
    condition: "new",
    ...overrides,
  };
}

// ---- Calendrier ----

assert.equal(RECOVERY_MAIL_COUNT, 4);

// Les délais sont relatifs au message précédent, pas cumulés depuis la capture :
// 10 min après l'abandon, puis 24 h après le premier message, etc.
assert.deepEqual(nextSendAtFor(0, T0), new Date(T0.getTime() + 10 * MINUTE));
assert.deepEqual(nextSendAtFor(1, T0), new Date(T0.getTime() + 24 * HOUR));
assert.deepEqual(nextSendAtFor(2, T0), new Date(T0.getTime() + 3 * DAY));
assert.deepEqual(nextSendAtFor(3, T0), new Date(T0.getTime() + 7 * DAY));

// Après le quatrième message la séquence est terminée : plus aucune date.
assert.equal(nextSendAtFor(4, T0), null);
assert.equal(nextSendAtFor(9, T0), null);

// ---- Disponibilité ----

assert.equal(availabilityLabel(line({ stock: 12 })), "Auf Lager");
assert.equal(availabilityLabel(line({ stock: 5 })), "Nur noch 5 verfügbar");
assert.equal(availabilityLabel(line({ stock: 2 })), "Nur noch 2 verfügbar");
assert.equal(availabilityLabel(line({ stock: 1 })), "Nur noch 1 verfügbar");
assert.equal(availabilityLabel(line({ stock: 0 })), "Derzeit nicht verfügbar");
// Un stock négatif est une incohérence de base : il ne doit jamais annoncer
// « disponible » dans un message commercial.
assert.equal(availabilityLabel(line({ stock: -3 })), "Derzeit nicht verfügbar");

// ---- État ----

assert.equal(conditionLabel("new"), "Neuware");
assert.equal(conditionLabel("refurbished"), "Generalüberholt");
assert.equal(conditionLabel("used"), "Gebraucht");
// Valeur inconnue : on retombe sur le neuf, qui est le défaut du catalogue.
assert.equal(conditionLabel("was-auch-immer"), "Neuware");

// ---- Normalisation de l'adresse ----

assert.equal(normalizeEmail("  Max.Mustermann@GMX.DE  "), "max.mustermann@gmx.de");
assert.equal(normalizeEmail("Anna@Example.Com"), "anna@example.com");

// ---- Encodage du panier ----

const lines = [line(), line({ productId: "prod-2", quantity: 3, name: "Waschmaschine WM14" })];
const decoded = decodeCart(encodeCart(lines));
assert.deepEqual(decoded, lines);

// Une chaîne illisible ne doit pas faire tomber le répartiteur : un panier
// vide vaut mieux qu'un tick interrompu pour toutes les autres lignes.
assert.deepEqual(decodeCart("{ pas du json"), []);
assert.deepEqual(decodeCart("[]"), []);
// Un tableau d'objets incomplets est écarté ligne par ligne.
assert.deepEqual(decodeCart('[{"brand":"Bosch"}]'), []);

// ---- Chemin de la catégorie ----

assert.equal(
  categoryPathFromProductPath("haushalt/kaffeemaschinen/siemens-eq-500"),
  "/haushalt/kaffeemaschinen",
);
assert.equal(categoryPathFromProductPath("/haushalt/kaffeemaschinen/x"), "/haushalt/kaffeemaschinen");
// Chemin inutilisable : on renvoie l'accueil plutôt qu'une URL cassée.
assert.equal(categoryPathFromProductPath("produkt"), "/");
assert.equal(categoryPathFromProductPath(""), "/");

console.log("recovery-pure : toutes les assertions passent");
