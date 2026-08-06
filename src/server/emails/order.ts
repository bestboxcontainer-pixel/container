/**
 * Gabarits des e-mails déclenchés par une commande validée.
 *
 * Deux destinataires, deux messages distincts :
 *  - l'acheteur reçoit sa confirmation de commande, dans la langue où il a
 *    commandé (de | en). C'est la confirmation exigée par le § 312i al. 1 nº 3
 *    BGB : elle doit récapituler la commande sans délai, donc contenir les
 *    articles, les montants, la TVA incluse et les adresses ;
 *  - le vendeur reçoit une notification de travail, en français comme le reste
 *    du back-office, avec les coordonnées du client et le lien direct vers la
 *    fiche de commande.
 *
 * Mêmes contraintes de mise en page que src/server/emails/adminOtp.ts :
 * tableaux et styles en ligne, `color-scheme: light` pour empêcher l'inversion
 * automatique des couleurs, fond déclaré sur chaque cellule.
 */

import { LOGO_CID } from "@/server/brandLogo";
import { formatCents } from "@/lib/cart";
import {
  bankInstructionsFor,
  renderBankInstructions,
  type BankTransferSettings,
} from "@/lib/bankTransfer";
import type { MailMessage } from "@/lib/mailer";
import type { ShippingMethodKey } from "@/lib/cart";
import type { OrderAddress, OrderRecord } from "@/server/orders";

export type OrderEmailLocale = "de" | "en";

const LOGO_WIDTH = 220;
// Rapport d'origine du fichier : 1242 × 406
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 406) / 1242);

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Horodatage lisible, toujours ramené à l'heure allemande de la boutique. */
function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

// ---- Ossature commune ----

interface LayoutInput {
  lang: string;
  preheader: string;
  heading: string;
  /** Paragraphes d'introduction, déjà échappés par l'appelant. */
  intro: string[];
  /** Blocs HTML construits par les fabriques ci-dessous. */
  blocks: string[];
  action?: { label: string; url: string };
  footnote?: string;
  footer: string;
}

