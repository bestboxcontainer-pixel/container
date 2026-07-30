/**
 * Facture PDF jointe à la confirmation de commande.
 *
 * Le § 14 UStG fixe les mentions obligatoires d'une facture allemande. Elles
 * sont toutes reprises ici :
 *   - nom et adresse complets du vendeur et de l'acheteur ;
 *   - numéro de TVA intracommunautaire du vendeur ;
 *   - date d'émission et numéro de facture unique ;
 *   - quantité et désignation de chaque article ;
 *   - date de livraison ou mention qu'elle suivra ;
 *   - montant hors taxe, taux et montant de TVA, total TTC.
 *
 * Les montants archivés dans la commande sont TTC, la TVA y étant *contenue*
 * (Preisangabenverordnung § 3). La facture doit pourtant présenter le net et la
 * taxe séparément : ils sont donc recalculés à partir du total, jamais ajoutés.
 *
 * pdf-lib n'embarque que les polices WinAnsi : tout caractère hors de ce jeu
 * doit être translittéré avant écriture, sinon la génération échoue.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { COMPANY } from "@/content/legal";
import type { OrderAddress, OrderRecord } from "@/server/orders";

const MARGE = 50;
const LARGEUR = 595.28; // A4 en points
const HAUTEUR = 841.89;

const NOIR = rgb(0.1, 0.1, 0.1);
const GRIS = rgb(0.45, 0.45, 0.45);
const TRAIT = rgb(0.85, 0.85, 0.85);
const ROUGE = rgb(0.83, 0.11, 0.13);

/**
 * Ramène le texte au jeu WinAnsi accepté par les polices standard.
 * Les tirets longs et guillemets typographiques viennent des libellés produits
 * rédigés pour le site ; sans cette conversion, pdf-lib refuse la ligne.
 */
function winAnsi(valeur: string): string {
  return (valeur ?? "")
    .replace(/[—–]/g, "-")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .replace(/[^\x20-\x7E -ÿ]/g, "");
}

