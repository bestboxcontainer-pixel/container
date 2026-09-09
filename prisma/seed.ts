/**
 * Remplit la base avec le catalogue JSON d'origine, les moyens de paiement et
 * intégrations par défaut, ainsi que le premier compte administrateur.
 * Lancement : npm run db:seed
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
// Le client de l'application, pour que le seed vise exactement la même base
// que le site : un second createClient() avait fini par diverger.
import { prisma } from "../src/server/prisma";
import { hashPassword } from "../src/lib/password";
import { slugify } from "../src/lib/slugify";

interface JsonGuideSection {
  heading: string;
  body: string;
}

interface JsonCategory {
  id: string;
  group: string;
  slug: string;
  label: string;
  description: string;
  image: string;
  guide?: { intro: string; sections: JsonGuideSection[]; closing: string };
}

interface JsonProduct {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  /**
   * Slug figé. Sans lui, l'URL est dérivée de la marque et du nom : renommer un
   * produit changerait alors son adresse et son identifiant d'offre Google
   * (Merchant Center y verrait un nouveau produit, sans historique).
   */
  slug?: string;
  bullets: string[];
  image?: string;
  oldPrice?: string;
  price: string;
  badge?: string;
  rating?: number;
  inStock?: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  container: "Container",
};

/** "1.399,00 €" -> 139900 (centimes) */
function toCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  return Math.round(Number.parseFloat(normalized) * 100);
}

function skuFor(brand: string, name: string): string {
  return slugify(`${brand}-${name}`).replace(/-/g, "").slice(0, 10).toUpperCase();
}

async function readJson<T>(file: string): Promise<T[]> {
  const raw = await readFile(path.join(process.cwd(), "data", "store", file), "utf-8");
  return JSON.parse(raw) as T[];
}

async function seedCatalog(): Promise<void> {
  const [categories, products] = await Promise.all([
    readJson<JsonCategory>("categories.json"),
    readJson<JsonProduct>("products.json"),
  ]);

  const groupSlugs = Array.from(new Set(categories.map((category) => category.group)));
  const groupIds = new Map<string, string>();

  // Les groupes absents du catalogue sont retires : sans cela, un ancien
  // rayon survivait a chaque execution et la boutique servait deux fonds a la
  // fois. La cascade emporte categories et produits.
  const obsoletes = await prisma.group.deleteMany({ where: { slug: { notIn: groupSlugs } } });
  if (obsoletes.count > 0) {
    console.log(`Groupes obsoletes supprimes : ${obsoletes.count}`);
  }

  for (const [index, slug] of groupSlugs.entries()) {
    const group = await prisma.group.upsert({
      where: { slug },
      update: { label: GROUP_LABELS[slug] ?? slug, position: index },
      create: { slug, label: GROUP_LABELS[slug] ?? slug, position: index },
    });
    groupIds.set(slug, group.id);
  }

  const categoryIds = new Map<string, string>();

  for (const [index, entry] of categories.entries()) {
    const groupId = groupIds.get(entry.group);
    if (!groupId) continue;

    const created = await prisma.category.upsert({
      where: { groupId_slug: { groupId, slug: entry.slug } },
      update: {
        label: entry.label,
        description: entry.description,
        image: entry.image,
        guideIntro: entry.guide?.intro ?? "",
        guideClosing: entry.guide?.closing ?? "",
        position: index,
      },
      create: {
        groupId,
        slug: entry.slug,
        label: entry.label,
        description: entry.description,
        image: entry.image,
        guideIntro: entry.guide?.intro ?? "",
        guideClosing: entry.guide?.closing ?? "",
        position: index,
      },
    });
    categoryIds.set(entry.id, created.id);

    await prisma.guideSection.deleteMany({ where: { categoryId: created.id } });
    if (entry.guide?.sections?.length) {
      await prisma.guideSection.createMany({
        data: entry.guide.sections.map((section, position) => ({
          categoryId: created.id,
          heading: section.heading,
          body: section.body,
          position,
        })),
      });
    }
  }

  for (const entry of products) {
    const categoryId = categoryIds.get(entry.categoryId);
    if (!categoryId) continue;

    const slug = entry.slug?.trim() || slugify(`${entry.brand}-${entry.name}`);
    // Les articles hors stock partent à 0, les autres à une valeur de départ
    // plausible, ajustable tout de suite depuis le back-office.
    const stock = entry.inStock === false ? 0 : 12;

    await prisma.product.upsert({
      where: { slug },
      update: {
        categoryId,
        brand: entry.brand,
        name: entry.name,
        sku: skuFor(entry.brand, entry.name),
        bullets: JSON.stringify(entry.bullets ?? []),
        image: entry.image ?? null,
        priceCents: toCents(entry.price),
        oldPriceCents: entry.oldPrice ? toCents(entry.oldPrice) : null,
        badge: entry.badge ?? null,
        editorialRating: entry.rating ?? null,
        stock,
      },
      create: {
        categoryId,
        brand: entry.brand,
        name: entry.name,
        slug,
        sku: skuFor(entry.brand, entry.name),
        shortDescription: "",
        description: "",
        bullets: JSON.stringify(entry.bullets ?? []),
        image: entry.image ?? null,
        priceCents: toCents(entry.price),
        oldPriceCents: entry.oldPrice ? toCents(entry.oldPrice) : null,
        badge: entry.badge ?? null,
        editorialRating: entry.rating ?? null,
        stock,
      },
    });
  }

  console.log(`Katalog: ${groupSlugs.length} Gruppen, ${categories.length} Kategorien, ${products.length} Produkte`);
}

