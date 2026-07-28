# Warenkorb-Erinnerungen — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Envoyer automatiquement quatre e-mails allemands aux visiteurs qui saisissent leur adresse dans le tunnel de commande sans le terminer, avec reprise du paiement en un clic, arrêt sur commande et désabonnement définitif.

**Architecture:** L'étape « contact » du tunnel poste le panier vers une route qui relit les produits en base et enregistre une ligne `CheckoutRecovery`. Un `setInterval` de 60 s démarré par `src/instrumentation.ts` appelle un répartiteur qui prend les lignes échues, pose un verrou, rafraîchit les données produit, envoie le message via Resend et programme le suivant. La logique sans base de données est isolée dans `src/lib/checkoutRecovery.ts` ; `src/server/checkoutRecovery.ts` porte tout ce qui touche Prisma.

**Tech Stack:** Next.js 16 (App Router, React 19, TypeScript strict), Prisma 7 (SQLite en local, PostgreSQL en production), Resend via `fetch`, next-intl, Tailwind v4, `tsx` pour les scripts de test.

**Spec de référence :** `docs/superpowers/specs/2026-07-26-warenkorb-erinnerungen-design.md`

## Global Constraints

- **Ce n'est pas le Next.js d'avant.** Avant d'écrire du code touchant une convention de fichier (`instrumentation`, `route.ts`, `searchParams`, `params`), lire le guide correspondant dans `node_modules/next/dist/docs/01-app/`. `params` et `searchParams` sont des `Promise` dans cette version.
- **Schéma Prisma :** aucun `enum` Prisma, aucune liste scalaire. Les états sont des `String` commentés, les listes sont du JSON dans un `String`. Le même schéma doit fonctionner à l'identique sous SQLite et sous PostgreSQL.
- **Montants :** toujours en centimes, toujours TTC. `taxCents` est la TVA *contenue* dans le total.
- **Commentaires de code en français.** Ils expliquent le *pourquoi*, pas le *quoi* — c'est le registre de tout le dépôt.
- **Contenu des messages en allemand**, repris mot pour mot depuis la section « Les quatre e-mails » de la spec. Aucun texte inventé, aucun placeholder.
- **Zéro emoji** dans le code, les commentaires, les messages et l'interface.
- **TypeScript strict, pas de `any`.** Exports nommés, composants en PascalCase, utilitaires en camelCase.
- **Tailwind pour l'interface, jamais de style en ligne.** Exception unique et obligatoire : les gabarits d'e-mail, où les styles en ligne et les tableaux sont la seule mise en page que les clients de messagerie respectent.
- **Le seuil de franco de port ne s'écrit jamais en dur** : il vient de `FREE_SHIPPING_THRESHOLD_CENTS` dans `src/lib/cart.ts`.
- **Les scripts de test s'exécutent avec `npx tsx`** et importent en chemins relatifs depuis `scripts/`, comme `scripts/enrich-merchant-data.ts`. Ils tournent sur `dev.db` et doivent nettoyer leurs données.
- **Commit après chaque tâche**, message en français, à l'impératif.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `prisma/schema.prisma` | modèle `CheckoutRecovery` (modifié) |
| `src/lib/checkoutRecovery.ts` | délais, libellés, encodage du panier, URL. Aucun import de Prisma ni de React |
| `src/server/checkoutRecovery.ts` | capture, répartiteur, verrou, purge, statistiques. Tout Prisma |
| `src/server/emails/checkoutRecovery.ts` | les quatre gabarits allemands et le bloc produit |
| `src/server/recoveryRate.ts` | limiteur par adresse IP de la route de capture |
| `src/server/scheduler.ts` | registre des tâches périodiques |
| `src/instrumentation.ts` | démarre le registre au lancement du serveur |
| `src/app/api/checkout/recovery/route.ts` | capture de la session |
| `src/app/api/cron/recovery/route.ts` | déclenchement manuel protégé par secret |
| `src/app/api/abmeldung/route.ts` | enregistrement du désabonnement |
| `src/app/[locale]/abmeldung/page.tsx` | page de confirmation du désabonnement |
| `src/app/admin/(protected)/warenkorb-erinnerungen/page.tsx` | suivi back-office |
| `src/components/admin/RecoveryTable.tsx` | tableau, interrupteur, arrêt d'une séquence |
| `src/app/api/admin/recovery/route.ts` | actions du back-office |
| `src/lib/mailer.ts` | ajout du paramètre `headers` (modifié) |
| `src/server/emails/customerAccount.ts` | `layout()` et `escapeHtml()` exportés, lien de désabonnement (modifié) |
| `src/content/legal/de.ts`, `en.ts` | section Datenschutz sur les relances (modifié) |
| `src/components/checkout/CheckoutFlow.tsx` | capture aux deux transitions, restauration (modifié) |
| `src/app/[locale]/kasse/page.tsx` | lecture du jeton de reprise (modifié) |
| `src/server/orders.ts` | arrêt de la séquence à la création de commande (modifié) |
| `src/components/admin/AdminSidebar.tsx` | entrée de navigation (modifié) |
| `scripts/tests/recovery-pure.ts` | tests du module pur |
| `scripts/tests/recovery-mails.ts` | rendu des quatre messages + aperçus HTML |
| `scripts/tests/recovery-flow.ts` | machine à états du répartiteur, sur `dev.db` |

---

### Task 1 : Modèle de données et module pur

**Files:**
- Modify: `prisma/schema.prisma` (fin du fichier)
- Create: `src/lib/checkoutRecovery.ts`
- Create: `scripts/tests/recovery-pure.ts`
- Modify: `package.json` (script `test:recovery`)

**Interfaces:**
- Consumes: rien.
- Produces: `RecoveryLine`, `RecoveryStep`, `RecoveryStoppedReason`, `nextSendAtFor(sentCount: number, from: Date): Date | null`, `availabilityLabel(line: RecoveryLine): string`, `conditionLabel(condition: string): string`, `normalizeEmail(email: string): string`, `encodeCart(lines: RecoveryLine[]): string`, `decodeCart(json: string): RecoveryLine[]`, `categoryPathFromProductPath(path: string): string`, et les constantes `RECOVERY_DELAYS_MS`, `RECOVERY_MAIL_COUNT`, `MAX_SEND_ATTEMPTS`, `RECOVERY_RETENTION_DAYS`, `RECOVERY_CLAIM_TIMEOUT_MS`, `RECOVERY_BATCH_SIZE`, `RECOVERY_TICK_MS`, `RECOVERY_SEND_SPACING_MS`, `RECOVERY_RETRY_DELAY_MS`, `RECOVERY_ENABLED_SETTING`, `RESUME_QUERY_PARAM`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/recovery-pure.ts` :

```ts
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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx tsx scripts/tests/recovery-pure.ts
```

Attendu : échec sur `Cannot find module '../../src/lib/checkoutRecovery'`.

- [ ] **Step 3 : Écrire le module pur**

Créer `src/lib/checkoutRecovery.ts` :

```ts
/**
 * Socle commun de la relance des tunnels de commande abandonnés.
 *
 * Ce module ne connaît ni Prisma ni React : il tient les délais de la séquence,
 * les libellés allemands et l'encodage du panier figé. Il est importé par le
 * répartiteur, par les gabarits d'e-mail, par le back-office et par les scripts
 * de test — exactement le rôle que src/lib/cart.ts joue pour le panier.
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
 * chaque envoi — ces valeurs-ci ne servent que de repli.
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

/** Quatre messages, pas plus : au-delà, une relance devient du harcèlement. */
export const RECOVERY_MAIL_COUNT = 4;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Délais **relatifs au message précédent**, indexés par le nombre de messages
 * déjà envoyés. Le premier compte depuis la capture.
 *
 * Dix minutes et non cinq : remplir une adresse de livraison à la main prend
 * facilement quatre à cinq minutes, et relancer un client encore en train
 * d'acheter est le meilleur moyen de le faire fuir.
 */
export const RECOVERY_DELAYS_MS: readonly number[] = [10 * MINUTE, 24 * HOUR, 3 * DAY, 7 * DAY];

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

/** Envois maximum par tick : le fournisseur limite le débit. */
export const RECOVERY_BATCH_SIZE = 20;

/** Période du tick. */
export const RECOVERY_TICK_MS = MINUTE;

/** Pause entre deux envois d'un même tick. */
export const RECOVERY_SEND_SPACING_MS = 250;

/** Report après un refus du fournisseur. */
export const RECOVERY_RETRY_DELAY_MS = 30 * MINUTE;

/** Clé de l'interrupteur global dans la table Setting. */
export const RECOVERY_ENABLED_SETTING = "checkoutRecovery.enabled";

/** Paramètre d'URL porteur du jeton de reprise sur la page caisse. */
export const RESUME_QUERY_PARAM = "fortsetzen";

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

// ---- URL ----

/**
 * Page de la catégorie d'un article, obtenue en retirant le dernier segment de
 * son chemin. Sert au quatrième message, qui propose d'autres modèles.
 */
