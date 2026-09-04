/**
 * Gabarits des e-mails déclenchés par une demande de devis
 * (« Angebot anfragen » sur la fiche produit, voir src/app/api/devis/route.ts).
 *
 * Même ossature que les autres e-mails transactionnels du dossier : logo,
 * filet rouge, texte en tableaux et styles en ligne, via le `layout()`
 * partagé de customerAccount.ts. C'est ce partage qui garantit le charset et
 * la police déclarés une seule fois pour tous les gabarits, plutôt que
 * reconstruits (et oubliés) à chaque nouveau message.
 */
import { escapeHtml, layout } from "@/server/emails/customerAccount";
import type { MailMessage } from "@/lib/mailer";

/** Encadré gris, même traitement que le panneau adresse des confirmations de commande. */
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

export interface QuoteRequestShopEmailInput {
  productName: string;
  productSku?: string;
  productUrl: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  adminUrl: string;
}

/** Notification interne : atterrit dans la boîte de la boutique, pas chez le client. */
export function buildQuoteRequestShopEmail(input: QuoteRequestShopEmailInput): Omit<MailMessage, "to"> {
  const heading = "Neue Angebotsanfrage";

  const html = layout({
    locale: "de",
    preheader: `${input.productName} — ${input.name}`,
    heading,
    paragraphs: [
      `<strong>${escapeHtml(input.productName)}</strong>${input.productSku ? ` (${escapeHtml(input.productSku)})` : ""}`,
      panel("Kontakt", [
        escapeHtml(input.name),
        `<a href="mailto:${escapeHtml(input.email)}" style="color:#3f4854;">${escapeHtml(input.email)}</a>`,
        input.phone ? escapeHtml(input.phone) : "",
      ]),
      ...(input.message ? [panel("Nachricht", [escapeHtml(input.message).replace(/\n/g, "<br>")])] : []),
    ],
    action: { label: "Produkt ansehen", url: input.productUrl },
  });

  const lignes = [
    `Produkt: ${input.productName}${input.productSku ? ` (${input.productSku})` : ""}`,
    `Link: ${input.productUrl}`,
    `Name: ${input.name}`,
    `E-Mail: ${input.email}`,
    ...(input.phone ? [`Telefon: ${input.phone}`] : []),
    ...(input.message ? [`Nachricht: ${input.message}`] : []),
    "",
    `Im Backoffice ansehen: ${input.adminUrl}`,
  ];

  return { subject: `${heading}: ${input.productName}`, html, text: lignes.join("\n") };
}

export interface QuoteRequestCustomerEmailInput {
  name: string;
  productName: string;
  productUrl: string;
}

/** Accusé de réception envoyé au client qui vient de demander un devis. */
export function buildQuoteRequestCustomerEmail(
  input: QuoteRequestCustomerEmailInput,
): Omit<MailMessage, "to"> {
  const name = escapeHtml(input.name);
  const product = escapeHtml(input.productName);
  const heading = "Vielen Dank für Ihre Anfrage";

  const paragraphs = [
    `Hallo ${name},`,
    `vielen Dank für Ihre Anfrage zu <strong>${product}</strong>. Wir melden uns in Kürze mit einem unverbindlichen Angebot.`,
  ];

  const html = layout({
    locale: "de",
    preheader: heading,
    heading,
    paragraphs,
    action: { label: "Produkt ansehen", url: input.productUrl },
  });

  const text = [
    heading,
    "",
    `Hallo ${input.name},`,
    `vielen Dank für Ihre Anfrage zu ${input.productName}. Wir melden uns in Kürze mit einem unverbindlichen Angebot.`,
    "",
    input.productUrl,
  ].join("\n");

  return { subject: `Ihre Angebotsanfrage: ${input.productName}`, html, text };
}
