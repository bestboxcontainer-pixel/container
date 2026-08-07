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

import { emailLogoSrc } from "@/server/brandLogo";
import { formatCents } from "@/lib/cart";
import {
  bankInstructionsFor,
  needsBankDetails,
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
  // Logo servi par le site quand son adresse est connue : joint au message, il
  // apparaissait comme une pièce jointe « logo.png » dans plusieurs messageries.
  const logo = emailLogoSrc();

  const intro = input.intro
    .map(
      (paragraph) =>
        `<p class="txt" style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:20px; line-height:32px; color:#3f4854;">${paragraph}</p>`,
    )
    .join("\n");

  const action = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
                  <tr>
                    <td align="center" bgcolor="#e3000e" style="background-color:#e3000e; border-radius:4px;">
                      <a href="${escapeHtml(input.action.url)}" style="display:inline-block; padding:16px 32px; font-family:Arial,Helvetica,sans-serif; font-size:20px; font-weight:bold; color:#ffffff; text-decoration:none;">${escapeHtml(input.action.label)}</a>
                    </td>
                  </tr>
                </table>
                <p class="small" style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#4b5563; word-break:break-all;">${escapeHtml(input.action.url)}</p>`
    : "";

  const footnote = input.footnote
    ? `<p class="small" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:18px; line-height:28px; color:#4b5563;">${input.footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="${input.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.heading)}</title>
    <style>
      /* Sur un téléphone, la marge de 32 px de chaque côté ne laissait plus
         qu'une colonne étroite : la messagerie réduisait alors le message
         entier pour le faire tenir, et le texte devenait illisible. On rend
         les marges à l'écran et on remonte les corps d'un cran. */
      @media only screen and (max-width: 620px) {
        .wrap { padding: 16px 8px !important; }
        .pad { padding-left: 16px !important; padding-right: 16px !important; }
        .h1 { font-size: 29px !important; line-height: 37px !important; }
        .txt { font-size: 21px !important; line-height: 33px !important; }
        .cell { font-size: 20px !important; line-height: 30px !important; }
        .tot { font-size: 24px !important; line-height: 33px !important; }
        .small { font-size: 18px !important; line-height: 27px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f1f2f4; color-scheme:light; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(input.preheader)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f2f4;">
      <tr>
        <td align="center" class="wrap" style="padding:32px 16px;">
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
              <td class="pad" style="background-color:#ffffff; padding:32px 32px 8px 32px;">
                <h1 class="h1" style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:28px; line-height:36px; font-weight:bold; color:#001424;">${escapeHtml(input.heading)}</h1>
                ${intro}
              </td>
            </tr>
            <tr>
              <td class="pad" style="background-color:#ffffff; padding:0 32px;">
                ${input.blocks.join("\n")}
              </td>
            </tr>
            <tr>
              <td class="pad" style="background-color:#ffffff; padding:24px 32px 32px 32px; border-radius:0 0 6px 6px;">
                ${action}
                ${footnote}
              </td>
            </tr>
          </table>

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%;">
            <tr>
              <td align="center" class="small" style="padding:20px 16px 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:26px; color:#4b5563;">
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
        `<div class="cell" style="font-family:Arial,Helvetica,sans-serif; font-size:19px; line-height:29px; color:#3f4854;">${row}</div>`,
    )
    .join("\n");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0; background-color:#f7f8f9; border:1px solid #d6d9de; border-radius:6px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div class="small" style="margin:0 0 8px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:25px; font-weight:bold; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(title)}</div>
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
    /** Étiquette de la remise ; le code y est déjà accolé s'il y en a un. */
    discount: string;
    grandTotal: string;
    vat: string;
  },
): string {
  const rows = order.items
    .map((item) => {
      const title = escapeHtml(`${item.brand} ${item.name}`.trim());
      const sku = item.sku ? `<br /><span style="font-size:16px; color:#4b5563;">Art. ${escapeHtml(item.sku)}</span>` : "";
      const unit = item.quantity > 1 ? `<br /><span style="font-size:16px; color:#4b5563;">${escapeHtml(formatCents(item.unitPriceCents))} / St.</span>` : "";
      return `<tr>
                    <td class="cell" style="padding:12px 8px 12px 0; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:19px; line-height:29px; color:#001424;">${title}${sku}${unit}</td>
                    <td align="center" class="cell" style="padding:12px 8px; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:19px; line-height:29px; color:#3f4854; white-space:nowrap;">${item.quantity}&nbsp;×</td>
                    <td align="right" class="cell" style="padding:12px 0 12px 8px; border-bottom:1px solid #e0e2e6; font-family:Arial,Helvetica,sans-serif; font-size:19px; line-height:29px; color:#001424; white-space:nowrap;">${escapeHtml(formatCents(item.lineTotalCents))}</td>
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
                    <td class="${strong ? "tot" : "cell"}" style="padding:${strong ? "12px" : "4px"} 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:${strong ? "23px" : "19px"}; line-height:31px; color:#001424; ${strong ? "font-weight:bold;" : ""}">${escapeHtml(label)}</td>
                    <td align="right" class="${strong ? "tot" : "cell"}" style="padding:${strong ? "12px" : "4px"} 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:${strong ? "23px" : "19px"}; line-height:31px; color:#001424; white-space:nowrap; ${strong ? "font-weight:bold;" : ""}">${escapeHtml(value)}</td>
                  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
                  <tr>
                    <th align="left" class="small" style="padding:0 8px 8px 0; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:25px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.article)}</th>
                    <th align="center" class="small" style="padding:0 8px 8px 8px; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:25px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.quantity)}</th>
                    <th align="right" class="small" style="padding:0 0 8px 8px; border-bottom:2px solid #001424; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:25px; text-transform:uppercase; letter-spacing:0.6px; color:#001424;">${escapeHtml(labels.total)}</th>
                  </tr>
                  ${rows}
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
                  ${summaryRow(labels.subtotal, formatCents(order.subtotalCents))}
                  ${
                    // La remise se déduit avant les frais de port, dans l'ordre
                    // du calcul. Sans elle, le sous-total et la livraison
                    // additionnés dépassaient le total annoncé : le client
                    // écrivait pour demander laquelle des trois sommes était la
                    // bonne.
                    order.discountCents > 0
                      ? summaryRow(labels.discount, `− ${formatCents(order.discountCents)}`)
                      : ""
                  }
                  ${summaryRow(shippingLabel, shippingValue)}
                  ${summaryRow(labels.grandTotal, formatCents(order.totalCents), true)}
                  ${
                    // Libellé vide : la ligne disparaît, plutôt que de laisser
                    // une cellule blanche sous le total.
                    labels.vat
                      ? `<tr>
                    <td colspan="2" class="small" style="padding:2px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:26px; color:#4b5563;">${escapeHtml(labels.vat)}</td>
                  </tr>`
                      : ""
                  }
                </table>`;
}

/**
 * Étiquette de la ligne de remise, code compris.
 *
 * Le code est nommé plutôt que sous-entendu : c'est la réponse à la question
 * que pose toute somme retirée d'une facture — au titre de quoi. Le vendeur y
 * lit du même coup quel coupon a servi, sans ouvrir le back-office.
 */
function discountLabel(order: OrderRecord, de: boolean): string {
  const titre = de ? "Rabatt" : "Discount";
  return order.couponCode ? `${titre} (${order.couponCode})` : titre;
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
 * confirmation. Rendu vide pour la facture et le contre-remboursement, qui se
 * règlent à réception.
 *
 * Les coordonnées sont passées par l'appelant plutôt que relues ici : la
 * composition des e-mails reste une fonction pure, donc testable sans base.
 */
/**
 * Consigne de virement, rendue à part du bloc bancaire.
 *
 * Elle se lit désormais dans l'introduction, en une phrase, plutôt qu'en tête
 * de l'encadré : c'est la seule action attendue du client, elle n'a pas à
 * attendre qu'il arrive à l'encadré pour être lue. Vide pour tout autre moyen
 * de paiement.
 */
function bankInstruction(order: OrderRecord, bank: BankTransferSettings | undefined): string {
  if (!needsBankDetails(order.paymentMethodKey) || !bank) return "";
  return renderBankInstructions(bankInstructionsFor(bank, order.locale), {
    total: formatCents(order.totalCents),
    orderNumber: order.orderNumber,
  });
}

function bankTransferBlock(
  order: OrderRecord,
  bank: BankTransferSettings | undefined,
  de: boolean,
): { html: string; text: string[] } {
  if (!needsBankDetails(order.paymentMethodKey) || !bank) return { html: "", text: [] };

  const labels = de
    ? {
        title: "Bankverbindung",
        holder: "Kontoinhaber",
        bank: "Bank",
        transferType: "Überweisungsart",
        reference: "Verwendungszweck",
      }
    : {
        title: "Bank details",
        holder: "Account holder",
        bank: "Bank",
        transferType: "Transfer type",
        reference: "Payment reference",
      };

  const entries: Array<[string, string]> = [
    [labels.holder, bank.holder],
    ["IBAN", bank.iban],
    ["BIC", bank.bic],
    ...(bank.bank ? ([[labels.bank, bank.bank]] as Array<[string, string]>) : []),
    // Seul l'intitulé est traduit : la valeur est reprise telle que saisie.
    ...(bank.transferType
      ? ([[labels.transferType, bank.transferType]] as Array<[string, string]>)
      : []),
    [labels.reference, order.orderNumber],
  ];

  // L'encadré ne porte plus que les coordonnées : la consigne de virement est
  // remontée dans l'introduction, et la répéter ici allongeait le message de
  // deux lignes pour redire la même chose.
  return {
    html: panel(
      labels.title,
      entries.map(([label, value]) => `${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong>`),
    ),
    text: ["", `${labels.title}:`, ...entries.map(([label, value]) => `${label}: ${value}`)],
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

  const heading = de ? "Vielen Dank für Ihre Bestellung" : "Thank you for your order";
  const placed = formatDate(order.createdAt, dateLocale);

  // Consigne de virement, en troisième phrase : ce qu'on attend du client est
  // dit une fois, tout en haut, et ne se répète plus nulle part ensuite.
  const instruction = bankInstruction(order, bank);

  const intro = de
    ? [
        `${escapeHtml(greeting(order.billing, true))},`,
        `wir haben Ihre Bestellung <strong>${escapeHtml(order.orderNumber)}</strong> vom ${escapeHtml(placed)} erhalten. Diese E-Mail ist Ihre Bestellbestätigung.`,
      ]
    : [
        `${escapeHtml(greeting(order.billing, false))},`,
        `we have received your order <strong>${escapeHtml(order.orderNumber)}</strong> placed on ${escapeHtml(placed)}. This email is your order confirmation.`,
      ];

  if (instruction) intro.push(escapeHtml(instruction));

  // Le taux et le montant de TVA ne sont plus détaillés au client, à la demande
  // du commerçant : la confirmation reprend le total tel qu'il l'a payé.
  const vatLabel = "";

  const shippingMethod = shippingMethodText(order, de ? "de" : "en");

  const table = itemsTable(order, {
    article: de ? "Artikel" : "Item",
    quantity: de ? "Menge" : "Qty",
    total: de ? "Summe" : "Total",
    subtotal: de ? "Zwischensumme" : "Subtotal",
    shipping: de ? "Versand" : "Shipping",
    shippingMethod,
    freeShipping: de ? "kostenlos" : "free",
    discount: discountLabel(order, de),
    grandTotal: de ? "Gesamtsumme" : "Total",
    vat: vatLabel,
  });

  const bankBlock = bankTransferBlock(order, bank, de);

  // Moyen de paiement : retiré quand il fait doublon.
  //
  // Sur un virement, le bloc ne faisait que redire l'encadré bancaire juste
  // au-dessus — « Zahlung : Sofortüberweisung » sous « Bankverbindung ». Il
  // reste pour les autres moyens, où il porte une information que rien ne
  // donne ailleurs, ainsi que dès qu'il y a des frais à annoncer : une somme
  // facturée ne peut pas disparaître d'une confirmation.
  const payment =
    bankBlock.html && !order.paymentMethodFee
      ? ""
      : panel(de ? "Zahlung" : "Payment", [
          escapeHtml(order.paymentMethodLabel),
          order.paymentMethodFee ? escapeHtml(order.paymentMethodFee) : "",
        ]);

  const shippingPanel = panel(de ? "Lieferadresse" : "Delivery address", addressLines(order.shipping));
  const billingPanel = order.shippingSameAsBilling
    ? ""
    : panel(de ? "Rechnungsadresse" : "Billing address", addressLines(order.billing));

  const notePanel = order.customerNote
    ? panel(de ? "Ihre Anmerkung" : "Your note", [escapeHtml(order.customerNote)])
    : "";

  // Réduite à la mention légale. La première phrase renvoyait au bouton de
  // suivi, qui n'existe plus — elle désignait un lien absent. Ce qui reste est
  // ce que § 312f BGB attend d'une confirmation : que le client sache où
  // trouver son droit de rétractation.
  const footnote = de
    ? "Ihr Widerrufsrecht und die Rücksendebedingungen finden Sie auf unserer Website."
    : "Your right of withdrawal and our return conditions are available on our website.";

  const html = layout({
    lang,
    preheader: de
      ? `Bestellung ${order.orderNumber} — ${formatCents(order.totalCents)}`
      : `Order ${order.orderNumber} — ${formatCents(order.totalCents)}`,
    heading,
    intro,
    // Les coordonnées bancaires passent avant le détail des articles.
    //
    // Ce message a un seul objet pour qui paie par virement : où envoyer
    // l'argent, et sous quelle référence. Placé après le tableau, le bloc
    // obligeait à faire défiler deux écrans sur un téléphone pour trouver
    // l'IBAN — le client rangeait le mail sans avoir viré. L'ordre suit
    // désormais ce qu'il a à faire : ce qu'on attend de lui d'abord, la
    // justification du montant ensuite.
    //
    // Sans virement, le bloc est vide et l'ordre reste celui d'avant.
    blocks: [bankBlock.html, table, payment, shippingPanel, billingPanel, notePanel].filter(Boolean),
    // Ni bouton de suivi ni adresse en clair : le message se terminait sur un
    // pavé rouge, l'URL complète avec son jeton, puis une phrase qui renvoyait
    // à ce même lien. Trois façons de dire la même chose, à l'endroit exact où
    // le client cherchait l'IBAN. La commande reste consultable par le lien de
    // la page de confirmation, ouverte juste après l'achat.
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
    // Version texte conduite dans le même ordre que la version HTML :
    // la consigne de virement, puis les coordonnées, puis les articles.
    ...(instruction ? ["", instruction] : []),
    ...bankBlock.text,
    "",
    itemsText(order),
    "",
    `${de ? "Zwischensumme" : "Subtotal"}: ${formatCents(order.subtotalCents)}`,
    // Même déduction que dans la version HTML : les deux copies du message
    // doivent porter les mêmes montants, sans quoi le client qui lit la version
    // texte tomberait sur un décompte qui ne tombe pas juste.
    ...(order.discountCents > 0
      ? [`${discountLabel(order, de)}: − ${formatCents(order.discountCents)}`]
      : []),
    `${de ? "Versand" : "Shipping"} — ${shippingMethod}: ${order.shippingCents === 0 ? (de ? "kostenlos" : "free") : formatCents(order.shippingCents)}`,
    `${de ? "Gesamtsumme" : "Total"}: ${formatCents(order.totalCents)}`,
    "",
    // Même règle que la version HTML : sur un virement sans frais, le moyen de
    // paiement ne fait que répéter l'encadré bancaire.
    ...(bankBlock.html && !order.paymentMethodFee
      ? []
      : ["", `${de ? "Zahlung" : "Payment"}: ${order.paymentMethodLabel}`]),
    "",
    `${de ? "Lieferadresse" : "Delivery address"}:`,
    addressText(order.shipping),
    ...(order.shippingSameAsBilling
      ? []
      : ["", `${de ? "Rechnungsadresse" : "Billing address"}:`, addressText(order.billing)]),
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
    // Le code figure dans l'étiquette : le vendeur voit quel coupon a été
    // utilisé sur la commande sans avoir à ouvrir le back-office.
    discount: order.couponCode ? `Remise (${order.couponCode})` : "Remise",
    grandTotal: "Total TTC",
    vat: "",
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
    `Montant : ${formatCents(order.totalCents)}`,
    `Paiement : ${order.paymentMethodLabel}`,
    `Livraison : ${shippingMethod}`,
    "",
    itemsText(order),
    "",
    `Sous-total : ${formatCents(order.subtotalCents)}`,
    ...(order.discountCents > 0
      ? [
          `Remise${order.couponCode ? ` (${order.couponCode})` : ""} : − ${formatCents(order.discountCents)}`,
        ]
      : []),
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