export function categoryPathFromProductPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length < 3) return "/";
  return `/${segments.slice(0, -1).join("/")}`;
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx tsx scripts/tests/recovery-pure.ts
```

Attendu : `recovery-pure : toutes les assertions passent`

- [ ] **Step 5 : Ajouter le modèle Prisma**

Ajouter à la fin de `prisma/schema.prisma` :

```prisma
// ---- Relance des tunnels de commande abandonnés ----
// Le tunnel n'écrit une Order qu'à la validation finale : un visiteur qui
// saisit son adresse puis s'en va ne laisse aucune trace. Cette table retient
// l'adresse et le panier dès l'étape « contact », le temps d'une séquence de
// quatre messages.
// Les désabonnements ne vivent PAS ici mais dans EmailSuppression, partagée
// avec les campagnes marketing : deux listes de refus concurrentes finiraient
// par se contredire, et un client désabonné d'un côté recevrait l'autre.

model CheckoutRecovery {
  id String @id @default(cuid())

  // Adresse telle que saisie pour l'envoi et l'affichage ; forme normalisée
  // (minuscules, sans espaces) pour tous les rapprochements.
  email           String
  emailNormalized String @unique
  // de | en — langue du tunnel. Les gabarits sont allemands dans cette
  // version ; le champ est en place pour la traduction à venir.
  locale          String @default("de")

  // Panier figé en JSON, comme Product.bullets : ni enum ni liste scalaire,
  // donc le schéma reste identique sous SQLite et sous PostgreSQL.
  cartJson      String
  subtotalCents Int
  shippingCents Int
  totalCents    Int

  // Jeton aléatoire de 32 octets porté par le lien de reprise et par celui de
  // désabonnement. Il circule en clair dans le message : jamais un cuid, qui
  // serait partiellement devinable.
  resumeToken String @unique

  // Dernière étape atteinte : contact | payment | review
  lastStep String @default("contact")

  // Messages déjà envoyés, de 0 à 4.
  sentCount  Int       @default(0)
  lastSentAt DateTime?
  // Prochain envoi dû ; null quand la séquence est terminée ou stoppée.
  nextSendAt DateTime?
  // Échecs consécutifs sur le message en cours, remis à zéro après un succès.
  sendAttempts Int @default(0)
  // Verrou posé le temps d'un envoi : sans lui, deux passages simultanés du
  // répartiteur enverraient deux fois le même message.
  claimedAt DateTime?

  // converted | unsubscribed | completed | failed
  stoppedReason String    @default("")
  stoppedAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Requête du tick : les lignes échues, puis la purge par ancienneté.
  @@index([nextSendAt])
  @@index([createdAt])
}
```

- [ ] **Step 6 : Créer la migration**

```bash
npx prisma migrate dev --name relance_paniers_abandonnes
```

Attendu : nouveau dossier sous `prisma/migrations/`, client régénéré dans `src/generated/prisma`. Vérifier que la migration ne contient que la création de `CheckoutRecovery` — si elle touche les tables `Campaign*`, c'est que le schéma avait dérivé de la base : arrêter et le signaler avant d'aller plus loin.

- [ ] **Step 7 : Ajouter le script npm**

Dans `package.json`, section `scripts`, après `"db:studio"` :

```json
"test:recovery": "tsx scripts/tests/recovery-pure.ts && tsx scripts/tests/recovery-mails.ts && tsx scripts/tests/recovery-flow.ts"
```

Les deux derniers fichiers n'existent pas encore : la commande échouera jusqu'à la tâche 4. C'est voulu, elle sert de liste de contrôle.

- [ ] **Step 8 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

Attendu : aucune erreur.

- [ ] **Step 9 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/checkoutRecovery.ts scripts/tests/recovery-pure.ts package.json
git commit -m "Ajouter le modèle CheckoutRecovery et le socle de la relance"
```

---

### Task 2 : En-têtes du mailer et les quatre gabarits allemands

**Files:**
- Modify: `src/lib/mailer.ts`
- Create: `src/server/emails/checkoutRecovery.ts`
- Create: `scripts/tests/recovery-mails.ts`

**Interfaces:**
- Consumes: de la tâche 1 — `RecoveryLine`, `availabilityLabel`, `conditionLabel`, `categoryPathFromProductPath`, `RESUME_QUERY_PARAM`. De l'existant — `MailMessage` (`src/lib/mailer.ts`), `siteUrl()` et le `layout()` interne de `src/server/emails/customerAccount.ts`.
- Produces: `MailMessage.headers?: Record<string, string>` ; `recoveryMail(input: RecoveryMailInput): MailMessage` ; `RecoveryMailInput { rank: 1 | 2 | 3 | 4; lines: RecoveryLine[]; totalCents: number; resumeToken: string }` ; `resumeUrl(token: string): string` ; `unsubscribeUrl(token: string): string`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/recovery-mails.ts` :

```ts
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

  // Le bouton de reprise et le lien contact juste en dessous.
  assert.ok(mail.html.includes(resumeUrl(TOKEN)), `lien de reprise absent du message ${rank}`);
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

// Le seuil de franco de port du deuxième message vient de la constante, pas
// d'une valeur écrite en dur dans le gabarit.
const second = recoveryMail({ rank: 2, lines: LINES, totalCents: 174_700, resumeToken: TOKEN });
assert.ok(second.html.includes("50,00"), "seuil de franco de port absent du deuxième message");

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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx tsx scripts/tests/recovery-mails.ts
```

Attendu : échec sur `Cannot find module '../../src/server/emails/checkoutRecovery'`.

- [ ] **Step 3 : Ouvrir `layout()` au partage**

Dans `src/server/emails/customerAccount.ts`, ajouter `export` devant `function layout` et devant `function escapeHtml`, et exporter le type `LayoutInput`. Rien d'autre ne change dans ce fichier : les gabarits de la relance doivent avoir exactement la même ossature — logo, filet rouge `#e3000e`, tableaux — sinon la boutique enverrait deux chartes différentes.

Ajouter à `LayoutInput` un champ facultatif :

```ts
  /** Lien discret de désabonnement, ajouté sous la mention automatique. */
  unsubscribe?: { label: string; url: string };
```

et, dans le pied de page du gabarit, juste après le paragraphe `footer` :

```ts
  const unsubscribeLink = input.unsubscribe
    ? `<p style="margin:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#8a8f98;">
                    <a href="${escapeHtml(input.unsubscribe.url)}" style="color:#8a8f98; text-decoration:underline;">${escapeHtml(input.unsubscribe.label)}</a>
                  </p>`
    : "";
```

et l'insérer dans le bloc de pied de page existant, sous la ligne `footer`.

- [ ] **Step 4 : Ajouter les en-têtes au mailer**

Dans `src/lib/mailer.ts`, étendre l'interface :

```ts
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * En-têtes supplémentaires transmis tels quels au fournisseur. Sert aux
   * en-têtes List-Unsubscribe, que Gmail et Yahoo exigent depuis février 2024
   * pour les envois automatisés : sans eux, la réputation du domaine chute.
   */
  headers?: Record<string, string>;
}
```

et, dans le corps de `sendMail`, ajouter au `JSON.stringify` :

```ts
      ...(message.headers ? { headers: message.headers } : {}),
```

- [ ] **Step 5 : Écrire les gabarits**

Créer `src/server/emails/checkoutRecovery.ts`. Contenu attendu, section par section.

En-tête et imports :

```ts
/**
 * Les quatre messages de relance des tunnels abandonnés.
 *
 * Mêmes contraintes de mise en page que les autres gabarits du dossier :
 * tableaux, styles en ligne, `color-scheme: light`. C'est la seule entorse
 * autorisée à la règle « pas de style en ligne » du dépôt — aucun client de
 * messagerie ne respecte une feuille de style externe.
 *
 * Le premier message est un message de support, pas une offre : c'est le seul
 * cadrage défendable pour un envoi sans consentement préalable. Les textes
 * allemands sont figés dans la spec, section « Les quatre e-mails ».
 */

import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/cart";
import {
  availabilityLabel,
  categoryPathFromProductPath,
  conditionLabel,
  RESUME_QUERY_PARAM,
  type RecoveryLine,
} from "@/lib/checkoutRecovery";
import type { MailMessage } from "@/lib/mailer";
import { escapeHtml, layout, siteUrl } from "@/server/emails/customerAccount";

/** Au-delà, le message devient un catalogue : les suivantes sont résumées. */
const MAX_PRODUCT_BLOCKS = 3;
```

URL :

```ts
export function resumeUrl(token: string): string {
  return `${siteUrl()}/kasse?${RESUME_QUERY_PARAM}=${token}`;
}

export function unsubscribeUrl(token: string): string {
  return `${siteUrl()}/abmeldung?token=${token}`;
}

function contactUrl(): string {
  return `${siteUrl()}/kontakt`;
}
```

Formatage des montants — reprendre le format allemand utilisé partout dans la boutique, `1.234,56 €` :

```ts
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
```

Bloc produit :

