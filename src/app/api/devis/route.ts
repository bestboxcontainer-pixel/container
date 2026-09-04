import { NextResponse } from "next/server";
import { COMPANY } from "@/content/legal";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { createQuoteRequest } from "@/server/quotes";
import { getProductBySlug } from "@/server/store";

// Anti-spam minimaliste, même principe que /api/reviews : un compteur en
// mémoire de processus, largement suffisant pour un serveur unique.
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

interface SubmissionWindow {
  count: number;
  firstSubmissionAt: number;
}

const submissions = new Map<string, SubmissionWindow>();

function checkRate(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const entry = submissions.get(key);
  if (!entry) return { allowed: true, retryAfterSeconds: 0 };

  const elapsed = Date.now() - entry.firstSubmissionAt;
  if (elapsed > WINDOW_MS) {
    submissions.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count < MAX_SUBMISSIONS_PER_WINDOW) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((WINDOW_MS - elapsed) / 1000) };
}

function registerSubmission(key: string): void {
  const entry = submissions.get(key);
  if (!entry || Date.now() - entry.firstSubmissionAt > WINDOW_MS) {
    submissions.set(key, { count: 1, firstSubmissionAt: Date.now() });
    return;
  }
  entry.count += 1;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestbox-containerhandel.de").replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Avertit la boutique par e-mail, en plus de l'enregistrement en base.
 *
 * Le SMTP n'est pas configuré à ce jour (voir src/lib/mailer.ts) :
 * `isMailConfigured()` vaut alors false et cette fonction ne fait rien. La
 * demande reste malgré tout visible dans /admin/devis, qui est la source de
 * vérité, pas cet e-mail.
 */
async function notifierBoutique(input: {
  productName: string;
  productSku?: string;
  productUrl: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  adminUrl: string;
}): Promise<void> {
  if (!isMailConfigured()) return;

  const lignes = [
    `Produit : ${input.productName}${input.productSku ? ` (${input.productSku})` : ""}`,
    `Lien : ${input.productUrl}`,
    `Client : ${input.name}`,
    `E-mail : ${input.email}`,
    ...(input.phone ? [`Téléphone : ${input.phone}`] : []),
    ...(input.message ? [`Message : ${input.message}`] : []),
  ];

  await sendMail({
    to: COMPANY.email,
    subject: `Neue Angebotsanfrage: ${input.productName}`,
    text: `${lignes.join("\n")}\n\nIm Backoffice ansehen: ${input.adminUrl}`,
    html: `<p>${lignes.map(escapeHtml).join("<br>")}</p><p><a href="${input.adminUrl}">Im Backoffice ansehen</a></p>`,
  });
}

/** Accuse réception auprès du client, dès que le SMTP est configuré. */
async function confirmerAuClient(input: {
  to: string;
  name: string;
  productName: string;
}): Promise<void> {
  if (!isMailConfigured()) return;

  const nom = escapeHtml(input.name);
  const produit = escapeHtml(input.productName);
  await sendMail({
    to: input.to,
    subject: `Ihre Angebotsanfrage: ${input.productName}`,
    text: `Hallo ${input.name},\n\nvielen Dank für Ihre Anfrage zu „${input.productName}“. Wir melden uns in Kürze mit einem Angebot.\n\n${COMPANY.name}`,
    html: `<p>Hallo ${nom},</p><p>vielen Dank für Ihre Anfrage zu „${produit}“. Wir melden uns in Kürze mit einem Angebot.</p><p>${escapeHtml(COMPANY.name)}</p>`,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const productHref = readString(payload.productHref);
  const name = readString(payload.name);
  const email = readString(payload.email);
  const phone = readString(payload.phone);
  const message = readString(payload.message);

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Bitte geben Sie einen Namen mit 2 bis 80 Zeichen an." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse an." }, { status: 400 });
  }
  if (phone.length > 40) {
    return NextResponse.json({ error: "Die Telefonnummer ist zu lang." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Ihre Nachricht darf höchstens 2000 Zeichen lang sein." }, { status: 400 });
  }

  // Le produit est relu côté serveur à partir du chemin de sa fiche : le nom,
  // la référence et le prix envoyés par le client ne servent à rien, on ne
  // veut prendre pour argent comptant que ce que le catalogue dit vraiment.
  const segments = productHref.split("/").filter(Boolean);
  const [group, category, slug] = segments;
  if (!group || !category || !slug) {
    return NextResponse.json({ error: "Das Produkt konnte nicht zugeordnet werden." }, { status: 400 });
  }

  const found = await getProductBySlug(group, category, slug);
  if (!found) {
    return NextResponse.json({ error: "Das Produkt wurde nicht gefunden." }, { status: 404 });
  }
  const { product } = found;

  const rateKey = email.toLowerCase();
  const rate = checkRate(rateKey);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const productUrl = `${siteUrl()}${product.href}`;
  const productName = `${product.brand} ${product.name}`;

  const record = await createQuoteRequest({
    productId: product.id,
    productName,
    productSku: product.sku,
    productPriceCents: product.priceCents,
    productUrl,
    name,
    email,
    phone: phone || undefined,
    message: message || undefined,
  });
  registerSubmission(rateKey);

  const adminUrl = `${siteUrl()}/admin/devis`;
  try {
    await notifierBoutique({
      productName,
      productSku: product.sku,
      productUrl,
      name,
      email,
      phone: phone || undefined,
      message,
      adminUrl,
    });
    await confirmerAuClient({ to: email, name, productName });
  } catch (error) {
    // L'enregistrement a déjà réussi : un e-mail qui échoue ne doit pas faire
    // perdre la demande, seulement se voir dans les journaux du serveur.
    console.error("[devis] envoi d'e-mail impossible", error);
  }

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
