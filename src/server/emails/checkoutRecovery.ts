/**
 * Les trois messages de relance des tunnels abandonnés.
 *
 * Mêmes contraintes de mise en page que les autres gabarits du dossier :
 * tableaux, styles en ligne, `color-scheme: light`. C'est la seule entorse
 * autorisée à la règle « pas de style en ligne » du dépôt — aucun client de
 * messagerie ne respecte une feuille de style externe.
 *
 * Le premier message est un message de support, pas une offre : c'est le seul
 * cadrage défendable pour un envoi sans consentement préalable.
 */

import {
  availabilityLabel,
  conditionLabel,
  RECOVERY_COUPON_CODE,
  RECOVERY_COUPON_MIN_SUBTOTAL_CENTS,
  RECOVERY_COUPON_PERCENT,
  RESUME_QUERY_PARAM,
  type RecoveryLine,
} from "@/lib/checkoutRecovery";
import type { MailMessage } from "@/lib/mailer";
import { escapeHtml, layout, siteUrl } from "@/server/emails/customerAccount";

/** Au-delà, le message devient un catalogue : les suivantes sont résumées. */
const MAX_PRODUCT_BLOCKS = 3;

// ---- URL ----

export function resumeUrl(token: string): string {
  return `${siteUrl()}/kasse?${RESUME_QUERY_PARAM}=${token}`;
}

export function unsubscribeUrl(token: string): string {
  return `${siteUrl()}/abmeldung?token=${token}`;
}

function contactUrl(): string {
  return `${siteUrl()}/kontakt`;
}

// ---- Formatage ----

/** Format allemand utilisé partout dans la boutique : « 1.234,56 € ». */
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

// ---- Bloc produit ----

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

/** Bloc du code promotionnel, réservé au troisième message. */
function couponBlock(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0; background-color:#fff5f5; border:1px dashed #e3000e; border-radius:4px;">
                  <tr>
                    <td align="center" style="padding:16px;">
                      <p style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:19px; color:#4b5563;">${RECOVERY_COUPON_PERCENT} % Rabatt mit dem Code</p>
                      <p style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:bold; letter-spacing:1px; color:#e3000e;">${escapeHtml(RECOVERY_COUPON_CODE)}</p>
                      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#6b7280;">Ab ${escapeHtml(formatPrice(RECOVERY_COUPON_MIN_SUBTOTAL_CENTS))} Warenwert, im Warenkorb eingeben.</p>
                    </td>
                  </tr>
                </table>`;
}

// ---- Contenu des trois messages ----

interface MailContent {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  actionLabel: string;
  contactLead: string;
  contactLabel: string;
  /** Réservé au troisième message. */
  showCoupon?: boolean;
}

function contentFor(rank: 1 | 2 | 3): MailContent {
  if (rank === 1) {
    return {
      subject: "Ihr Warenkorb wartet auf Sie",
      preheader: "Wir haben Ihren Warenkorb gespeichert – wir helfen gern weiter.",
      heading: "Ihr Warenkorb ist noch da",
      paragraphs: [
        "Sie haben vor Kurzem eine Bestellung bei Hausgeräte Pfeffer begonnen, sie aber nicht abgeschlossen. Falls etwas nicht geklappt hat oder Sie einfach unterbrochen wurden: Ihr Warenkorb ist weiterhin für Sie gespeichert.",
        "Über den Button unten setzen Sie Ihre Bestellung genau dort fort, wo Sie aufgehört haben – Ihre Angaben sind noch da.",
      ],
      actionLabel: "Bestellung fortsetzen",
      contactLead: "Fragen zu Ihrer Bestellung? Schreiben Sie uns kurz – wir antworten am gleichen Werktag.",
      contactLabel: "Zum Kontaktformular",
    };
  }
  if (rank === 2) {
    return {
      subject: "Ihr Gerät ist noch für Sie verfügbar",
      preheader: "Kostenloser Standardversand, ohne Mindestbestellwert.",
      heading: "Ihr Warenkorb ist noch da",
      paragraphs: [
        "Ihre Auswahl liegt weiterhin in Ihrem Warenkorb. Sie können die Bestellung mit einem Klick abschließen, ohne Ihre Daten erneut eingeben zu müssen.",
        "Gut zu wissen: Der Standardversand ist bei uns immer kostenlos, ohne Mindestbestellwert. Wer es eilig hat, wählt den Expressversand für 70,00 €. Und Sie haben in jedem Fall 14 Tage Widerrufsrecht – passt das Gerät nicht, nehmen wir es zurück.",
      ],
      actionLabel: "Jetzt abschließen",
      contactLead: "Unsicher bei der Auswahl? Wir beraten Sie gern.",
      contactLabel: "Kontakt aufnehmen",
    };
  }
  return {
    subject: "Ihr Warenkorb wird bald gelöscht – 10 % geschenkt",
    preheader: `Nutzen Sie ${RECOVERY_COUPON_PERCENT} % Rabatt auf Ihre Bestellung ab ${RECOVERY_COUPON_MIN_SUBTOTAL_CENTS / 100} €.`,
    heading: "Ihr Warenkorb wird in Kürze gelöscht",
    paragraphs: [
      "Ihr gespeicherter Warenkorb wird bald automatisch gelöscht. Das ist völlig in Ordnung – vielleicht war es nicht das passende Gerät.",
      "Falls Sie sich noch entscheiden möchten, haben wir Ihnen einen Rabattcode mitgeschickt. Geben Sie ihn beim Bezahlen im Warenkorb ein.",
    ],
    actionLabel: "Bestellung fortsetzen",
    contactLead: "Eine konkrete Frage? Schreiben Sie uns.",
    contactLabel: "Kontakt aufnehmen",
    showCoupon: true,
  };
}

// ---- Assemblage ----

export interface RecoveryMailInput {
  rank: 1 | 2 | 3;
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

  // Le bloc produit est inséré avant le dernier paragraphe, pour que le client
  // voie l'appareil avant l'argument, puis le bouton juste après. Le code
  // promotionnel, lui, vient après le total : c'est la dernière chose lue
  // avant le bouton.
  const paragraphs = [
    ...content.paragraphs.map(escapeHtml),
    productBlocks(input.lines),
    `<strong>Gesamtsumme: ${escapeHtml(formatPrice(input.totalCents))}</strong>`,
    ...(content.showCoupon ? [couponBlock()] : []),
  ];

  const html = layout({
    locale: "de",
    preheader: content.preheader,
    heading: content.heading,
    paragraphs,
    action: { label: content.actionLabel, url: resume },
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

  const couponText = content.showCoupon
    ? `\n${RECOVERY_COUPON_PERCENT} % Rabatt mit dem Code ${RECOVERY_COUPON_CODE}, ab ${formatPrice(RECOVERY_COUPON_MIN_SUBTOTAL_CENTS)} Warenwert.\n`
    : "";

  const text = [
    content.heading,
    "",
    ...content.paragraphs,
    "",
    productText,
    `Gesamtsumme: ${formatPrice(input.totalCents)}`,
    couponText,
    `${content.actionLabel}: ${resume}`,
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