```ts
/** Une ligne de panier : vignette à gauche, libellés et prix à droite. */
function productBlock(line: RecoveryLine): string {
  const price = formatPrice(line.unitPriceCents * line.quantity);
  const quantity = line.quantity > 1 ? `${line.quantity} × ` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0; background-color:#f8f9fa; border:1px solid #e0e2e6; border-radius:4px;">
                  <tr>
                    <td width="104" valign="top" style="padding:12px;">
                      <img src="${escapeHtml(line.image)}" width="80" height="80" alt="${escapeHtml(line.name)}" style="display:block; width:80px; height:80px; object-fit:contain; border:0; border-radius:4px; background-color:#ffffff;" />
                    </td>
                    <td valign="top" style="padding:12px 12px 12px 0; font-family:Arial,Helvetica,sans-serif;">
                      <p style="margin:0 0 2px 0; font-size:12px; line-height:18px; color:#6b7280; text-transform:uppercase;">${escapeHtml(line.brand)}</p>
                      <p style="margin:0 0 6px 0; font-size:15px; line-height:21px; font-weight:bold; color:#1f2430;">${escapeHtml(line.name)}</p>
                      <p style="margin:0 0 4px 0; font-size:15px; line-height:21px; color:#1f2430;">${quantity}${escapeHtml(price)}</p>
                      <p style="margin:0; font-size:13px; line-height:19px; color:#4b5563;">${escapeHtml(availabilityLabel(line))} — ${escapeHtml(conditionLabel(line.condition))}</p>
                    </td>
                  </tr>
                </table>`;
}

function productBlocks(lines: RecoveryLine[]): string {
  const shown = lines.slice(0, MAX_PRODUCT_BLOCKS).map(productBlock).join("\n");
  const hidden = lines.length - MAX_PRODUCT_BLOCKS;
  if (hidden <= 0) return shown;
  const label = hidden === 1 ? "und 1 weiterer Artikel" : `und ${hidden} weitere Artikel`;
  return `${shown}
                <p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:19px; color:#4b5563;">${label} in Ihrem Warenkorb.</p>`;
}
```

Les quatre contenus. Chaque entrée porte l'objet, le preheader, le titre, les paragraphes, le libellé du bouton, sa cible, et la phrase d'appel au contact :

```ts
interface MailContent {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  actionLabel: string;
  /** Cible du bouton : reprise du tunnel, ou catégorie pour le dernier message. */
  actionTarget: "resume" | "category";
  contactLead: string;
  contactLabel: string;
}

function contentFor(rank: 1 | 2 | 3 | 4): MailContent {
  if (rank === 1) {
    return {
      subject: "Brauchen Sie Hilfe bei Ihrer Bestellung?",
      preheader: "Ihr Warenkorb ist gespeichert – wir helfen gern weiter.",
      heading: "Hat beim Abschluss etwas nicht funktioniert?",
      paragraphs: [
        "Sie haben vor wenigen Minuten eine Bestellung bei Hausgeräte Pfeffer begonnen, sie aber nicht abgeschlossen. Ihr Warenkorb liegt weiterhin für Sie bereit.",
        "Falls es an der Zahlung gelegen hat: Manchmal bricht eine Verbindung ab oder eine Eingabe wird nicht übernommen. Über den Button unten setzen Sie Ihre Bestellung genau dort fort, wo Sie aufgehört haben – Ihre Angaben sind noch gespeichert.",
      ],
      actionLabel: "Bestellung fortsetzen",
      actionTarget: "resume",
      contactLead: "Probleme bei der Zahlung? Schreiben Sie uns kurz – wir antworten am gleichen Werktag.",
      contactLabel: "Zum Kontaktformular",
    };
  }
  if (rank === 2) {
    return {
      subject: "Ihr Gerät ist noch für Sie verfügbar",
      preheader: `Ihr Warenkorb wartet – versandkostenfrei ab ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}.`,
      heading: "Ihr Warenkorb ist noch da",
      paragraphs: [
        "Ihre Auswahl liegt weiterhin in Ihrem Warenkorb. Sie können die Bestellung mit einem Klick abschließen, ohne Ihre Daten erneut eingeben zu müssen.",
        `Gut zu wissen: Ab ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)} Warenwert liefern wir versandkostenfrei innerhalb Deutschlands. Und Sie haben 14 Tage Widerrufsrecht – passt das Gerät nicht, nehmen wir es zurück.`,
      ],
      actionLabel: "Jetzt abschließen",
      actionTarget: "resume",
      contactLead: "Unsicher bei der Auswahl? Wir beraten Sie gern.",
      contactLabel: "Kontakt aufnehmen",
    };
  }
  if (rank === 3) {
    return {
      subject: "Noch Fragen zu Ihrem Gerät?",
      preheader: "Maße, Anschluss, Lieferzeit – fragen Sie uns.",
      heading: "Sprechen Sie mit uns, bevor Sie sich entscheiden",
      paragraphs: [
        "Ein Haushaltsgerät kauft man nicht jeden Tag. Wenn Sie noch etwas klären möchten – Maße, Anschluss, Lieferzeit oder Entsorgung des Altgeräts – beantworten wir Ihre Fragen gern persönlich.",
        "Ihr Warenkorb bleibt gespeichert. Sie können ihn jederzeit über den Button unten öffnen.",
      ],
      actionLabel: "Warenkorb ansehen",
      actionTarget: "resume",
      contactLead: "Lieber direkt fragen? Wir sind für Sie erreichbar.",
      contactLabel: "Frage stellen",
    };
  }
  return {
    subject: "Wir sind weiterhin für Sie da",
    preheader: "Weitere Modelle in derselben Kategorie.",
    heading: "Falls Sie sich anders entschieden haben",
    paragraphs: [
      "Ihr gespeicherter Warenkorb wird bald automatisch gelöscht. Das ist völlig in Ordnung – vielleicht war es nicht das passende Gerät.",
      "In derselben Kategorie führen wir weitere Modelle, auch in anderen Preislagen. Und wenn Sie etwas Bestimmtes suchen, das Sie bei uns online nicht finden: fragen Sie uns, wir haben oft mehr auf Lager, als die Website zeigt.",
    ],
    actionLabel: "Weitere Geräte ansehen",
    actionTarget: "category",
    contactLead: "Eine konkrete Frage? Schreiben Sie uns.",
    contactLabel: "Kontakt aufnehmen",
  };
}
```

Assemblage :

```ts
export interface RecoveryMailInput {
  rank: 1 | 2 | 3 | 4;
  lines: RecoveryLine[];
  totalCents: number;
  resumeToken: string;
}