/** « 129900 » -> « 1.299,00 € », au format allemand. */
function euros(cents: number): string {
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

function dateAllemande(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function lignesAdresse(adresse: OrderAddress): string[] {
  const nom = [adresse.salutation, adresse.firstName, adresse.lastName].filter(Boolean).join(" ");
  return [
    adresse.company,
    nom,
    adresse.street,
    `${adresse.postalCode} ${adresse.city}`.trim(),
    adresse.country === "DE" ? "Deutschland" : adresse.country,
  ].filter((ligne) => ligne && ligne.trim().length > 0);
}

interface Plume {
  page: PDFPage;
  y: number;
}

function ecrire(
  plume: Plume,
  texte: string,
  options: { x?: number; taille?: number; police: PDFFont; couleur?: typeof NOIR; alignerDroite?: boolean },
): void {
  const taille = options.taille ?? 9;
  const contenu = winAnsi(texte);
  const x = options.alignerDroite
    ? LARGEUR - MARGE - options.police.widthOfTextAtSize(contenu, taille)
    : (options.x ?? MARGE);
  plume.page.drawText(contenu, { x, y: plume.y, size: taille, font: options.police, color: options.couleur ?? NOIR });
}

/**
 * Compose la facture d'une commande et renvoie le PDF prêt à être joint.
 * Le numéro de facture reprend celui de la commande : il est déjà séquentiel et
 * unique, ce qu'exige le § 14 al. 4 nº 4 UStG.
 */
export async function buildInvoicePdf(order: OrderRecord): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([LARGEUR, HAUTEUR]);
  const normale = await doc.embedFont(StandardFonts.Helvetica);
  const grasse = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(`Rechnung ${order.orderNumber}`);
  doc.setProducer(COMPANY.name);
  doc.setCreationDate(new Date(order.createdAt));

  const plume: Plume = { page, y: HAUTEUR - MARGE };

  // ---- En-tête ----
  ecrire(plume, COMPANY.name, { police: grasse, taille: 16, couleur: ROUGE });
  plume.y -= 16;
  ecrire(plume, `${COMPANY.street} · ${COMPANY.city}`, { police: normale, taille: 8, couleur: GRIS });
  plume.y -= 11;
  ecrire(plume, `${COMPANY.email} · ${COMPANY.phone}`, { police: normale, taille: 8, couleur: GRIS });

  // ---- Coordonnées de facturation ----
  plume.y -= 36;
  ecrire(plume, "Rechnungsanschrift", { police: grasse, taille: 8, couleur: GRIS });
  plume.y -= 14;
  for (const ligne of lignesAdresse(order.billing)) {
    ecrire(plume, ligne, { police: normale, taille: 10 });
    plume.y -= 13;
  }

  // ---- Références, alignées à droite du bloc précédent ----
  let yReference = HAUTEUR - MARGE - 88;
  const reference = (etiquette: string, valeur: string) => {
    page.drawText(winAnsi(etiquette), { x: 330, y: yReference, size: 9, font: normale, color: GRIS });
    page.drawText(winAnsi(valeur), { x: 430, y: yReference, size: 9, font: grasse, color: NOIR });
    yReference -= 14;
  };
  reference("Rechnungsnummer", order.orderNumber);
  reference("Rechnungsdatum", dateAllemande(order.createdAt));
  reference("Zahlungsart", order.paymentMethodLabel);
  reference("Kundennummer", order.email.split("@")[0].slice(0, 18));

  plume.y = Math.min(plume.y, yReference) - 24;

  // ---- Titre ----
  ecrire(plume, `Rechnung ${order.orderNumber}`, { police: grasse, taille: 15 });
  plume.y -= 26;

  // ---- Tableau des articles ----
  const COL_DESIGNATION = MARGE;
  const COL_QUANTITE = 330;
  const COL_UNITAIRE = 390;
  const COL_TOTAL = LARGEUR - MARGE;

  const enTete = (etiquette: string, x: number, droite = false) => {
    const largeur = droite ? grasse.widthOfTextAtSize(etiquette, 8) : 0;
    page.drawText(etiquette, { x: x - largeur, y: plume.y, size: 8, font: grasse, color: GRIS });
  };
  enTete("ARTIKEL", COL_DESIGNATION);
  enTete("MENGE", COL_QUANTITE);
  enTete("EINZELPREIS", COL_UNITAIRE);
  enTete("GESAMT", COL_TOTAL, true);

  plume.y -= 8;
  page.drawLine({
    start: { x: MARGE, y: plume.y },
    end: { x: LARGEUR - MARGE, y: plume.y },
    thickness: 0.8,
    color: TRAIT,
  });
  plume.y -= 16;

  for (const article of order.items) {
    const designation = winAnsi(`${article.brand} ${article.name}`);
    // La désignation est tronquée pour ne jamais chevaucher la colonne des
    // quantités : les intitulés produits dépassent souvent cent caractères.
    let visible = designation;
    while (normale.widthOfTextAtSize(visible, 9) > COL_QUANTITE - COL_DESIGNATION - 16 && visible.length > 4) {
      visible = visible.slice(0, -2);
    }
    if (visible !== designation) visible = `${visible.trimEnd()}...`;

    page.drawText(visible, { x: COL_DESIGNATION, y: plume.y, size: 9, font: normale, color: NOIR });
    page.drawText(String(article.quantity), { x: COL_QUANTITE, y: plume.y, size: 9, font: normale, color: NOIR });
    page.drawText(winAnsi(euros(article.unitPriceCents)), { x: COL_UNITAIRE, y: plume.y, size: 9, font: normale, color: NOIR });
    const total = winAnsi(euros(article.lineTotalCents));
    page.drawText(total, {
      x: COL_TOTAL - normale.widthOfTextAtSize(total, 9),
      y: plume.y,
      size: 9,
      font: normale,
      color: NOIR,
    });

    plume.y -= 12;
    page.drawText(winAnsi(`Art.-Nr. ${article.sku}`), { x: COL_DESIGNATION, y: plume.y, size: 7, font: normale, color: GRIS });
    plume.y -= 16;
  }

  // ---- Totaux ----
  plume.y -= 4;
  page.drawLine({
    start: { x: 330, y: plume.y },
    end: { x: LARGEUR - MARGE, y: plume.y },
    thickness: 0.8,
    color: TRAIT,
  });
  plume.y -= 16;

  // La TVA est contenue dans le total : on la déduit au lieu de l'ajouter.
  const totalTTC = order.totalCents;
  const tva = order.taxCents;
  const totalHT = totalTTC - tva;

  const totalLigne = (etiquette: string, valeur: string, gras = false) => {
    const police = gras ? grasse : normale;
    const taille = gras ? 11 : 9;
    page.drawText(winAnsi(etiquette), { x: 330, y: plume.y, size: taille, font: police, color: gras ? NOIR : GRIS });
    const montant = winAnsi(valeur);
    page.drawText(montant, {
      x: COL_TOTAL - police.widthOfTextAtSize(montant, taille),
      y: plume.y,
      size: taille,
      font: police,
      color: NOIR,
    });
    plume.y -= gras ? 20 : 14;
  };

  totalLigne("Zwischensumme (netto)", euros(order.subtotalCents - Math.round((order.subtotalCents * order.taxRatePercent) / (100 + order.taxRatePercent))));
  // Le mode est nommé, pas seulement chiffré : § 14 al. 4 nº 5 UStG exige la
  // désignation de la prestation, et « Versand 70,00 € » ne dit pas laquelle a
  // été rendue depuis que l'express existe.
  totalLigne(
    order.shippingMethodKey === "express"
      ? "Expressversand (24-48 Stunden)"
      : order.shippingCents === 0
        ? "Standardversand (kostenlos, 3-5 Werktage)"
        : "Standardversand",
    euros(order.shippingCents),
  );
  totalLigne(`zzgl. ${order.taxRatePercent} % USt.`, euros(tva));
  totalLigne("Gesamtbetrag", euros(totalTTC), true);

  page.drawText(winAnsi(`Nettobetrag ${euros(totalHT)}, darin enthaltene Umsatzsteuer ${euros(tva)}.`), {
    x: 330,
    y: plume.y,
    size: 7,
    font: normale,
    color: GRIS,
  });

  // ---- Mentions légales de bas de page ----
  let yPied = 116;
  const pied = (texte: string, gras = false) => {
    page.drawText(winAnsi(texte), {
      x: MARGE,
      y: yPied,
      size: 7.5,
      font: gras ? grasse : normale,
      color: GRIS,
    });
    yPied -= 11;
  };

  pied("Lieferung", true);
  pied(
    order.shippedAt
      ? `Versandt am ${dateAllemande(order.shippedAt)}.`
      : "Das Lieferdatum entspricht dem Versanddatum und wird gesondert mitgeteilt.",
  );
  yPied -= 5;
  pied("Zahlung", true);
  pied(
    order.paidAt
      ? `Bezahlt am ${dateAllemande(order.paidAt)} per ${order.paymentMethodLabel}.`
      : `Zahlungsart: ${order.paymentMethodLabel}. Zahlbar sofort und ohne Abzug.`,
  );
  yPied -= 5;
  pied(`${COMPANY.name} · ${COMPANY.street} · ${COMPANY.city}`);
  pied(`USt-IdNr. ${COMPANY.vatId} · ${COMPANY.register}`);

  const octets = await doc.save();
  return Buffer.from(octets);
}

/** Nom du fichier joint, lisible dans la boîte de réception du client. */
export function invoiceFilename(order: OrderRecord): string {
  return `Rechnung-${order.orderNumber}.pdf`;
}