// Deux moyens seulement, ceux réellement encaissés : la Vorkasse (virement,
// aucun prestataire à configurer) et la carte via Stripe. PayPal,
// Sofortüberweisung et SEPA-Lastschrift ont été retirés : aucun contrat, et un
// logo affiché mais absent du tunnel se lit comme une information trompeuse
// (voir aussi PaymentMethodsBar).
//
// Aucun n'annonce de remise : le tunnel de commande ne sait pas en appliquer.
const PAYMENT_METHODS = [
  {
    key: "vorkasse",
    label: "Vorkasse per Überweisung",
    description: "Versand nach Zahlungseingang.",
    icon: "landmark",
    feeLabel: "kostenlos",
    position: 0,
  },
  {
    key: "kreditkarte",
    label: "Kredit- und Debitkarte",
    description: "Visa, Mastercard und American Express, abgewickelt über Stripe.",
    icon: "credit-card",
    feeLabel: "kostenlos",
    position: 1,
  },
];

const INTEGRATIONS = [
  {
    key: "stripe_secret_key",
    label: "Stripe Secret Key",
    description: "Serverseitiger Schlüssel für Kartenzahlungen (sk_live_…).",
  },
  {
    key: "stripe_webhook_secret",
    label: "Stripe Webhook Secret",
    description: "Signaturprüfung eingehender Stripe-Webhooks (whsec_…).",
  },
  // Ni SMTP ni Cloudinary ici : l'envoi d'e-mails et le stockage des images se
  // configurent uniquement par variables d'environnement (voir docs/HANDOVER.md
  // et docs/IMAGES.md). Ce tableau ne garde que les clés métier.
];

async function seedShopConfig(): Promise<void> {
  for (const method of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { key: method.key },
      update: {},
      create: method,
    });
  }

  for (const integration of INTEGRATIONS) {
    await prisma.integration.upsert({
      where: { key: integration.key },
      update: {},
      create: integration,
    });
  }

  console.log(`Konfiguration: ${PAYMENT_METHODS.length} Zahlungsarten, ${INTEGRATIONS.length} Integrationen`);
}

async function seedAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me";

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrator",
      passwordHash: hashPassword(password),
      role: "owner",
    },
  });

  console.log(`Admin-Zugang: ${email}`);
}

async function main(): Promise<void> {
  await seedCatalog();
  await seedShopConfig();
  await seedAdmin();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