export function recoveryMail(input: RecoveryMailInput): MailMessage {
  if (input.lines.length === 0) {
    // Un message de relance sans produit n'a aucun sens : mieux vaut prévenir
    // l'appelant que d'envoyer une coquille vide au client.
    throw new Error("recoveryMail : panier vide, aucun message à composer");
  }

  const content = contentFor(input.rank);
  const resume = resumeUrl(input.resumeToken);
  const unsubscribe = unsubscribeUrl(input.resumeToken);
  const contact = contactUrl();
  const category = `${siteUrl()}${categoryPathFromProductPath(input.lines[0].path)}`;

  // Le bloc produit est inséré avant le dernier paragraphe, pour que le client
  // voie l'appareil avant l'argument, puis le bouton juste après.
  const paragraphs = [
    ...content.paragraphs.map(escapeHtml),
    productBlocks(input.lines),
    `<strong>Gesamtsumme: ${escapeHtml(formatPrice(input.totalCents))}</strong>`,
  ];

  const html = layout({
    locale: "de",
    preheader: content.preheader,
    heading: content.heading,
    paragraphs,
    action: {
      label: content.actionLabel,
      url: content.actionTarget === "category" ? category : resume,
    },
    footnote: `${escapeHtml(content.contactLead)} <a href="${escapeHtml(contact)}" style="color:#e3000e; text-decoration:underline;">${escapeHtml(content.contactLabel)}</a>`,
    unsubscribe: { label: "Keine Erinnerungen mehr erhalten", url: unsubscribe },
  });

  const productText = input.lines
    .slice(0, MAX_PRODUCT_BLOCKS)
    .map(
      (line) =>
        `- ${line.brand} ${line.name}, ${formatPrice(line.unitPriceCents * line.quantity)} (${availabilityLabel(line)}, ${conditionLabel(line.condition)})`,
    )
    .join("\n");

  const text = [
    content.heading,
    "",
    ...content.paragraphs,
    "",
    productText,
    `Gesamtsumme: ${formatPrice(input.totalCents)}`,
    "",
    `${content.actionLabel}: ${content.actionTarget === "category" ? category : resume}`,
    "",
    `${content.contactLead} ${contact}`,
    "",
    `Keine Erinnerungen mehr erhalten: ${unsubscribe}`,
  ].join("\n");

  return {
    to: "",
    subject: content.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
```

`to` est laissé vide volontairement : c'est le répartiteur qui connaît le destinataire, le gabarit ne fait que composer.

- [ ] **Step 6 : Lancer le test pour vérifier qu'il passe**

```bash
npx tsx scripts/tests/recovery-mails.ts
```

Attendu : `recovery-mails : quatre aperçus écrits dans …`

- [ ] **Step 7 : Contrôler les quatre aperçus dans un navigateur**

```bash
open .next/cache/recovery-preview/mail-1.html
```

Vérifier sur les quatre : logo présent, filet rouge, image produit visible, prix en format allemand, bouton rouge, lien contact sous le bouton, lien de désabonnement en petit dans le pied de page, aucun emoji.

- [ ] **Step 8 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 9 : Commit**

```bash
git add src/lib/mailer.ts src/server/emails/customerAccount.ts src/server/emails/checkoutRecovery.ts scripts/tests/recovery-mails.ts
git commit -m "Composer les quatre messages allemands de relance de panier"
```

---

### Task 3 : Capture de la session

**Files:**
- Create: `src/server/checkoutRecovery.ts` (première moitié : capture, arrêt, lecture)
- Create: `src/server/recoveryRate.ts`
- Create: `src/app/api/checkout/recovery/route.ts`
- Modify: `src/components/checkout/CheckoutFlow.tsx`

**Interfaces:**
- Consumes: tâche 1 — `normalizeEmail`, `encodeCart`, `nextSendAtFor`, `RecoveryLine`, `RecoveryStep`, `RecoveryStoppedReason`. Existant — `prisma`, `computeTotals` et les constantes de `src/lib/cart.ts`.
- Produces: `captureRecovery(input: CaptureInput): Promise<void>` avec `CaptureInput { email: string; locale: string; step: RecoveryStep; lines: { productId: string; quantity: number }[] }` ; `stopRecoveryForEmail(email: string, reason: RecoveryStoppedReason): Promise<void>` ; `findRecoveryByToken(token: string): Promise<RecoveryRecord | null>` ; `recoveryLimiter` avec `check(ip)` / `register(ip)`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/recovery-flow.ts` avec, pour l'instant, la seule partie capture :

```ts
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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : échec sur `Cannot find module '../../src/server/checkoutRecovery'`.

- [ ] **Step 3 : Écrire la capture**

Créer `src/server/checkoutRecovery.ts` :

```ts
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

  const totals = computeTotals(
    lines.map((line) => ({ priceCents: line.unitPriceCents, quantity: line.quantity })),
  );
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
```

Vérifier le nom réel de la fonction de calcul dans `src/lib/cart.ts` avant d'écrire l'import : si elle ne s'appelle pas `computeTotals`, utiliser le nom du fichier et corriger l'appel — les champs attendus sont `subtotalCents`, `shippingCents`, `totalCents`.

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : `recovery-flow : capture conforme`

- [ ] **Step 5 : Écrire le limiteur**

Créer `src/server/recoveryRate.ts` :

```ts
/**
 * Frein sur la route de capture des tunnels abandonnés.
 *
 * Cette route est publique et prend une adresse e-mail : sans limite, elle
 * permettrait de faire envoyer des messages de la boutique à n'importe qui, en
 * boucle. Même principe que src/server/customerRate.ts — compteur en mémoire,
 * suffisant pour une instance unique. Avec plusieurs instances, il faudra
 * déplacer ces compteurs dans Redis.
 */

const MAX_CAPTURES = 5;
const WINDOW_MS = 10 * 60_000;

interface Window {
  count: number;
  startedAt: number;
}

const windows = new Map<string, Window>();

export const recoveryLimiter = {
  check(ip: string): boolean {
    const entry = windows.get(ip);
    if (!entry) return true;
    if (Date.now() - entry.startedAt > WINDOW_MS) {
      windows.delete(ip);
      return true;
    }
    return entry.count < MAX_CAPTURES;
  },

  register(ip: string): void {
    const entry = windows.get(ip);
    if (!entry || Date.now() - entry.startedAt > WINDOW_MS) {
      windows.set(ip, { count: 1, startedAt: Date.now() });
      return;
    }
    entry.count += 1;
  },
};
```

- [ ] **Step 6 : Écrire la route de capture**

Créer `src/app/api/checkout/recovery/route.ts` :

```ts
import { NextResponse } from "next/server";
import { captureRecovery } from "@/server/checkoutRecovery";
import { recoveryLimiter } from "@/server/recoveryRate";
import type { RecoveryStep } from "@/lib/checkoutRecovery";

// Capture de la session de paiement, appelée par le tunnel dès que l'adresse
// e-mail est validée.
//
// La route répond toujours 204, même quand rien n'est écrit : elle sert un
// appel « fire and forget » du navigateur, et le client n'a aucune décision à
// prendre d'après la réponse. Elle ne révèle donc pas non plus si une adresse
// est déjà connue ou désabonnée.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEPS: RecoveryStep[] = ["contact", "payment", "review"];
const MAX_LINES = 40;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (!recoveryLimiter.check(ip)) {
    return new NextResponse(null, { status: 429 });
  }
  recoveryLimiter.register(ip);

  const payload = await request.json().catch(() => null);
  if (typeof payload !== "object" || payload === null) {
    return new NextResponse(null, { status: 204 });
  }

  const body = payload as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return new NextResponse(null, { status: 204 });
  }

  const step = STEPS.includes(body.step as RecoveryStep) ? (body.step as RecoveryStep) : "contact";
  const locale = body.locale === "en" ? "en" : "de";

  const rawLines = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  const lines = rawLines
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const line = entry as Record<string, unknown>;
      if (typeof line.productId !== "string" || typeof line.quantity !== "number") return null;
      return { productId: line.productId, quantity: line.quantity };
    })
    .filter((line): line is { productId: string; quantity: number } => line !== null);

  if (lines.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await captureRecovery({ email, locale, step, lines });
  } catch (error) {
    // Une panne de capture ne doit jamais remonter au tunnel : le client est en
    // train d'acheter, c'est la seule chose qui compte.
    console.error("[recovery] capture échouée:", error);
  }

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 7 : Brancher le tunnel**

Dans `src/components/checkout/CheckoutFlow.tsx`, ajouter une fonction au-dessus du composant :

```tsx
/**
 * Signale au serveur que le tunnel est en cours, pour la séquence de relance.
 *
 * Volontairement sans await et sans remontée d'erreur : une panne de cette
 * route ne doit jamais empêcher une commande d'aboutir.
 */
function captureRecovery(email: string, step: string, lines: CartLine[], locale: string): void {
  void fetch("/api/checkout/recovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      step,
      locale,
      lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    }),
    keepalive: true,
  }).catch(() => {});
}
```

`keepalive: true` est indispensable : l'appel part au moment où le visiteur change d'étape, et sans lui le navigateur annulerait la requête s'il fermait l'onglet dans la seconde.

Puis, dans le passage de `contact` à `payment` — juste avant le `setStep("payment")` de la ligne 145 — ajouter :

```tsx
    captureRecovery(email.trim(), "contact", lines, locale);
```

et avant le `setStep("review")` de la ligne 154 :

```tsx
    captureRecovery(email.trim(), "payment", lines, locale);
```

Récupérer `lines` depuis le contexte panier déjà utilisé par le composant, et `locale` via `useLocale()` de `next-intl`. Si le composant nomme autrement les lignes du panier, utiliser son nom : ne pas introduire de second accès au panier.

- [ ] **Step 8 : Vérifier de bout en bout dans le navigateur**

```bash
npm run dev
```

Remplir un panier, aller sur `/kasse`, saisir une adresse, passer à l'étape paiement. Puis :

```bash
npx prisma studio
```

Table `CheckoutRecovery` : une ligne, `lastStep` à `contact` puis `payment` après la seconde transition, `nextSendAt` dix minutes après la création.

- [ ] **Step 9 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 10 : Commit**

```bash
git add src/server/checkoutRecovery.ts src/server/recoveryRate.ts src/app/api/checkout/recovery/route.ts src/components/checkout/CheckoutFlow.tsx scripts/tests/recovery-flow.ts
git commit -m "Capturer la session de paiement dès la saisie de l'adresse"
```

---

### Task 4 : Répartiteur, planificateur et route cron

**Files:**
- Modify: `src/server/checkoutRecovery.ts` (seconde moitié)
- Create: `src/server/scheduler.ts`
- Create: `src/instrumentation.ts`
- Create: `src/app/api/cron/recovery/route.ts`
- Modify: `scripts/tests/recovery-flow.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: tâches 1 à 3 — tout `src/lib/checkoutRecovery.ts`, `recoveryMail`, `decodeCart`, `sendMail`, `isMailConfigured`.
- Produces: `runRecoveryTick(options?: { now?: Date; dryRun?: boolean }): Promise<TickResult>` avec `TickResult { sent: number; skipped: number; failed: number; purged: number }` ; `isRecoveryEnabled(): Promise<boolean>` ; `setRecoveryEnabled(enabled: boolean): Promise<void>` ; `startScheduler(): void`.

- [ ] **Step 1 : Étendre le test**

Ajouter dans `scripts/tests/recovery-flow.ts`, avant le `console.log` final, en ajoutant `runRecoveryTick` à l'import depuis `../../src/server/checkoutRecovery` :

```ts
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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : échec sur l'import de `runRecoveryTick`, qui n'existe pas encore.

- [ ] **Step 3 : Écrire le répartiteur**

Ajouter à `src/server/checkoutRecovery.ts` :

```ts
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
 * qui permet de vérifier la machine à états sans clé Resend.
 */
export async function runRecoveryTick(
  options: { now?: Date; dryRun?: boolean } = {},
): Promise<TickResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const result: TickResult = { sent: 0, skipped: 0, failed: 0, purged: 0 };

  if (!(await isRecoveryEnabled())) return result;

  // Sans configuration d'envoi, on ne touche à rien : consommer la séquence
  // parce que la clé manque en local reviendrait à perdre les relances.
  if (!dryRun && !isMailConfigured()) {
    if (!mailWarningShown) {
      console.warn(
        "[recovery] RESEND_API_KEY ou MAIL_FROM manquant : les relances ne partent pas.",
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
    // archivé tel que saisi, et Prisma ne sait pas comparer sans tenir compte
    // de la casse sous SQLite. L'arrêt qui fait autorité est le crochet de
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
      // Le fournisseur limite le débit : un envoi toutes les 250 ms.
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
```

