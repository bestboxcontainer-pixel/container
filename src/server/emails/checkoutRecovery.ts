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

// ---- Contenu des quatre messages ----

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
      // Le standard est gratuit sans montant minimum d'achat (src/lib/cart.ts) :
      // aucun seuil à annoncer, contrairement à une ancienne version de ce texte.
      preheader: "Ihr Warenkorb wartet – der Standardversand ist bei uns immer kostenlos.",
      heading: "Ihr Warenkorb ist noch da",
      paragraphs: [
        "Ihre Auswahl liegt weiterhin in Ihrem Warenkorb. Sie können die Bestellung mit einem Klick abschließen, ohne Ihre Daten erneut eingeben zu müssen.",
        "Gut zu wissen: Der Standardversand ist bei uns immer kostenlos, ohne Mindestbestellwert. Und Sie haben 14 Tage Widerrufsrecht – passt das Gerät nicht, nehmen wir es zurück.",
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

// ---- Assemblage ----

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
