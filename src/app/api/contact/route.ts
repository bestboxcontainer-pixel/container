import { NextResponse } from "next/server";
import { COMPANY } from "@/content/legal";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildContactMessageCustomerEmail, buildContactMessageShopEmail } from "@/server/emails/contactMessage";
import { createContactMessage } from "@/server/contact";

// Anti-spam minimaliste, même principe que /api/devis : un compteur en
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

/**
 * Avertit la boutique par e-mail, en plus de l'enregistrement en base.
 *
 * Si Resend n'est pas configuré, `isMailConfigured()` vaut alors false et
 * cette fonction ne fait rien. Le message reste malgré tout visible dans
 * /admin/contact, qui est la source de vérité, pas cet e-mail.
 */
async function notifierBoutique(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  adminUrl: string;
}): Promise<void> {
  if (!isMailConfigured()) return;
  await sendMail({ to: COMPANY.email, ...buildContactMessageShopEmail(input) });
}

/** Accuse réception auprès du visiteur, dès que Resend est configuré. */
async function confirmerAuClient(input: { to: string; name: string }): Promise<void> {
  if (!isMailConfigured()) return;
  await sendMail({ to: input.to, ...buildContactMessageCustomerEmail(input) });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const name = readString(payload.name);
  const email = readString(payload.email);
  const phone = readString(payload.phone);
  const message = readString(payload.message);

  if (name.length < 2 || name.length > 160) {
    return NextResponse.json({ error: "Bitte geben Sie Ihren Namen mit 2 bis 160 Zeichen an." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse an." }, { status: 400 });
  }
  if (phone.length > 40) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige Telefonnummer an." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { error: "Bitte beschreiben Sie Ihr Anliegen mit mindestens 10 Zeichen." },
      { status: 400 },
    );
  }

  const rateKey = email.toLowerCase();
  const rate = checkRate(rateKey);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const record = await createContactMessage({
    name,
    email,
    phone: phone || undefined,
    message,
  });
  registerSubmission(rateKey);

  const adminUrl = `${siteUrl()}/admin/contact`;
  try {
    await notifierBoutique({ name, email, phone: phone || undefined, message, adminUrl });
    await confirmerAuClient({ to: email, name });
  } catch (error) {
    // L'enregistrement a déjà réussi : un e-mail qui échoue ne doit pas faire
    // perdre le message, seulement se voir dans les journaux du serveur.
    console.error("[contact] envoi d'e-mail impossible", error);
  }

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