Compléter les imports en tête de fichier : `decodeCart`, `MAX_SEND_ATTEMPTS`, `RECOVERY_BATCH_SIZE`, `RECOVERY_CLAIM_TIMEOUT_MS`, `RECOVERY_ENABLED_SETTING`, `RECOVERY_RETENTION_DAYS`, `RECOVERY_RETRY_DELAY_MS`, `RECOVERY_SEND_SPACING_MS` depuis `@/lib/checkoutRecovery`, `isMailConfigured` et `sendMail` depuis `@/lib/mailer`, `recoveryMail` depuis `@/server/emails/checkoutRecovery`.

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : `recovery-flow : capture conforme`, sans échec d'assertion.

- [ ] **Step 5 : Écrire le planificateur**

Créer `src/server/scheduler.ts` :

```ts
/**
 * Tâches périodiques de la boutique.
 *
 * L'hébergement ne fournit pas de cron système : le rythme vit donc dans le
 * processus Node lui-même. Cela suppose un serveur qui tourne en continu
 * (`next dev`, `next start`) — c'est le cas sur l'hébergement actuel. En
 * serverless, l'intervalle ne se déclencherait pas et il faudrait appeler
 * /api/cron/recovery depuis l'extérieur ; la route existe pour cela.
 *
 * Ce module est le point d'entrée unique : le chantier des campagnes marketing
 * y branchera son propre répartiteur, sans second intervalle.
 */

import { RECOVERY_TICK_MS } from "@/lib/checkoutRecovery";
import { runRecoveryTick } from "@/server/checkoutRecovery";

// Le rechargement à chaud réexécute les modules : sans ce drapeau, chaque
// enregistrement de fichier ajouterait un intervalle de plus. Même protection
// que celle du client Prisma dans src/server/prisma.ts.
const globalForScheduler = globalThis as unknown as { schedulerStarted?: boolean };

export function startScheduler(): void {
  if (globalForScheduler.schedulerStarted) return;
  globalForScheduler.schedulerStarted = true;

  setInterval(() => {
    void runRecoveryTick().catch((error) => {
      // Une erreur avalée ici, sinon un rejet non traité arrêterait le
      // processus et donc la boutique entière.
      console.error("[scheduler] tick de relance en échec:", error);
    });
  }, RECOVERY_TICK_MS);

  console.log(`[scheduler] relance des paniers active, tick de ${RECOVERY_TICK_MS / 1000} s`);
}
```

- [ ] **Step 6 : Écrire l'instrumentation**

Créer `src/instrumentation.ts` :

```ts
/**
 * Point d'entrée appelé une fois au démarrage de chaque instance du serveur
 * Next. Le fichier vit dans src/ parce que le projet utilise un dossier src —
 * voir node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
 *
 * La documentation précise que `register` doit se terminer avant que le serveur
 * accepte des requêtes : on démarre donc l'intervalle et on rend la main
 * aussitôt, sans jamais attendre un tick.
 */

export function register(): void {
  // Le fichier est aussi chargé dans le runtime Edge, où setInterval et Prisma
  // n'ont pas leur place.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import différé : charger le planificateur — et donc Prisma — au niveau du
  // module ferait échouer la compilation du bundle Edge.
  void import("@/server/scheduler").then(({ startScheduler }) => startScheduler());
}
```

- [ ] **Step 7 : Écrire la route cron**

Créer `src/app/api/cron/recovery/route.ts` :

```ts
import { NextResponse } from "next/server";
import { runRecoveryTick } from "@/server/checkoutRecovery";

// Déclenchement manuel du répartiteur.
//
// Le planificateur interne suffit en exploitation normale ; cette route sert
// aux tests et resterait le point d'entrée d'un cron externe si l'hébergement
// passait un jour en serverless.

export async function POST(request: Request) {
  const secret = process.env.RECOVERY_CRON_SECRET?.trim();
  if (!secret) {
    // Pas de secret configuré : la route reste fermée plutôt que d'offrir un
    // déclencheur ouvert à tous.
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runRecoveryTick();
  return NextResponse.json(result);
}
```

- [ ] **Step 8 : Documenter la variable**

Ajouter à `.env.example`, à la suite du bloc Resend :

```
# Déclenchement manuel du répartiteur de relance des paniers abandonnés
# (POST /api/cron/recovery, en-tête « Authorization: Bearer … »).
# Le planificateur interne tourne de lui-même toutes les 60 secondes : cette
# variable ne sert qu'aux tests, et à brancher un cron externe si l'application
# passait un jour en hébergement serverless.
# Générer avec : openssl rand -hex 32
RECOVERY_CRON_SECRET=
```

- [ ] **Step 9 : Vérifier le démarrage du planificateur**

```bash
npm run dev
```

Attendu dans la console : `[scheduler] relance des paniers active, tick de 60 s`, une seule fois. Modifier un fichier pour provoquer un rechargement à chaud et vérifier que la ligne n'apparaît pas une seconde fois.

- [ ] **Step 10 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Le `build` est indispensable ici : c'est lui qui révélerait un import de Prisma tombé dans le bundle Edge par l'instrumentation.

- [ ] **Step 11 : Commit**

```bash
git add src/server/checkoutRecovery.ts src/server/scheduler.ts src/instrumentation.ts src/app/api/cron/recovery/route.ts scripts/tests/recovery-flow.ts .env.example
git commit -m "Envoyer la séquence de relance depuis un planificateur interne"
```

---

### Task 5 : Reprise du paiement depuis le message

**Files:**
- Modify: `src/app/[locale]/kasse/page.tsx`
- Modify: `src/components/checkout/CheckoutFlow.tsx`

**Interfaces:**
- Consumes: `findRecoveryByToken` (tâche 3), `decodeCart` et `RESUME_QUERY_PARAM` (tâche 1), `CART_STORAGE_KEY` et `CartLine` (`src/lib/cart.ts`).
- Produces: la propriété `resumed?: ResumedCheckout` de `CheckoutFlow`, avec `ResumedCheckout { email: string; step: RecoveryStep; lines: CartLine[] }`.

- [ ] **Step 1 : Lire la doc avant de toucher aux searchParams**

```bash
cat node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md
```

Et, pour la page serveur, vérifier la forme de `searchParams` dans cette version de Next — c'est une `Promise` qu'il faut attendre.

- [ ] **Step 2 : Lire le jeton dans la page caisse**

Dans `src/app/[locale]/kasse/page.tsx`, ajouter `searchParams` à la signature de la page — la page est déjà `force-dynamic`, rien à changer de ce côté — puis :

```tsx
  const { [RESUME_QUERY_PARAM]: rawToken } = await searchParams;
  const token = typeof rawToken === "string" ? rawToken : "";

  // Reprise depuis un message de relance. Un jeton inconnu ou une session
  // purgée n'affiche aucune erreur : un lien vieux de six semaines doit ouvrir
  // la caisse normalement, pas une page cassée.
  const recovery = token ? await findRecoveryByToken(token) : null;
  const resumed = recovery
    ? {
        email: recovery.email,
        step: recovery.lastStep as RecoveryStep,
        lines: decodeCart(recovery.cartJson).map((line) => ({
          productId: line.productId,
          slug: line.path.split("/").pop() ?? "",
          brand: line.brand,
          name: line.name,
          image: line.image,
          path: `/${line.path}`,
          priceCents: line.unitPriceCents,
          quantity: line.quantity,
          stock: line.stock,
        })),
      }
    : undefined;
```

et passer `resumed={resumed}` à `<CheckoutFlow …>`.

Vérifier les noms de champs de `CartLine` dans `src/lib/cart.ts` avant d'écrire ce bloc : la forme donnée ici suit la définition lue à la conception, mais c'est le fichier qui fait foi.

- [ ] **Step 3 : Restaurer le panier côté client**

Dans `src/components/checkout/CheckoutFlow.tsx`, ajouter la propriété à l'interface des props :

```tsx
  /** Session reprise depuis un message de relance, quand l'URL porte un jeton valide. */
  resumed?: { email: string; step: RecoveryStep; lines: CartLine[] };
```

et, juste après les déclarations d'état :

```tsx
  // Reprise depuis un message de relance.
  //
  // Le panier est réécrit dans localStorage et pas seulement affiché : le
  // message est le plus souvent ouvert sur un autre appareil que celui de
  // l'abandon, où le panier local est vide ou différent. Les prix sont de toute
  // façon recontrôlés en base par POST /api/checkout : un panier restauré ne
  // peut pas faire passer un ancien tarif.
  useEffect(() => {
    if (!resumed) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(resumed.lines));
    // Force la relecture par le magasin branché sur useSyncExternalStore.
    window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY }));
    setEmail(resumed.email);
    setStep(resumed.step === "review" ? "review" : resumed.step);
  }, [resumed]);
```

Vérifier dans `src/lib/cart.ts` comment le magasin détecte un changement de `localStorage` : s'il expose une fonction d'écriture ou de rechargement, l'appeler plutôt que d'émettre un `StorageEvent` à la main. Un magasin construit sur `useSyncExternalStore` a nécessairement un mécanisme de notification — l'utiliser est plus sûr que de simuler un évènement du navigateur.

- [ ] **Step 4 : Vérifier dans le navigateur**

```bash
npm run dev
```

