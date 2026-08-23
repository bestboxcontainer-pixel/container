/**
 * Gabarits des e-mails de l'espace client.
 *
 * Mêmes contraintes que src/server/emails/adminOtp.ts : mise en page en
 * tableaux, styles en ligne, `color-scheme: light` pour empêcher l'inversion
 * automatique des couleurs, fonds déclarés sur chaque cellule.
 *
 * Ces messages partent vers des clients : ils sont rédigés en allemand, avec
 * une version anglaise complète choisie d'après la langue du compte.
 */

import { emailLogoSrc } from "@/server/brandLogo";
import type { MailMessage } from "@/lib/mailer";

export type EmailLocale = "de" | "en";

const LOGO_WIDTH = 220;
// Rapport d'origine du fichier : 1242 × 406
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 406) / 1242);

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface LayoutInput {
  locale: EmailLocale;
  preheader: string;
  heading: string;
  /** Paragraphes déjà échappés côté appelant si besoin. */
  paragraphs: string[];
  action?: { label: string; url: string };
  footnote?: string;
  /** Lien discret de désabonnement, ajouté sous la mention automatique. */
  unsubscribe?: { label: string; url: string };
}

/** Ossature commune : logo, filet rouge, contenu, pied de page. */
export function layout(input: LayoutInput): string {
  // Image jointe au message plutôt que chargée depuis le site : elle s'affiche
  // même sans adresse publique renseignée, et sans être bloquée par la
  // messagerie. La pièce jointe est ajoutée par sendMail.
  const logo = emailLogoSrc();
  const lang = input.locale;
  const footer =
    lang === "en"
      ? "BBC Best Box Containerhandel e.K., automated message, please do not reply."
      : "BBC Best Box Containerhandel e.K., automatische Nachricht, bitte nicht antworten.";

  const body = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:19px; line-height:29px; color:#3f4854;">${paragraph}</p>`,
    )
    .join("\n");

  const action = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
                  <tr>
                    <td align="center" bgcolor="#e3000e" style="background-color:#e3000e; border-radius:4px;">
                      <a href="${escapeHtml(input.action.url)}" style="display:inline-block; padding:14px 28px; font-family:Arial,Helvetica,sans-serif; font-size:19px; font-weight:bold; color:#ffffff; text-decoration:none;">${escapeHtml(input.action.label)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#4b5563; word-break:break-all;">${escapeHtml(input.action.url)}</p>`
    : "";

  const footnote = input.footnote
    ? `<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:25px; color:#4b5563;">${input.footnote}</p>`
    : "";

  const unsubscribeLink = input.unsubscribe
    ? `<p style="margin:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:22px; color:#8a8f98;">
                    <a href="${escapeHtml(input.unsubscribe.url)}" style="color:#8a8f98; text-decoration:underline;">${escapeHtml(input.unsubscribe.label)}</a>
                  </p>`
    : "";

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f1f2f4; color-scheme:light;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(input.preheader)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f2f4;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border:1px solid #e0e2e6; border-radius:6px;">
            <tr>
              <td align="center" style="background-color:#ffffff; padding:32px 24px 24px 24px; border-radius:6px 6px 0 0;">
                <img src="${logo}" alt="BBC Best Box Containerhandel e.K." width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" style="display:block; width:${LOGO_WIDTH}px; height:auto; border:0; outline:none; text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="background-color:#e3000e; font-size:0; line-height:0; height:4px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:27px; line-height:35px; font-weight:bold; color:#001424;">${escapeHtml(input.heading)}</h1>
                ${body}
                ${action}
                ${footnote}
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; padding:0 32px 32px 32px;">&nbsp;</td>
            </tr>
          </table>

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%;">
            <tr>
              <td align="center" style="padding:20px 16px 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#4b5563;">
                ${escapeHtml(footer)}
                ${unsubscribeLink}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---- Réinitialisation du mot de passe ----

export interface PasswordResetEmailInput {
  locale: EmailLocale;
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): Omit<MailMessage, "to"> {
  const name = escapeHtml(input.firstName);
  const de = input.locale === "de";

  const heading = de ? "Passwort zurücksetzen" : "Reset your password";
  const paragraphs = de
    ? [
        `Hallo ${name},`,
        "für Ihr Kundenkonto wurde eine Zurücksetzung des Passworts angefordert. Über den folgenden Link vergeben Sie ein neues Passwort.",
      ]
    : [
        `Hello ${name},`,
        "a password reset was requested for your customer account. Use the link below to choose a new password.",
      ];

  const footnote = de
    ? `Der Link ist ${input.expiresInMinutes} Minuten gültig und kann nur einmal verwendet werden. Haben Sie die Zurücksetzung nicht angefordert, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.`
    : `The link is valid for ${input.expiresInMinutes} minutes and can be used only once. If you did not request the reset, simply ignore this email, your password stays unchanged.`;

  const html = layout({
    locale: input.locale,
    preheader: de ? "Neues Passwort für Ihr Kundenkonto" : "New password for your customer account",
    heading,
    paragraphs,
    action: { label: de ? "Neues Passwort vergeben" : "Choose a new password", url: input.resetUrl },
    footnote: escapeHtml(footnote),
  });

  const text = [
    heading,
    "",
    ...(de
      ? [
          `Hallo ${input.firstName},`,
          "für Ihr Kundenkonto wurde eine Zurücksetzung des Passworts angefordert.",
        ]
      : [
          `Hello ${input.firstName},`,
          "a password reset was requested for your customer account.",
        ]),
    "",
    input.resetUrl,
    "",
    footnote,
  ].join("\n");

  return { subject: de ? "Passwort zurücksetzen" : "Reset your password", html, text };
}

// ---- Confirmation d'inscription ----

export interface WelcomeEmailInput {
  locale: EmailLocale;
  firstName: string;
}

export function buildWelcomeEmail(input: WelcomeEmailInput): Omit<MailMessage, "to"> {
  const name = escapeHtml(input.firstName);
  const de = input.locale === "de";
  const url = `${siteUrl()}${de ? "" : "/en"}/konto/anmelden`;

  const heading = de ? "Ihr Kundenkonto ist angelegt" : "Your customer account is ready";
  const paragraphs = de
    ? [
        `Hallo ${name},`,
        "Ihr Kundenkonto bei BBC Best Box Containerhandel e.K. wurde angelegt. Sie können sich ab sofort anmelden, Ihre Bestellungen einsehen und Ihre Adressen verwalten.",
      ]
    : [
        `Hello ${name},`,
        "your BBC Best Box Containerhandel e.K. customer account has been created. You can sign in right away to review your orders and manage your addresses.",
      ];

  const footnote = de
    ? "Ein Konto ist bei uns freiwillig: Sie können jederzeit auch ohne Konto als Gast bestellen. Ihr Konto und alle Daten darin können Sie jederzeit selbst löschen."
    : "An account is always optional: you can order as a guest at any time. You can delete your account and its data yourself whenever you want.";

  const html = layout({
    locale: input.locale,
    preheader: heading,
    heading,
    paragraphs,
    action: { label: de ? "Zum Kundenkonto" : "Go to my account", url },
    footnote: escapeHtml(footnote),
  });

  const text = [heading, "", ...paragraphs.map((p) => p.replace(/&[a-z]+;/g, "")), "", url, "", footnote].join(
    "\n",
  );

  return { subject: heading, html, text };
}

// ---- Tentative d'inscription sur une adresse déjà utilisée ----
// Envoyé au titulaire du compte existant : la réponse HTTP, elle, reste
// strictement identique à celle d'une inscription réussie, pour qu'un tiers ne
// puisse pas découvrir quelles adresses sont enregistrées (OWASP, énumération
// de comptes).

export function buildExistingAccountEmail(input: WelcomeEmailInput): Omit<MailMessage, "to"> {
  const name = escapeHtml(input.firstName);
  const de = input.locale === "de";
  const url = `${siteUrl()}${de ? "" : "/en"}/konto/passwort-vergessen`;

  const heading = de ? "Es besteht bereits ein Konto" : "An account already exists";
  const paragraphs = de
    ? [
        `Hallo ${name},`,
        "mit Ihrer E-Mail-Adresse wurde gerade versucht, ein neues Kundenkonto anzulegen. Ein Konto besteht für diese Adresse bereits, deshalb wurde kein zweites erstellt.",
        "Falls Sie das waren und Ihr Passwort nicht mehr wissen, setzen Sie es einfach zurück.",
      ]
    : [
        `Hello ${name},`,
        "someone just tried to create a new customer account with your email address. An account already exists for it, so no second one was created.",
        "If that was you and you no longer remember your password, simply reset it.",
      ];

  const footnote = de
    ? "Waren Sie das nicht, müssen Sie nichts tun. Ihr Konto und Ihr Passwort wurden nicht verändert."
    : "If this was not you, no action is needed. Your account and password have not been changed.";

  const html = layout({
    locale: input.locale,
    preheader: heading,
    heading,
    paragraphs,
    action: { label: de ? "Passwort zurücksetzen" : "Reset password", url },
    footnote: escapeHtml(footnote),
  });

  const text = [heading, "", ...paragraphs, "", url, "", footnote].join("\n");

  return { subject: heading, html, text };
}
