import { NextResponse } from "next/server";
import { COMPANY } from "@/content/legal";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildQuoteRequestCustomerEmail, buildQuoteRequestShopEmail } from "@/server/emails/quoteRequest";
import { createQuoteRequest, isQuoteRequestSalutation } from "@/server/quotes";
import { isCountryCode, isValidPostalCode } from "@/lib/countries";
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
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestboxcontainer.de").replace(/\/+$/, "");
}

/**
 * Avertit la boutique par e-mail, en plus de l'enregistrement en base.
 *
 * Si Resend n'est pas configuré (voir src/lib/mailer.ts), `isMailConfigured()`
 * vaut alors false et cette fonction ne fait rien. La demande reste malgré
 * tout visible dans /admin/devis, qui est la source de vérité, pas cet e-mail.
 */
async function notifierBoutique(input: {
  productName: string;
  productSku?: string;
  productUrl: string;
  salutation?: "herr" | "frau";
  name: string;
  email: string;
  phone?: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  message: string;
  adminUrl: string;
}): Promise<void> {
  if (!isMailConfigured()) return;
  await sendMail({ to: COMPANY.email, ...buildQuoteRequestShopEmail(input) });
}

/** Accuse réception auprès du client, dès que Resend est configuré. */
async function confirmerAuClient(input: {
  to: string;
  name: string;
  productName: string;
  productUrl: string;
}): Promise<void> {
  if (!isMailConfigured()) return;
  await sendMail({ to: input.to, ...buildQuoteRequestCustomerEmail(input) });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const productHref = readString(payload.productHref);
  const rawSalutation = readString(payload.salutation).toLowerCase();
  const salutation = isQuoteRequestSalutation(rawSalutation) ? rawSalutation : undefined;
  const firstName = readString(payload.firstName);
  const lastName = readString(payload.lastName);
  const name = `${firstName} ${lastName}`.trim();
  const email = readString(payload.email);
  const phone = readString(payload.phone);
  const street = readString(payload.street);
  const postalCode = readString(payload.postalCode).toUpperCase();
  const city = readString(payload.city);
  const country = readString(payload.country).toUpperCase();
  const message = readString(payload.message);

  if (firstName.length < 2 || firstName.length > 80) {
    return NextResponse.json({ error: "Bitte geben Sie einen Vornamen mit 2 bis 80 Zeichen an." }, { status: 400 });
  }
  if (lastName.length < 2 || lastName.length > 80) {
    return NextResponse.json({ error: "Bitte geben Sie einen Nachnamen mit 2 bis 80 Zeichen an." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse an." }, { status: 400 });
  }
  if (phone.length < 4 || phone.length > 40) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige Telefonnummer an." }, { status: 400 });
  }
  if (street.length < 4 || street.length > 160) {
    return NextResponse.json({ error: "Bitte geben Sie Straße und Hausnummer an." }, { status: 400 });
  }
  if (!isCountryCode(country)) {
    return NextResponse.json({ error: "Bitte wählen Sie ein Land aus." }, { status: 400 });
  }
  // Le format du code postal n'est vérifié que pour les pays dont on connaît la
  // règle ; ailleurs, seul un champ vide est refusé.
  if (!isValidPostalCode(country, postalCode) || postalCode.length > 12) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige Postleitzahl an." }, { status: 400 });
  }
  if (city.length < 2 || city.length > 80) {
    return NextResponse.json({ error: "Bitte geben Sie einen Ort an." }, { status: 400 });
  }
  // Obligatoire : si le client demande un devis plutôt que de payer
  // directement, c'est justement parce qu'il a quelque chose à préciser ou
  // modifier — un champ vide ou trop court n'apporte rien à traiter.
  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { error: "Bitte beschreiben Sie kurz, was Sie an diesem Container ändern oder ergänzen möchten." },
      { status: 400 },
    );
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
    salutation,
    firstName,
    lastName,
    email,
    phone: phone || undefined,
    street,
    postalCode,
    city,
    country,
    message,
  });
  registerSubmission(rateKey);

  const adminUrl = `${siteUrl()}/admin/devis`;
  try {
    await notifierBoutique({
      productName,
      productSku: product.sku,
      productUrl,
      salutation,
      name,
      email,
      phone: phone || undefined,
      street,
      postalCode,
      city,
      country,
      message,
      adminUrl,
    });
    await confirmerAuClient({ to: email, name: firstName, productName, productUrl });
  } catch (error) {
    // L'enregistrement a déjà réussi : un e-mail qui échoue ne doit pas faire
    // perdre la demande, seulement se voir dans les journaux du serveur.
    console.error("[devis] envoi d'e-mail impossible", error);
  }

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