1. Abandonner un tunnel, relever `resumeToken` avec `npx prisma studio`.
2. Ouvrir `http://localhost:3000/kasse?fortsetzen=<token>` **dans une fenêtre de navigation privée**, pour simuler l'autre appareil.
3. Attendu : le panier est reconstitué, l'adresse est pré-remplie, l'étape est celle enregistrée.
4. Ouvrir `http://localhost:3000/kasse?fortsetzen=jeton-invalide` : la caisse s'ouvre normalement, sans erreur ni message.
5. Terminer la commande depuis le lien repris et vérifier que la commande aboutit avec le bon montant.

- [ ] **Step 5 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 6 : Commit**

```bash
git add src/app/[locale]/kasse/page.tsx src/components/checkout/CheckoutFlow.tsx
git commit -m "Reprendre le tunnel de commande depuis le lien du message"
```

---

### Task 6 : Désabonnement

**Files:**
- Modify: `src/server/checkoutRecovery.ts` (ajout de `unsubscribeByToken`)
- Create: `src/app/api/abmeldung/route.ts`
- Create: `src/app/[locale]/abmeldung/page.tsx`
- Modify: `src/messages/de.json`, `src/messages/en.json`
- Modify: `scripts/tests/recovery-flow.ts`

**Interfaces:**
- Consumes: `findRecoveryByToken`, `stopRecoveryForEmail`, `normalizeEmail`.
- Produces: `unsubscribeByToken(token: string): Promise<boolean>` — `true` si une suppression a été enregistrée, `false` si le jeton est inconnu.

- [ ] **Step 1 : Étendre le test**

Ajouter dans `scripts/tests/recovery-flow.ts`, avant le `console.log` final :

```ts
  // ---- Désabonnement par jeton ----

  await cleanup();
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "contact",
    lines: [{ productId: product.id, quantity: 1 }],
  });
  const toUnsubscribe = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(toUnsubscribe);

  assert.equal(await unsubscribeByToken(toUnsubscribe.resumeToken), true);

  const suppression = await prisma.emailSuppression.findUnique({ where: { email: NORMALIZED } });
  assert.ok(suppression, "aucune suppression enregistrée");
  assert.equal(suppression.reason, "desinscription");

  const stoppedByOptOut = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(stoppedByOptOut);
  assert.equal(stoppedByOptOut.stoppedReason, "unsubscribed");

  // Deuxième appel : sans erreur, et sans doublon de suppression.
  assert.equal(await unsubscribeByToken(toUnsubscribe.resumeToken), true);

  // Jeton inconnu ou mal formé : refus franc, sans écriture.
  assert.equal(await unsubscribeByToken("pas-un-jeton"), false);
  assert.equal(await unsubscribeByToken("f".repeat(64)), false);

  await cleanup();
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : échec sur l'import de `unsubscribeByToken`.

- [ ] **Step 3 : Écrire la fonction**

Ajouter à `src/server/checkoutRecovery.ts` :

```ts
/**
 * Enregistre un refus définitif à partir du jeton porté par un message.
 *
 * La suppression est écrite dans EmailSuppression, la table que partagent les
 * campagnes marketing : deux listes de refus concurrentes finiraient par se
 * contredire, et un client désabonné d'un côté recevrait l'autre. Se désabonner
 * depuis une relance de panier coupe donc aussi les campagnes — c'est bien ce
 * qu'un lien « ne plus recevoir de messages » promet.
 *
 * Renvoie false si le jeton est inconnu, pour que l'appelant réponde 404 sans
 * rien écrire.
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const recovery = await findRecoveryByToken(token);
  if (!recovery) return false;

  await prisma.emailSuppression.upsert({
    where: { email: recovery.emailNormalized },
    create: { email: recovery.emailNormalized, reason: "desinscription" },
    // Un second clic ne doit pas échouer, et ne doit pas écraser la date du
    // premier refus : c'est elle qui fait preuve.
    update: {},
  });

  await stopRecoveryForEmail(recovery.email, "unsubscribed");
  return true;
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

- [ ] **Step 5 : Écrire la route**

Créer `src/app/api/abmeldung/route.ts` :

```ts
import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/server/checkoutRecovery";

// Enregistrement du refus de recevoir d'autres messages.
//
// Uniquement en POST. Un désabonnement en GET serait déclenché par les
// antivirus et les proxys de messagerie, qui préchargent les URL contenues dans
// les messages : des clients seraient désabonnés sans avoir rien demandé.
// Le clic natif de Gmail arrive lui aussi en POST, grâce à l'en-tête
// List-Unsubscribe-Post que portent les quatre messages.

export async function POST(request: Request) {
  let token = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null);
    if (payload && typeof payload === "object") {
      const value = (payload as Record<string, unknown>).token;
      if (typeof value === "string") token = value;
    }
  } else {
    // Gmail poste un corps de formulaire ; notre page aussi.
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    if (typeof value === "string") token = value;
    if (!token) token = new URL(request.url).searchParams.get("token") ?? "";
  }

  const done = await unsubscribeByToken(token);
  if (!done) {
    return NextResponse.json({ error: "unknown_token" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6 : Écrire la page**

Créer `src/app/[locale]/abmeldung/page.tsx`, sur le modèle des autres pages de `src/app/[locale]/` — `Header`, `Breadcrumb`, contenu, `Footer`, `setRequestLocale`, `hasLocale` et `notFound` comme dans `kasse/page.tsx`.

Métadonnées :

```tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "unsubscribe" });
  return {
    title: t("metaTitle"),
    // Aucune raison d'indexer une page de désabonnement portant un jeton.
    robots: { index: false, follow: false },
  };
}
```

La page lit `searchParams.token`, affiche le titre, le paragraphe d'explication, et un formulaire à bouton unique. Le formulaire est un petit composant client, parce qu'il doit afficher la confirmation sans recharger :

```tsx
"use client";

// Bouton de confirmation du désabonnement.
//
// Le refus n'est enregistré qu'au clic, jamais à l'ouverture de la page : les
// antivirus et les proxys de messagerie préchargent les liens des messages, et
// une page qui agirait au chargement désabonnerait des gens qui n'ont rien
// demandé.
export function UnsubscribeForm({ token, labels }: UnsubscribeFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function confirm() {
    setState("sending");
    const response = await fetch("/api/abmeldung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  if (state === "done") {
    return <p className="text-sm text-muted-foreground">{labels.done}</p>;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={confirm}
        disabled={state === "sending"}
        className="inline-flex items-center justify-center rounded bg-[#e3000e] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {state === "sending" ? labels.sending : labels.confirm}
      </button>
      {state === "error" && <p className="text-sm text-[#e3000e]">{labels.error}</p>}
    </div>
  );
}
```

Placer ce composant dans `src/components/legal/UnsubscribeForm.tsx`, à côté des autres composants de pages légales.

- [ ] **Step 7 : Ajouter les traductions**

Dans `src/messages/de.json`, nouvelle entrée `unsubscribe` :

```json
  "unsubscribe": {
    "metaTitle": "Abmeldung",
    "heading": "Keine Erinnerungen mehr erhalten",
    "intro": "Wenn Sie unten bestätigen, senden wir Ihnen keine Warenkorb-Erinnerungen und keine Angebote mehr an diese Adresse.",
    "confirm": "Abmeldung bestätigen",
    "sending": "Wird gespeichert…",
    "done": "Sie sind abgemeldet. Wir senden keine weiteren Nachrichten an diese Adresse.",
    "error": "Der Link ist nicht mehr gültig. Bitte schreiben Sie uns über das Kontaktformular.",
    "invalidToken": "Dieser Abmeldelink ist nicht mehr gültig."
  }
```

et dans `src/messages/en.json` :

```json
  "unsubscribe": {
    "metaTitle": "Unsubscribe",
    "heading": "Stop receiving reminders",
    "intro": "If you confirm below, we will no longer send cart reminders or offers to this address.",
    "confirm": "Confirm unsubscribe",
    "sending": "Saving…",
    "done": "You have been unsubscribed. We will not send any further messages to this address.",
    "error": "This link is no longer valid. Please contact us using the contact form.",
    "invalidToken": "This unsubscribe link is no longer valid."
  }
```

- [ ] **Step 8 : Vérifier dans le navigateur**

1. Relever un `resumeToken` avec `npx prisma studio`.
2. Ouvrir `http://localhost:3000/abmeldung?token=<token>` : la page s'affiche, **et la table `EmailSuppression` reste vide** — c'est le point à vérifier, un chargement ne doit rien écrire.
3. Cliquer le bouton : message de confirmation, ligne créée dans `EmailSuppression`, `CheckoutRecovery.stoppedReason` à `unsubscribed`.
4. Recharger et recliquer : pas d'erreur.
5. Ouvrir avec un jeton inventé : la page annonce que le lien n'est plus valide.
6. `curl -X POST 'http://localhost:3000/api/abmeldung' -d 'token=<autre-token>'` : réponse `{"ok":true}` — c'est la forme qu'envoie Gmail.

- [ ] **Step 9 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 10 : Commit**

```bash
git add src/server/checkoutRecovery.ts src/app/api/abmeldung src/app/\[locale\]/abmeldung src/components/legal/UnsubscribeForm.tsx src/messages scripts/tests/recovery-flow.ts
git commit -m "Permettre le désabonnement définitif depuis les messages"
```

---

### Task 7 : Arrêt de la séquence à la commande

**Files:**
- Modify: `src/server/orders.ts`
- Modify: `scripts/tests/recovery-flow.ts`

**Interfaces:**
- Consumes: `stopRecoveryForEmail` (tâche 3).
- Produces: rien de nouveau.

- [ ] **Step 1 : Étendre le test**

Ajouter dans `scripts/tests/recovery-flow.ts`, avant le `console.log` final :

```ts
  // ---- Une commande réelle arrête la séquence ----
  //
  // On n'appelle pas createOrder ici : il exige une adresse complète et
  // décrémenterait le stock du catalogue de test. On vérifie le comportement
  // que createOrder délègue, avec la casse d'adresse d'un vrai formulaire.

  await cleanup();
  await captureRecovery({
    email: EMAIL,
    locale: "de",
    step: "review",
    lines: [{ productId: product.id, quantity: 1 }],
  });

  // Le client a tapé son adresse avec des majuscules dans le tunnel : l'arrêt
  // doit fonctionner quand même.
  await stopRecoveryForEmail(EMAIL.toUpperCase(), "converted");

  const afterOrder = await prisma.checkoutRecovery.findUnique({
    where: { emailNormalized: NORMALIZED },
  });
  assert.ok(afterOrder);
  assert.equal(afterOrder.stoppedReason, "converted", "la séquence n'a pas été arrêtée");
  assert.equal(afterOrder.nextSendAt, null);

  // Aucune session pour cette adresse : l'appel doit rester silencieux, sinon
  // il ferait échouer une commande payante.
  await prisma.checkoutRecovery.deleteMany({ where: { emailNormalized: NORMALIZED } });
  await stopRecoveryForEmail(EMAIL, "converted");

  await cleanup();
```

- [ ] **Step 2 : Lancer le test**

```bash
npx tsx scripts/tests/recovery-flow.ts
```

Attendu : passe déjà — `stopRecoveryForEmail` existe depuis la tâche 3. C'est le filet qui garantit que l'étape suivante ne casse rien.

- [ ] **Step 3 : Brancher `createOrder`**

Dans `src/server/orders.ts`, importer `stopRecoveryForEmail` depuis `@/server/checkoutRecovery`, puis, juste après la transaction de création et avant le `return` de `createOrder` :

```ts
  // La commande est passée : la séquence de relance n'a plus lieu d'être.
  //
  // Hors transaction et sous try : un échec de mise à jour de la relance ne
  // doit jamais faire échouer une commande payante. Le répartiteur revérifie
  // de toute façon l'absence de commande avant chaque envoi, ce qui rattrape
  // le cas.
  try {
    await stopRecoveryForEmail(order.email, "converted");
  } catch (error) {
    console.error("[recovery] arrêt de la séquence impossible:", error);
  }
```

Repérer le point exact : la fin de `createOrder`, autour de la ligne 622 où `paymentStatus: "offen"` est écrit, puis le `return` de la fonction. L'appel va **après** la transaction, jamais dedans — une écriture de plus dans la transaction de commande allongerait un verrou qui doit rester court.

- [ ] **Step 4 : Vérifier de bout en bout**

```bash
npm run dev
```

Abandonner un tunnel avec une adresse, vérifier la ligne dans `CheckoutRecovery`, puis repasser par la caisse avec **la même adresse** et terminer la commande. Attendu : `stoppedReason` à `converted`, `nextSendAt` vide. Forcer ensuite `nextSendAt` dans le passé et lancer un tick :

```bash
curl -X POST http://localhost:3000/api/cron/recovery -H "Authorization: Bearer $RECOVERY_CRON_SECRET"
```

Attendu : `{"sent":0,…}`.

- [ ] **Step 5 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 6 : Commit**

```bash
git add src/server/orders.ts scripts/tests/recovery-flow.ts
git commit -m "Arrêter la séquence de relance dès qu'une commande est passée"
```

---

### Task 8 : Suivi dans le back-office

**Files:**
- Modify: `src/server/checkoutRecovery.ts` (lecture et statistiques)
- Create: `src/app/admin/(protected)/warenkorb-erinnerungen/page.tsx`
- Create: `src/components/admin/RecoveryTable.tsx`
- Create: `src/app/api/admin/recovery/route.ts`
- Modify: `src/components/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: `isRecoveryEnabled`, `setRecoveryEnabled`, `stopRecoveryForEmail`, `decodeCart`, `RECOVERY_RETENTION_DAYS`. Existant — `requireAdminApi()` de `src/lib/adminApi.ts` et `src/lib/pagination.ts`.
- Produces: `RecoveryState = "active" | "converted" | "unsubscribed" | "completed" | "failed"` ; `RecoveryRow { id: string; email: string; totalCents: number; lastStep: string; sentCount: number; state: RecoveryState; itemCount: number; createdAt: Date; lastSentAt: Date | null }` ; `listRecoveries(options: { state?: RecoveryState; page: number; perPage: number }): Promise<{ rows: RecoveryRow[]; total: number }>` ; `recoveryStats(): Promise<{ captured: number; sent: number; converted: number; ratePercent: number }>`.

- [ ] **Step 1 : Écrire les lectures**

Ajouter à `src/server/checkoutRecovery.ts` :

```ts
// ---- Lectures du back-office ----

/** État affiché dans le tableau, dérivé de stoppedReason. */
export type RecoveryState = "active" | "converted" | "unsubscribed" | "completed" | "failed";