function layout(input: LayoutInput): string {
  // Image jointe au message plutôt que chargée depuis le site : elle s'affiche
  // même sans adresse publique renseignée, et sans être bloquée par la
  // messagerie. La pièce jointe est ajoutée par sendMail.
  const logo = `cid:${LOGO_CID}`;

  const intro = input.intro
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#3f4854;">${paragraph}</p>`,
    )
    .join("\n");

  const action = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
                  <tr>
                    <td align="center" bgcolor="#e3000e" style="background-color:#e3000e; border-radius:4px;">
                      <a href="${escapeHtml(input.action.url)}" style="display:inline-block; padding:14px 28px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;">${escapeHtml(input.action.label)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; color:#4b5563; word-break:break-all;">${escapeHtml(input.action.url)}</p>`
    : "";

  const footnote = input.footnote
    ? `<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:21px; color:#4b5563;">${input.footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="${input.lang}">
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
                <img src="${logo}" alt="Hausgeräte Pfeffer" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" style="display:block; width:${LOGO_WIDTH}px; height:auto; border:0; outline:none; text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="background-color:#e3000e; font-size:0; line-height:0; height:4px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:20px; line-height:28px; font-weight:bold; color:#001424;">${escapeHtml(input.heading)}</h1>
                ${intro}
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; padding:0 32px;">
                ${input.blocks.join("\n")}
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; padding:24px 32px 32px 32px; border-radius:0 0 6px 6px;">
                ${action}
                ${footnote}
              </td>
            </tr>
          </table>

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%;">
            <tr>
              <td align="center" style="padding:20px 16px 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; color:#4b5563;">
                ${escapeHtml(input.footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Encadré gris à titre, utilisé pour les adresses et les coordonnées. */
function panel(title: string, rows: string[]): string {
  const body = rows
    .filter((row) => row.length > 0)
    .map(
      (row) =>
        `<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:22px; color:#3f4854;">${row}</div>`,
    )
    .join("\n");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0; background-color:#f7f8f9; border:1px solid #d6d9de; border-radius:6px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(title)}</div>
                      ${body}
                    </td>
                  </tr>
                </table>`;
}

/** Tableau des articles suivi du décompte des montants. */
function itemsTable(
  order: OrderRecord,
  labels: {
    article: string;
    quantity: string;
    total: string;
    subtotal: string;
    shipping: string;
    /** Mode retenu, déjà traduit : « Expressversand (24–48 Stunden) ». */
    shippingMethod: string;
    freeShipping: string;
    grandTotal: string;
    vat: string;
  },
): string {
  const rows = order.items
    .map((item) => {
      const title = escapeHtml(`${item.brand} ${item.name}`.trim());
      const sku = item.sku ? `<br /><span style="font-size:12px; color:#4b5563;">Art. ${escapeHtml(item.sku)}</span>` : "";
      const unit = item.quantity > 1 ? `<br /><span style="font-size:12px; color:#4b5563;">${escapeHtml(formatCents(item.unitPriceCents))} / St.</span>` : "";
      return `<tr>
                    <td style="padding:12px 8px 12px 0; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:21px; color:#001424;">${title}${sku}${unit}</td>
                    <td align="center" style="padding:12px 8px; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:21px; color:#3f4854; white-space:nowrap;">${item.quantity}&nbsp;×</td>
                    <td align="right" style="padding:12px 0 12px 8px; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:21px; color:#001424; white-space:nowrap;">${escapeHtml(formatCents(item.lineTotalCents))}</td>
                  </tr>`;
    })
    .join("\n");

  const shippingValue =
    order.shippingCents === 0 ? labels.freeShipping : formatCents(order.shippingCents);
  // Le mode de livraison est nommé sur la ligne des frais : « 70,00 € » seul
  // laisserait le client chercher d'où vient la somme.
  const shippingLabel = `${labels.shipping} — ${labels.shippingMethod}`;

  const summaryRow = (label: string, value: string, strong = false) =>
    `<tr>
                    <td style="padding:${strong ? "12px" : "4px"} 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:${strong ? "16px" : "14px"}; line-height:24px; color:#001424; ${strong ? "font-weight:bold;" : ""}">${escapeHtml(label)}</td>
                    <td align="right" style="padding:${strong ? "12px" : "4px"} 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:${strong ? "16px" : "14px"}; line-height:24px; color:#001424; white-space:nowrap; ${strong ? "font-weight:bold;" : ""}">${escapeHtml(value)}</td>
                  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
                  <tr>
                    <th align="left" style="padding:0 8px 8px 0; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.article)}</th>
                    <th align="center" style="padding:0 8px 8px 8px; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.quantity)}</th>
                    <th align="right" style="padding:0 0 8px 8px; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.total)}</th>
                  </tr>
                  ${rows}
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
                  ${summaryRow(labels.subtotal, formatCents(order.subtotalCents))}
                  ${summaryRow(shippingLabel, shippingValue)}
                  ${summaryRow(labels.grandTotal, formatCents(order.totalCents), true)}
                  <tr>
                    <td colspan="2" style="padding:2px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; color:#4b5563;">${escapeHtml(labels.vat)}</td>
                  </tr>
                </table>`;
}

/**
 * Mode de livraison rendu dans la langue du message.
 *
 * Les délais sont écrits en clair plutôt que dérivés de `minDays`/`maxDays` :
 * l'express se dit « 24–48 heures », pas « 1–2 jours », et c'est bien cette
 * promesse-là qui a été faite au client dans le tunnel.
 */
const SHIPPING_METHOD_TEXTS = {
  de: {
    standard: "Standardversand (3–5 Werktage)",
    express: "Expressversand (24–48 Stunden)",
  },
  en: {
    standard: "Standard delivery (3–5 working days)",
    express: "Express delivery (24–48 hours)",
  },
  fr: {
    standard: "Livraison standard (3 à 5 jours ouvrés)",
    express: "Livraison express (24 à 48 heures)",
  },
} as const satisfies Record<string, Record<ShippingMethodKey, string>>;

function shippingMethodText(order: OrderRecord, lang: "de" | "en" | "fr"): string {
  return SHIPPING_METHOD_TEXTS[lang][order.shippingMethodKey];
}

/** Adresse postale sur plusieurs lignes, déjà échappée. */
function addressLines(address: OrderAddress): string[] {
  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  return [
    address.company ? escapeHtml(address.company) : "",
    escapeHtml(name),
    escapeHtml(address.street),
    escapeHtml(`${address.postalCode} ${address.city}`.trim()),
    escapeHtml(address.country),
  ];
}

/** Version texte brut d'une adresse — les clients sans HTML la voient. */
function addressText(address: OrderAddress): string {
  return [
    address.company,
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.street,
    `${address.postalCode} ${address.city}`.trim(),
    address.country,
  ]
    .filter(Boolean)
    .join("\n");
}

function itemsText(order: OrderRecord): string {
  return order.items
    .map(
      (item) =>
        `- ${item.quantity} × ${`${item.brand} ${item.name}`.trim()} — ${formatCents(item.lineTotalCents)}`,
    )
    .join("\n");
}

// ---- Confirmation à l'acheteur ----

/**
 * Formule d'appel construite à partir de la civilité que le client a lui-même
 * choisie dans le tunnel. Sans civilité, ou avec « divers », on s'en tient au
 * nom complet : rien n'est déduit du prénom.
 */
function greeting(address: OrderAddress, de: boolean): string {
  const lastName = address.lastName;
  if (address.salutation === "herr") return de ? `Sehr geehrter Herr ${lastName}` : `Dear Mr ${lastName}`;
  if (address.salutation === "frau") return de ? `Sehr geehrte Frau ${lastName}` : `Dear Ms ${lastName}`;
  const full = [address.firstName, lastName].filter(Boolean).join(" ");
  return de ? `Guten Tag ${full}` : `Hello ${full}`;
}

/**
 * Bloc « Bankverbindung » joint aux commandes réglées par virement : le client
 * doit pouvoir payer depuis sa messagerie, sans rouvrir la page de
 * confirmation. Rendu vide pour tout autre moyen de paiement.
 *
 * Les coordonnées sont passées par l'appelant plutôt que relues ici : la
 * composition des e-mails reste une fonction pure, donc testable sans base.
 */
function bankTransferBlock(
  order: OrderRecord,
  bank: BankTransferSettings | undefined,
  de: boolean,
): { html: string; text: string[] } {
  if (order.paymentMethodKey !== "vorkasse" || !bank) return { html: "", text: [] };

  const instruction = renderBankInstructions(bankInstructionsFor(bank, order.locale), {
    total: formatCents(order.totalCents),
    orderNumber: order.orderNumber,
  });

  const labels = de
    ? { title: "Bankverbindung", holder: "Kontoinhaber", bank: "Bank", reference: "Verwendungszweck" }
    : { title: "Bank details", holder: "Account holder", bank: "Bank", reference: "Payment reference" };

  const entries: Array<[string, string]> = [
    [labels.holder, bank.holder],
    ["IBAN", bank.iban],
    ["BIC", bank.bic],
    ...(bank.bank ? ([[labels.bank, bank.bank]] as Array<[string, string]>) : []),
    [labels.reference, order.orderNumber],
  ];

  return {
    html: panel(labels.title, [
      escapeHtml(instruction),
      '<div style="height:10px; line-height:10px;">&nbsp;</div>',
      ...entries.map(
        ([label, value]) => `${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong>`,
      ),
    ]),
    text: ["", `${labels.title}:`, instruction, ...entries.map(([label, value]) => `${label}: ${value}`)],
  };
}

export function buildOrderConfirmationEmail(
  order: OrderRecord,
  /** Coordonnées du virement ; omises, le bloc bancaire n'est pas joint. */
  bank?: BankTransferSettings,
): Omit<MailMessage, "to"> {
  const de = order.locale !== "en";
  const lang: OrderEmailLocale = de ? "de" : "en";
  const dateLocale = de ? "de-DE" : "en-GB";
  const orderUrl = `${siteUrl()}${de ? "" : "/en"}/bestellung/${order.orderNumber}?token=${order.accessToken}`;

  const heading = de ? "Vielen Dank für Ihre Bestellung" : "Thank you for your order";
  const placed = formatDate(order.createdAt, dateLocale);

  const intro = de
    ? [
        `${escapeHtml(greeting(order.billing, true))},`,
        `wir haben Ihre Bestellung <strong>${escapeHtml(order.orderNumber)}</strong> vom ${escapeHtml(placed)} erhalten. Diese E-Mail ist Ihre Bestellbestätigung.`,
      ]
    : [
        `${escapeHtml(greeting(order.billing, false))},`,
        `we have received your order <strong>${escapeHtml(order.orderNumber)}</strong> placed on ${escapeHtml(placed)}. This email is your order confirmation.`,
      ];

  const vatLabel = de
    ? `Alle Preise inklusive ${order.taxRatePercent} % MwSt. (enthaltene MwSt.: ${formatCents(order.taxCents)}).`
    : `All prices include ${order.taxRatePercent}% VAT (VAT included: ${formatCents(order.taxCents)}).`;

  const shippingMethod = shippingMethodText(order, de ? "de" : "en");

  const table = itemsTable(order, {
    article: de ? "Artikel" : "Item",
    quantity: de ? "Menge" : "Qty",
    total: de ? "Summe" : "Total",
    subtotal: de ? "Zwischensumme" : "Subtotal",
    shipping: de ? "Versand" : "Shipping",
    shippingMethod,
    freeShipping: de ? "kostenlos" : "free",
    grandTotal: de ? "Gesamtsumme" : "Total",
    vat: vatLabel,
  });

  const payment = panel(de ? "Zahlung" : "Payment", [
    escapeHtml(order.paymentMethodLabel),
    order.paymentMethodFee ? escapeHtml(order.paymentMethodFee) : "",
  ]);

  const bankBlock = bankTransferBlock(order, bank, de);

  const shippingPanel = panel(de ? "Lieferadresse" : "Delivery address", addressLines(order.shipping));
  const billingPanel = order.shippingSameAsBilling
    ? ""
    : panel(de ? "Rechnungsadresse" : "Billing address", addressLines(order.billing));

  const notePanel = order.customerNote
    ? panel(de ? "Ihre Anmerkung" : "Your note", [escapeHtml(order.customerNote)])
    : "";

  const footnote = de
    ? "Den aktuellen Stand Ihrer Bestellung sehen Sie jederzeit über den Link oben. Ihr Widerrufsrecht und die Rücksendebedingungen finden Sie auf unserer Website."
    : "You can check the current status of your order at any time using the link above. Your right of withdrawal and our return conditions are available on our website.";

  const html = layout({
    lang,
    preheader: de
      ? `Bestellung ${order.orderNumber} — ${formatCents(order.totalCents)}`
      : `Order ${order.orderNumber} — ${formatCents(order.totalCents)}`,
    heading,
    intro,
    blocks: [table, payment, bankBlock.html, shippingPanel, billingPanel, notePanel].filter(Boolean),
    action: { label: de ? "Bestellung ansehen" : "View order", url: orderUrl },
    footnote: escapeHtml(footnote),
    footer: de
      ? "Hausgeräte Pfeffer — automatische Nachricht zu Ihrer Bestellung."
      : "Hausgeräte Pfeffer — automated message about your order.",
  });

  const text = [
    heading,
    "",
    `${greeting(order.billing, de)},`,
    de
      ? `wir haben Ihre Bestellung ${order.orderNumber} vom ${placed} erhalten. Diese E-Mail ist Ihre Bestellbestätigung.`
      : `we have received your order ${order.orderNumber} placed on ${placed}. This email is your order confirmation.`,
    "",
    itemsText(order),
    "",
    `${de ? "Zwischensumme" : "Subtotal"}: ${formatCents(order.subtotalCents)}`,
    `${de ? "Versand" : "Shipping"} — ${shippingMethod}: ${order.shippingCents === 0 ? (de ? "kostenlos" : "free") : formatCents(order.shippingCents)}`,
    `${de ? "Gesamtsumme" : "Total"}: ${formatCents(order.totalCents)}`,
    vatLabel,
    "",
    `${de ? "Zahlung" : "Payment"}: ${order.paymentMethodLabel}`,
    ...bankBlock.text,
    "",
    `${de ? "Lieferadresse" : "Delivery address"}:`,
    addressText(order.shipping),
    ...(order.shippingSameAsBilling
      ? []
      : ["", `${de ? "Rechnungsadresse" : "Billing address"}:`, addressText(order.billing)]),
    "",
    orderUrl,
    "",
    footnote,
  ].join("\n");

  return {
    subject: de
      ? `Bestellbestätigung ${order.orderNumber}`
      : `Order confirmation ${order.orderNumber}`,
    html,
    text,
  };
}

// ---- Notification au vendeur ----

export function buildOrderNotificationEmail(order: OrderRecord): Omit<MailMessage, "to"> {
  const adminUrl = `${siteUrl()}/admin/orders/${order.id}`;
  const placed = formatDate(order.createdAt, "fr-FR");
  const heading = "Nouvelle commande";

  const shippingMethod = shippingMethodText(order, "fr");
  // L'express est signalé dès l'introduction : c'est une contrainte de
  // préparation, pas un simple détail de facturation.
  const express = order.shippingMethodKey === "express";

  const intro = [
    `Commande <strong>${escapeHtml(order.orderNumber)}</strong> reçue le ${escapeHtml(placed)}.`,
    `Montant : <strong>${escapeHtml(formatCents(order.totalCents))}</strong> — paiement : ${escapeHtml(order.paymentMethodLabel)}${order.paymentMethodFee ? ` (${escapeHtml(order.paymentMethodFee)})` : ""}.`,
    express
      ? `<strong>${escapeHtml(shippingMethod)}</strong> — à préparer en priorité.`
      : `Livraison : ${escapeHtml(shippingMethod)}.`,
  ];

  const table = itemsTable(order, {
    article: "Article",
    quantity: "Qté",
    total: "Total",
    subtotal: "Sous-total",
    shipping: "Livraison",
    shippingMethod,
    freeShipping: "offerte",
    grandTotal: "Total TTC",
    vat: `Dont TVA ${order.taxRatePercent} % : ${formatCents(order.taxCents)}.`,
  });

  const customer = panel("Client", [
    escapeHtml([order.billing.firstName, order.billing.lastName].filter(Boolean).join(" ")),
    order.billing.company ? escapeHtml(order.billing.company) : "",
    `<a href="mailto:${escapeHtml(order.email)}" style="color:#001424;">${escapeHtml(order.email)}</a>`,
    order.phone ? `<a href="tel:${escapeHtml(order.phone.replace(/\s/g, ""))}" style="color:#001424;">${escapeHtml(order.phone)}</a>` : "",
    `Langue de la commande : ${order.locale === "en" ? "anglais" : "allemand"}`,
  ]);

  const shippingPanel = panel("Adresse de livraison", addressLines(order.shipping));
  const billingPanel = order.shippingSameAsBilling
    ? ""
    : panel("Adresse de facturation", addressLines(order.billing));

  const notePanel = order.customerNote
    ? panel("Remarque du client", [escapeHtml(order.customerNote)])
    : "";

  const html = layout({
    lang: "fr",
    preheader: `${order.orderNumber} — ${formatCents(order.totalCents)} — ${order.paymentMethodLabel}`,
    heading,
    intro,
    blocks: [table, customer, shippingPanel, billingPanel, notePanel].filter(Boolean),
    action: { label: "Ouvrir dans le back-office", url: adminUrl },
    footnote:
      "Le stock a déjà été réservé à l'enregistrement de la commande. Le paiement est encore en attente : à confirmer dans le back-office dès réception.",
    footer: "Hausgeräte Pfeffer — notification automatique du back-office.",
  });

  const text = [
    `${heading} : ${order.orderNumber}`,
    "",
    `Reçue le ${placed}`,
    `Montant : ${formatCents(order.totalCents)} (dont TVA ${order.taxRatePercent} % : ${formatCents(order.taxCents)})`,
    `Paiement : ${order.paymentMethodLabel}`,
    `Livraison : ${shippingMethod}`,
    "",
    itemsText(order),
    "",
    `Sous-total : ${formatCents(order.subtotalCents)}`,
    `Livraison : ${order.shippingCents === 0 ? "offerte" : formatCents(order.shippingCents)}`,
    `Total TTC : ${formatCents(order.totalCents)}`,
    "",
    "Client :",
    [order.billing.firstName, order.billing.lastName].filter(Boolean).join(" "),
    order.email,
    order.phone,
    "",
    "Adresse de livraison :",
    addressText(order.shipping),
    ...(order.shippingSameAsBilling
      ? []
      : ["", "Adresse de facturation :", addressText(order.billing)]),
    ...(order.customerNote ? ["", `Remarque du client : ${order.customerNote}`] : []),
    "",
    adminUrl,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return {
    subject: `Nouvelle commande ${order.orderNumber} — ${formatCents(order.totalCents)}`,
    html,
    text,
  };
}
