/**
 * Gabarits des e-mails déclenchés par le formulaire général de /kontakt (voir
 * src/app/api/contact/route.ts). Même ossature que les demandes de devis
 * (src/server/emails/quoteRequest.ts) : logo, filet rouge, styles en ligne,
 * via le `layout()` partagé de customerAccount.ts.
 */
import { escapeHtml, layout } from "@/server/emails/customerAccount";
import type { MailMessage } from "@/lib/mailer";

/** Encadré gris, même traitement que les autres e-mails transactionnels. */
function panel(title: string, rows: string[]): string {
  const body = rows
    .filter((row) => row.length > 0)
    .map(
      (row) =>
        `<div style="font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:24px; color:#3f4854;">${row}</div>`,
    )
    .join("\n");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0; background-color:#f7f8f9; border:1px solid #d6d9de; border-radius:6px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="margin:0 0 8px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(title)}</div>
                      ${body}
                    </td>
                  </tr>
                </table>`;
}

export interface ContactMessageShopEmailInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  adminUrl: string;
}

/** Notification interne : atterrit dans la boîte de la boutique, pas chez le visiteur. */
export function buildContactMessageShopEmail(input: ContactMessageShopEmailInput): Omit<MailMessage, "to"> {
  const heading = "Neue Kontaktanfrage";

  const html = layout({
    locale: "de",
    preheader: `${input.name} — ${input.message.slice(0, 80)}`,
    heading,
    paragraphs: [
      panel("Kontakt", [
        escapeHtml(input.name),
        `<a href="mailto:${escapeHtml(input.email)}" style="color:#3f4854;">${escapeHtml(input.email)}</a>`,
        input.phone ? escapeHtml(input.phone) : "",
      ]),
      panel("Nachricht", [escapeHtml(input.message).replace(/\n/g, "<br>")]),
    ],
    action: { label: "Im Backoffice ansehen", url: input.adminUrl },
  });

  const lignes = [
    `Name: ${input.name}`,
    `E-Mail: ${input.email}`,
    ...(input.phone ? [`Telefon: ${input.phone}`] : []),
    "",
    `Nachricht: ${input.message}`,
    "",
    `Im Backoffice ansehen: ${input.adminUrl}`,
  ];

  return { subject: `${heading}: ${input.name}`, html, text: lignes.join("\n") };
}

export interface ContactMessageCustomerEmailInput {
  name: string;
}

/** Accusé de réception envoyé au visiteur qui vient d'écrire via le formulaire. */
export function buildContactMessageCustomerEmail(
  input: ContactMessageCustomerEmailInput,
): Omit<MailMessage, "to"> {
  const name = escapeHtml(input.name);
  const heading = "Vielen Dank für Ihre Nachricht";

  const paragraphs = [
    `Hallo ${name},`,
    "vielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen zurück.",
  ];

  const html = layout({ locale: "de", preheader: heading, heading, paragraphs });

  const text = [
    heading,
    "",
    `Hallo ${input.name},`,
    "vielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen zurück.",
  ].join("\n");

  return { subject: "Ihre Nachricht an uns", html, text };
}