export interface RecoveryRow {
  id: string;
  email: string;
  totalCents: number;
  lastStep: string;
  sentCount: number;
  state: RecoveryState;
  itemCount: number;
  createdAt: Date;
  lastSentAt: Date | null;
}

function stateOf(stoppedReason: string): RecoveryState {
  if (stoppedReason === "converted") return "converted";
  if (stoppedReason === "unsubscribed") return "unsubscribed";
  if (stoppedReason === "completed") return "completed";
  if (stoppedReason === "failed") return "failed";
  return "active";
}

export async function listRecoveries(options: {
  state?: RecoveryState;
  page: number;
  perPage: number;
}): Promise<{ rows: RecoveryRow[]; total: number }> {
  // Le filtre porte sur stoppedReason, pas sur un champ « state » : l'état est
  // dérivé, pas stocké — un champ de plus serait une source de contradiction.
  const where =
    options.state === undefined
      ? {}
      : options.state === "active"
        ? { stoppedAt: null }
        : { stoppedReason: options.state };

  const [rows, total] = await Promise.all([
    prisma.checkoutRecovery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.perPage,
      take: options.perPage,
    }),
    prisma.checkoutRecovery.count({ where }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      email: row.email,
      totalCents: row.totalCents,
      lastStep: row.lastStep,
      sentCount: row.sentCount,
      state: stateOf(row.stoppedReason),
      itemCount: decodeCart(row.cartJson).reduce((sum, line) => sum + line.quantity, 0),
      createdAt: row.createdAt,
      lastSentAt: row.lastSentAt,
    })),
    total,
  };
}

/**
 * Compteurs sur la fenêtre de conservation. Inutile de remonter plus loin : la
 * purge efface au-delà, un taux calculé sur une période plus longue serait
 * faux par construction.
 */
export async function recoveryStats(): Promise<{
  captured: number;
  sent: number;
  converted: number;
  ratePercent: number;
}> {
  const since = new Date(Date.now() - RECOVERY_RETENTION_DAYS * 24 * 60 * 60_000);
  const where = { createdAt: { gte: since } };

  const [captured, converted, sentAggregate] = await Promise.all([
    prisma.checkoutRecovery.count({ where }),
    prisma.checkoutRecovery.count({ where: { ...where, stoppedReason: "converted" } }),
    prisma.checkoutRecovery.aggregate({ where, _sum: { sentCount: true } }),
  ]);

  return {
    captured,
    sent: sentAggregate._sum.sentCount ?? 0,
    converted,
    ratePercent: captured === 0 ? 0 : Math.round((converted / captured) * 100),
  };
}
```

- [ ] **Step 2 : Écrire la route d'actions**

Créer `src/app/api/admin/recovery/route.ts` :

```ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { prisma } from "@/server/prisma";
import { setRecoveryEnabled, stopRecoveryForEmail } from "@/server/checkoutRecovery";

// Actions du back-office sur les relances de panier.
//
// Deux actions, et deux seulement :
//   { action: "toggle", enabled: boolean }  -> interrupteur global
//   { action: "stop", id: string }          -> arrêt d'une séquence
//
// Pas d'action « envoyer maintenant » : la séquence est automatique, et un
// bouton d'envoi manuel ouvrirait la porte à des messages vers des adresses qui
// n'ont rien demandé.

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (payload.action === "toggle") {
    if (typeof payload.enabled !== "boolean") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    await setRecoveryEnabled(payload.enabled);
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "stop") {
    if (typeof payload.id !== "string") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const row = await prisma.checkoutRecovery.findUnique({
      where: { id: payload.id },
      select: { email: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Séquence introuvable." }, { status: 404 });
    }
    // Arrêt décidé par un administrateur : ce n'est ni une conversion ni un
    // désabonnement du client, donc « failed », le seul motif qui reste juste.
    await stopRecoveryForEmail(row.email, "failed");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
```

- [ ] **Step 3 : Écrire la page**

Créer `src/app/admin/(protected)/warenkorb-erinnerungen/page.tsx`, calquée sur `src/app/admin/(protected)/orders/page.tsx` — même en-tête, même gestion de `searchParams` pour la page et le filtre, même composant de pagination.

Elle appelle `recoveryStats()`, `listRecoveries()` et `isRecoveryEnabled()`, puis rend quatre tuiles de compteurs et `<RecoveryTable …>`.

Libellés allemands des tuiles : `Erfasste Warenkörbe`, `Gesendete Nachrichten`, `Abgeschlossene Bestellungen`, `Rückgewinnungsquote`. Sous-titre de la page : `Letzte 30 Tage` — la même fenêtre que la purge, sinon le taux ne veut rien dire.

- [ ] **Step 4 : Écrire le tableau**

Créer `src/components/admin/RecoveryTable.tsx`, composant client sur le modèle de `src/components/admin/PaymentMethodTable.tsx`.

Colonnes : `E-Mail`, `Warenkorb` (montant et nombre d'articles), `Schritt`, `Nachrichten` (`sentCount` sur 4), `Status`, `Erfasst am`, `Letzte Nachricht`, action.

Libellés d'état, en allemand : `Läuft`, `Bestellt`, `Abgemeldet`, `Abgeschlossen`, `Fehlgeschlagen`. Étapes : `Kontakt`, `Zahlung`, `Prüfung`.

En tête du tableau, l'interrupteur global : une case à cocher étiquetée `Erinnerungen aktiv`, qui poste `{ action: "toggle", enabled }` puis rafraîchit via `router.refresh()`. Une confirmation `window.confirm` à la désactivation, avec le texte `Keine Warenkorb-Erinnerungen mehr senden?` — couper la séquence est une décision, pas une case qu'on décoche par mégarde.

Action de ligne, visible seulement quand l'état vaut `Läuft` : un bouton `Stoppen` qui poste `{ action: "stop", id }`.

- [ ] **Step 5 : Ajouter l'entrée de navigation**

Dans `src/components/admin/AdminSidebar.tsx`, ajouter l'entrée à la suite de celle des commandes : libellé `Warenkorb-Erinnerungen`, chemin `/admin/warenkorb-erinnerungen`, icône `mail-warning` de lucide-react. Suivre exactement la forme des entrées existantes.

- [ ] **Step 6 : Vérifier dans le navigateur**

```bash
npm run dev
```

1. Se connecter au back-office, ouvrir `/admin/warenkorb-erinnerungen`.
2. Vérifier les quatre compteurs et le tableau, avec au moins une session créée aux tâches précédentes.
3. Filtrer par état, changer de page.
4. Cliquer `Stoppen` sur une séquence active : l'état passe à `Fehlgeschlagen` et l'action disparaît.
5. Décocher `Erinnerungen aktiv`, confirmer, puis vérifier :

```bash
curl -X POST http://localhost:3000/api/cron/recovery -H "Authorization: Bearer $RECOVERY_CRON_SECRET"
```

Attendu : `{"sent":0,…}` même avec une échéance dépassée. Recocher et vérifier que le tick repart.

6. Se déconnecter et appeler `POST /api/admin/recovery` : réponse 401.

- [ ] **Step 7 : Vérifier la compilation**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 8 : Commit**

```bash
git add src/server/checkoutRecovery.ts src/app/admin/\(protected\)/warenkorb-erinnerungen src/components/admin/RecoveryTable.tsx src/app/api/admin/recovery src/components/admin/AdminSidebar.tsx
git commit -m "Suivre les relances de panier depuis le back-office"
```

---

### Task 9 : Mention de protection des données et vérification finale

**Files:**
- Modify: `src/content/legal/de.ts` (page `datenschutz`)
- Modify: `src/content/legal/en.ts` (page `datenschutz`)
- Modify: `docs/HANDOVER.md`

**Interfaces:** aucune.

- [ ] **Step 1 : Relire le contrat du contenu légal**

```bash
cat src/content/legal/types.ts
```

Deux règles à respecter, elles sont écrites dans le fichier : le corps d'une `LegalSection` est du **texte simple**, jamais de HTML, et les paragraphes sont séparés par `\n\n`. Aucun markdown, aucune balise, aucun astérisque de mise en gras.

- [ ] **Step 2 : Insérer la section allemande**

Dans `src/content/legal/de.ts`, page `datenschutz`, insérer une nouvelle section **juste après « 10. Newsletter »** — les deux traitent d'envois par e-mail, la lecture reste cohérente — puis **renuméroter les dix sections suivantes**, de l'ancienne 11 à l'ancienne 20, qui deviennent 12 à 21.

```ts
      {
        heading: "11. Warenkorb-Erinnerungen",
        body: "Wenn Sie im Bestellvorgang Ihre E-Mail-Adresse eingeben, die Bestellung aber nicht abschließen, speichern wir Ihre E-Mail-Adresse, die gewählten Artikel, die Beträge und den Zeitpunkt des Abbruchs.\n\nWir verwenden diese Daten, um Ihnen innerhalb von sieben Tagen bis zu vier Erinnerungen an Ihren Warenkorb zu senden und Ihnen bei Problemen im Bestellvorgang zu helfen. Rechtsgrundlage ist unser berechtigtes Interesse an der Wiederaufnahme abgebrochener Bestellvorgänge (Art. 6 Abs. 1 lit. f DSGVO).\n\nSie können dieser Verarbeitung jederzeit widersprechen. Jede Nachricht enthält am Ende einen Abmeldelink. Nach der Abmeldung erhalten Sie weder weitere Erinnerungen noch Angebote von uns. Die gespeicherten Daten werden spätestens 30 Tage nach dem Abbruch automatisch gelöscht, sofern keine Bestellung zustande kommt.",
      },
```

Vérifier après l'insertion qu'aucun numéro n'apparaît deux fois :

```bash
grep -n 'heading: "[0-9]' src/content/legal/de.ts | sed -n '1,25p'
```

- [ ] **Step 3 : Insérer la section anglaise**

Dans `src/content/legal/en.ts`, page `datenschutz`, même position et même renumérotation :

```ts
      {
        heading: "11. Shopping cart reminders",
        body: "If you enter your email address during checkout but do not complete the order, we store your email address, the selected items, the amounts and the time you left.\n\nWe use this data to send you up to four reminders about your shopping cart within seven days, and to help you if something went wrong during checkout. The legal basis is our legitimate interest in recovering abandoned checkouts (Art. 6(1)(f) GDPR).\n\nYou may object at any time. Every message contains an unsubscribe link at the bottom. Once you unsubscribe, you will receive neither further reminders nor offers from us. The stored data is deleted automatically no later than 30 days after the checkout was abandoned, unless an order is placed.",
      },
```

- [ ] **Step 3 : Documenter dans le dossier de reprise**

Ajouter une section à `docs/HANDOVER.md` : ce que fait la séquence, où vit le planificateur, comment couper l'envoi depuis le back-office, et l'avertissement sur l'hébergement — le tick vit dans le processus Node, donc en serverless il faudrait appeler `POST /api/cron/recovery` depuis un cron externe.

Y noter aussi le point juridique, pour qui reprendra le dossier : l'envoi se fait sans consentement préalable, ce qui est un choix assumé du propriétaire malgré le § 7 UWG ; les garde-fous sont le cadrage du premier message en message de support, le lien de désabonnement dans les quatre messages, et l'interrupteur du back-office.

- [ ] **Step 4 : Vérification complète**

```bash
npm run test:recovery
npx tsc --noEmit
npm run lint
npm run build
```

Les quatre doivent passer. Ouvrir ensuite les quatre aperçus une dernière fois :

```bash
open .next/cache/recovery-preview/mail-1.html
```

- [ ] **Step 5 : Parcours manuel de bout en bout**

Dérouler la liste complète de la section « Vérification » de la spec, dans l'ordre, points 1 à 7. Chaque point doit être constaté, pas supposé. Si l'un échoue, corriger avant de conclure.

- [ ] **Step 6 : Commit**

```bash
git add src/content/legal/de.ts src/content/legal/en.ts docs/HANDOVER.md
git commit -m "Documenter les relances de panier côté protection des données"
```

---

## Points de vigilance

**Ne jamais faire échouer une commande.** La capture, l'arrêt de séquence et le tick sont tous secondaires par rapport au tunnel. Chacun est appelé hors transaction, sous `try`, et son échec ne remonte pas.

**Les prix viennent toujours de la base.** Ni la capture ni le rendu ne font confiance à un montant venu du navigateur. Un message annonçant un prix que le tunnel ne facturera pas est une publicité trompeuse.

**Un seul intervalle.** Le drapeau sur `globalThis` dans `src/server/scheduler.ts` est ce qui empêche le rechargement à chaud d'empiler les timers. S'il disparaît, les envois se dupliquent en développement.

**Le verrou n'est pas décoratif.** `claimedAt` posé par un `updateMany` conditionnel est la seule chose qui garantisse qu'un client ne reçoive pas deux fois le même message quand deux ticks se chevauchent.

**Le désabonnement est définitif et partagé.** Il écrit dans `EmailSuppression`, la table des campagnes marketing. Ne pas créer de seconde liste : c'est précisément ce que la spec écarte.

**Aucun emoji, aucun texte inventé.** Les contenus allemands sont figés dans la spec. Une reformulation « pour faire mieux » est un écart, pas une amélioration.
