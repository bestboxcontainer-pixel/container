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
 * (Preisangabenverordnung § 3). Le décompte présente donc des lignes TTC qui
 * s'additionnent réellement jusqu'au total, et la taxe est indiquée comme
 * « enthaltene USt. », jamais « zzgl. », qui signifierait qu'on l'ajoute.
 *
 * pdf-lib n'embarque que les polices WinAnsi : tout caractère hors de ce jeu
 * doit être translittéré avant écriture, sinon la génération échoue.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { COMPANY } from "@/content/legal";
import { needsBankDetails } from "@/lib/bankTransfer";
import type { BankTransferSettings } from "@/lib/bankTransfer";
import { LOGO_RATIO, logoPngBytes } from "@/server/brandLogo";
import type { OrderAddress, OrderItemRecord, OrderRecord } from "@/server/orders";

const MARGE = 50;
const LARGEUR = 595.28; // A4 en points
const HAUTEUR = 841.89;
const DROITE = LARGEUR - MARGE;

const NOIR = rgb(0.1, 0.1, 0.1);
const GRIS = rgb(0.42, 0.42, 0.42);
const TRAIT = rgb(0.85, 0.85, 0.85);
const LIEN = rgb(0.1, 0.35, 0.75);

// Colonnes du tableau des articles, calées sur la maquette de référence.
const COL_NUM = MARGE;
const COL_PHOTO = 72;
const COL_ARTICLE = 132;
// Élargie avec le corps de texte : à 11 pt, 175 points tronquaient la plupart
// des désignations produits dès la deuxième ligne.
const LARGEUR_ARTICLE = 190;
const COL_MENGE = 355; // centre de la colonne
const COL_PREIS = 462; // bord droit

/**
 * Densité du tableau des articles.
 *
 * La facture tient sur une page ou elle n'y tient pas : il n'y a pas de demi-
 * mesure pour une pièce qu'on imprime et qu'on classe. Le seul bloc dont la
 * hauteur dépend de la commande est le tableau des articles ; c'est donc lui qui
 * s'adapte, du confortable au serré, pendant que le reste garde ses proportions.
 *
 * Les paliers sont rangés du plus lisible au plus compact. On retient le premier
 * qui entre dans la place disponible : jamais un cran plus serré que nécessaire.
 */
interface Densite {
  /** Côté de la vignette produit, en points. Zéro la supprime. */
  vignette: number;
  /** Nombre de lignes accordées à la désignation. */
  lignes: number;
  corps: number;
  interligne: number;
  /** Blanc sous chaque ligne d'article. */
  respiration: number;
}

/**
 * Le premier palier est le cas courant, une commande d'un à trois articles, et
 * c'est celui qu'on lit sur un téléphone, où la facture s'ouvre en pleine
 * largeur d'écran. Il est donc composé large. Les paliers suivants ne servent
 * qu'aux commandes fournies, où la lisibilité cède le pas au fait de tenir sur
 * une feuille.
 */
const DENSITES: readonly Densite[] = [
  { vignette: 52, lignes: 2, corps: 12.5, interligne: 16, respiration: 16 },
  { vignette: 46, lignes: 2, corps: 12, interligne: 15, respiration: 13 },
  { vignette: 40, lignes: 2, corps: 11, interligne: 14, respiration: 10 },
  { vignette: 32, lignes: 2, corps: 10.5, interligne: 13, respiration: 8 },
  { vignette: 26, lignes: 1, corps: 10, interligne: 12, respiration: 7 },
  { vignette: 0, lignes: 1, corps: 9.5, interligne: 11, respiration: 6 },
];

// Interlignes du décompte. Partagés entre le calcul de hauteur et la
// composition : mesurer avec d'autres valeurs que celles qu'on dessine ferait
// mentir la prévision, et la facture déborderait malgré le calcul.
const DECOMPTE_LIGNE = 21;
const DECOMPTE_TOTAL = 28;
const DECOMPTE_DELAI = 18;
/** Blanc + filet séparant les lignes courantes du total. */
const DECOMPTE_FILET = 24;
/** Blanc entre le dernier article et la première ligne du décompte. */
const DECOMPTE_ENTETE = 24;

// Bloc bancaire : filet, titre, puis une ligne par coordonnée.
//
// L'interligne y est plus large qu'ailleurs, et volontairement : ce sont des
// suites de chiffres qu'on recopie dans une application bancaire, souvent
// depuis un téléphone, en gardant sa place des yeux. Serrées, deux lignes d'IBAN
// se confondent.
const BANQUE_ENTETE = 56;
const BANQUE_LIGNE = 22;

/**
 * Hauteur réservée au pied de page.
 * Les mentions se composent du bas vers le haut depuis 56 points et montent
 * jusqu'à ~104 : au-dessous de cette limite, tout nouveau contenu
 * chevaucherait le pied.
 */
const HAUTEUR_PIED = 135;

/**
 * Ramène le texte au jeu WinAnsi accepté par les polices standard.
 * Les tirets longs et guillemets typographiques viennent des libellés produits
 * rédigés pour le site ; sans cette conversion, pdf-lib refuse la ligne.
 */
function winAnsi(valeur: string): string {
  return (valeur ?? "")
    .replace(/[, , ]/g, "-")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .replace(/[^\x20-\x7E -ÿ]/g, "");
}

/** « 129900 » -> « 1.299,00 EUR », au format allemand. */
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

/** Délai annoncé au client, repris du mode de livraison qu'il a choisi. */
function delaiLivraison(order: OrderRecord): string {
  return order.shippingMethodKey === "express" ? "(24-48 Stunden)" : "(3 bis 5 Werktage)";
}

/**
 * Découpe un libellé sur plusieurs lignes sans couper les mots. Au-delà de
 * `maxLignes`, la dernière est tronquée avec des points de suspension : les
 * intitulés produits dépassent souvent cent caractères et déborderaient sur la
 * colonne des quantités.
 */
function couperEnLignes(
  texte: string,
  police: PDFFont,
  taille: number,
  largeurMax: number,
  maxLignes: number,
): string[] {
  const mots = winAnsi(texte).split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let courante = "";

  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (police.widthOfTextAtSize(essai, taille) <= largeurMax) {
      courante = essai;
      continue;
    }
    if (courante) lignes.push(courante);
    courante = mot;
    if (lignes.length === maxLignes) break;
  }
  if (courante && lignes.length < maxLignes) lignes.push(courante);

  // Un mot unique plus large que la colonne ne passerait jamais la boucle :
  // on le rogne caractère par caractère.
  if (lignes.length === 0 && mots.length > 0) lignes.push(mots[0]);

  const dernier = lignes[lignes.length - 1];
  const reste = mots.join(" ").length > lignes.join(" ").length;
  if (reste && dernier) {
    let coupe = dernier;
    while (police.widthOfTextAtSize(`${coupe}...`, taille) > largeurMax && coupe.length > 1) {
      coupe = coupe.slice(0, -1);
    }
    lignes[lignes.length - 1] = `${coupe.trimEnd()}...`;
  }
  return lignes;
}

// ---- Vignettes produits ----

/**
 * Adresse de la vignette à télécharger.
 *
 * Les visuels sont livrés par Cloudinary en `f_auto`, c'est-à-dire en AVIF ou
 * WebP selon le client : deux formats que pdf-lib ne sait pas embarquer. On force
 * donc le JPEG et une largeur de 160 px, largement suffisante pour une case de
 * 46 points. Une image servie depuis un chemin local est ignorée : la facture
 * est composée hors requête HTTP, sans origine à laquelle la rattacher.
 */
export function urlVignette(source: string): string | null {
  const valeur = (source ?? "").trim();
  if (!/^https?:\/\//i.test(valeur)) return null;

  if (valeur.includes("res.cloudinary.com") && valeur.includes("/upload/")) {
    // Remplace le groupe de transformations existant, sinon en insère un.
    return /\/upload\/[^/]*f_auto[^/]*\//.test(valeur)
      ? valeur.replace(/\/upload\/[^/]*\//, "/upload/f_jpg,q_auto,w_160,c_fit/")
      : valeur.replace("/upload/", "/upload/f_jpg,q_auto,w_160,c_fit/");
  }
  return valeur;
}

/** PNG et JPEG sont les deux seuls formats que pdf-lib sait embarquer. */
function formatImage(octets: Uint8Array): "png" | "jpg" | null {
  if (octets.length > 8 && octets[0] === 0x89 && octets[1] === 0x50 && octets[2] === 0x4e && octets[3] === 0x47) {
    return "png";
  }
  if (octets.length > 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) return "jpg";
  return null;
}

/**
 * Télécharge une vignette. Tout échec rend `null` : réseau coupé, image
 * supprimée, format exotique, délai dépassé. La facture part alors avec une
 * case vide : une pièce jointe manquante serait bien pire qu'une photo
 * manquante.
 */
async function chargerVignette(source: string): Promise<Uint8Array | null> {
  const url = urlVignette(source);
  if (!url) return null;

  try {
    const reponse = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!reponse.ok) return null;
    const octets = new Uint8Array(await reponse.arrayBuffer());
    return formatImage(octets) ? octets : null;
  } catch {
    return null;
  }
}

/**
 * Coordonnées du virement à porter sur la facture, sous forme de paires
 * étiquette / valeur.
 *
 * Uniquement pour une commande dont le paiement n'est pas encore arrivé : le
 * client règle sur pièce, il ne doit pas avoir à rouvrir son e-mail pour
 * retrouver l'IBAN. Une commande déjà payée, ou réglée à réception (facture,
 * contre-remboursement), n'a rien à faire d'un appel à virer, la liste rendue
 * est alors vide.
 *
 * Le texte d'instruction, lui, reste sur la page de confirmation et dans
 * l'e-mail : la facture s'en tient aux mentions factuelles.
 */
export function lignesVirement(
  order: Pick<OrderRecord, "paymentMethodKey" | "paidAt" | "orderNumber">,
  bank?: BankTransferSettings,
): Array<[string, string]> {
  if (!needsBankDetails(order.paymentMethodKey) || order.paidAt || !bank) return [];

  return [
    ["Kontoinhaber", bank.holder],
    ["IBAN", bank.iban],
    ["BIC", bank.bic],
    ...(bank.bank ? ([["Bank", bank.bank]] as Array<[string, string]>) : []),
    ...(bank.transferType
      ? ([["Überweisungsart", bank.transferType]] as Array<[string, string]>)
      : []),
    ["Verwendungszweck", order.orderNumber],
  ];
}

// ---- Composition ----

interface Plume {
  page: PDFPage;
  y: number;
}

/**
 * Compose la facture d'une commande et renvoie le PDF prêt à être joint.
 * Le numéro de facture reprend celui de la commande : il est déjà séquentiel et
 * unique, ce qu'exige le § 14 al. 4 nº 4 UStG.
 */
export async function buildInvoicePdf(
  order: OrderRecord,
  /** Coordonnées du virement ; omises, le bloc bancaire n'est pas composé. */
  bank?: BankTransferSettings,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const normale = await doc.embedFont(StandardFonts.Helvetica);
  const grasse = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(`Rechnung ${order.orderNumber}`);
  doc.setProducer(COMPANY.name);
  doc.setCreationDate(new Date(order.createdAt));

  // Les vignettes partent toutes en même temps : trois articles, c'est un
  // aller-retour réseau au total et non trois à la file.
  const vignettes = await Promise.all(
    order.items.map(async (article) => {
      const octets = article.image ? await chargerVignette(article.image) : null;
      if (!octets) return null;
      try {
        return formatImage(octets) === "png" ? await doc.embedPng(octets) : await doc.embedJpg(octets);
      } catch {
        // Image annoncée PNG mais illisible : la case reste vide.
        return null;
      }
    }),
  );

  const plume: Plume = { page: doc.addPage([LARGEUR, HAUTEUR]), y: HAUTEUR - MARGE };

  const texte = (
    contenu: string,
    options: {
      x?: number;
      y?: number;
      taille?: number;
      police?: PDFFont;
      couleur?: typeof NOIR;
      /** Bord droit auquel aligner, au lieu du bord gauche. */
      finX?: number;
      /** Centre autour duquel répartir. */
      centreX?: number;
    } = {},
  ) => {
    const taille = options.taille ?? 10.5;
    const police = options.police ?? normale;
    const valeur = winAnsi(contenu);
    const largeur = police.widthOfTextAtSize(valeur, taille);
    const x =
      options.finX !== undefined
        ? options.finX - largeur
        : options.centreX !== undefined
          ? options.centreX - largeur / 2
          : (options.x ?? MARGE);
    plume.page.drawText(valeur, {
      x,
      y: options.y ?? plume.y,
      size: taille,
      font: police,
      color: options.couleur ?? NOIR,
    });
  };

  const filet = (y: number, x1 = MARGE, x2 = DROITE) => {
    plume.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.8, color: TRAIT });
  };

  /** Ouvre une page si la hauteur demandée ne tient plus au-dessus du pied. */
  const assurerEspace = (hauteur: number) => {
    if (plume.y - hauteur > HAUTEUR_PIED) return;
    plume.page = doc.addPage([LARGEUR, HAUTEUR]);
    plume.y = HAUTEUR - MARGE;
  };

  // ---- Logo ----
  const logo = await doc.embedPng(logoPngBytes());
  const hauteurLogo = 48;
  plume.page.drawImage(logo, {
    x: MARGE,
    y: plume.y - hauteurLogo,
    width: hauteurLogo * LOGO_RATIO,
    height: hauteurLogo,
  });
  plume.y -= hauteurLogo + 26;

  // ---- Client à gauche, vendeur à droite ----
  const hautBloc = plume.y;
  texte("Kunde", { police: grasse, taille: 18 });
  texte(COMPANY.name.toUpperCase(), { police: grasse, taille: 13.5, finX: DROITE, y: hautBloc });

  plume.y -= 24;
  let yVendeur = hautBloc - 24;
  for (const ligne of [COMPANY.street, COMPANY.city, COMPANY.phone, COMPANY.email]) {
    texte(ligne, { taille: 11, couleur: GRIS, finX: DROITE, y: yVendeur });
    yVendeur -= 16;
  }

  for (const ligne of lignesAdresse(order.billing)) {
    texte(ligne, { taille: 12.5 });
    plume.y -= 16;
  }

  // Coordonnées de contact : le client doit pouvoir vérifier d'un coup d'œil
  // que la facture est bien la sienne.
  plume.y -= 4;
  const largeurEtiquetteMail = grasse.widthOfTextAtSize("E-Mail : ", 12.5);
  texte("E-Mail :", { police: grasse, taille: 12.5 });
  texte(order.email, { x: MARGE + largeurEtiquetteMail, taille: 12.5, couleur: LIEN });
  if (order.phone) {
    plume.y -= 18;
    const largeurEtiquetteTel = grasse.widthOfTextAtSize("Telefon : ", 12.5);
    texte("Telefon :", { police: grasse, taille: 12.5 });
    texte(order.phone, { x: MARGE + largeurEtiquetteTel, taille: 12.5 });
  }

  plume.y = Math.min(plume.y, yVendeur) - 24;

  // ---- Références de la facture ----
  const references: Array<[string, string]> = [
    ["Rechnung Nr. :", order.orderNumber],
    ["Rechnungsdatum :", dateAllemande(order.createdAt)],
    ["Bestelldatum :", dateAllemande(order.createdAt)],
  ];
  for (const [etiquette, valeur] of references) {
    texte(etiquette, { police: grasse, taille: 12.5, finX: 430 });
    texte(valeur, { police: grasse, taille: 12.5, x: 450 });
    plume.y -= 19;
  }

  // ---- Tableau des articles ----
  plume.y -= 14;
  texte("Nr", { police: grasse, taille: 10, couleur: GRIS, x: COL_NUM });
  texte("FOTO", { police: grasse, taille: 10, couleur: GRIS, x: COL_PHOTO });
  texte("ARTIKEL", { police: grasse, taille: 10, couleur: GRIS, x: COL_ARTICLE });
  texte("MENGE", { police: grasse, taille: 10, couleur: GRIS, centreX: COL_MENGE });
  texte("PREIS", { police: grasse, taille: 10, couleur: GRIS, finX: COL_PREIS });
  texte("GESAMTPREIS", { police: grasse, taille: 10, couleur: GRIS, finX: DROITE });

  plume.y -= 10;
  filet(plume.y);
  plume.y -= 20;

  // ---- Choix de la densité ----
  //
  // Tout ce qui suit les articles a une hauteur connue d'avance : le décompte
  // varie d'une ligne selon qu'un coupon s'applique, le bloc bancaire d'une
  // ligne par coordonnée, et le pied est à hauteur fixe. On en déduit la place
  // laissée aux articles, puis la densité qui la respecte.
  const virement = lignesVirement(order, bank);
  const lignesDecompte = 2 + (order.discountCents > 0 ? 1 : 0); // sous-total, [remise], livraison
  const hauteurDecompte =
    DECOMPTE_ENTETE +
    lignesDecompte * DECOMPTE_LIGNE +
    DECOMPTE_DELAI +
    DECOMPTE_FILET +
    DECOMPTE_TOTAL;
  const hauteurBanque = virement.length > 0 ? BANQUE_ENTETE + virement.length * BANQUE_LIGNE : 0;
  const placeArticles = plume.y - HAUTEUR_PIED - hauteurDecompte - hauteurBanque;

  /** Hauteur qu'occuperait le tableau à cette densité. */
  const mesurer = (densite: Densite): number =>
    order.items.reduce((somme, article, index) => {
      const designation = couperEnLignes(
        `${article.brand} ${article.name}`.trim(),
        normale,
        densite.corps,
        LARGEUR_ARTICLE,
        densite.lignes,
      );
      // La référence article prend une ligne de plus sous la désignation.
      const hauteurTexte = designation.length * densite.interligne + (article.sku ? 12 : 0);
      const hauteurVignette = densite.vignette > 0 && vignettes[index] ? densite.vignette : 0;
      return somme + Math.max(hauteurVignette, hauteurTexte) + densite.respiration;
    }, 0);

  const densite =
    DENSITES.find((candidate) => mesurer(candidate) <= placeArticles) ??
    DENSITES[DENSITES.length - 1];

  order.items.forEach((article: OrderItemRecord, index: number) => {
    const designation = couperEnLignes(
      `${article.brand} ${article.name}`.trim(),
      normale,
      densite.corps,
      LARGEUR_ARTICLE,
      densite.lignes,
    );
    const vignette = densite.vignette > 0 ? vignettes[index] : null;
    // La ligne fait au moins la hauteur de la vignette, davantage si la
    // désignation tient sur plusieurs lignes et porte une référence en dessous.
    const hauteurTexte = designation.length * densite.interligne + (article.sku ? 12 : 0);
    const hauteurLigne =
      Math.max(vignette ? densite.vignette : 0, hauteurTexte) + densite.respiration;
    assurerEspace(hauteurLigne);

    const haut = plume.y;
    const milieu = haut - hauteurLigne / 2 + 4;

    texte(String(index + 1), { taille: densite.corps, couleur: GRIS, x: COL_NUM, y: haut });

    if (vignette) {
      // La vignette est contenue dans son carré sans être déformée.
      const cote = densite.vignette;
      const echelle = Math.min(cote / vignette.width, cote / vignette.height);
      const largeurImage = vignette.width * echelle;
      const hauteurImage = vignette.height * echelle;
      plume.page.drawImage(vignette as PDFImage, {
        x: COL_PHOTO + (cote - largeurImage) / 2,
        y: haut + 8 - hauteurImage,
        width: largeurImage,
        height: hauteurImage,
      });
    }

    let yTexte = haut;
    for (const ligne of designation) {
      texte(ligne, { taille: densite.corps, x: COL_ARTICLE, y: yTexte });
      yTexte -= densite.interligne;
    }
    if (article.sku) {
      texte(`Art.-Nr. ${article.sku}`, { taille: 8.5, couleur: GRIS, x: COL_ARTICLE, y: yTexte });
    }

    texte(String(article.quantity), { taille: densite.corps, centreX: COL_MENGE, y: milieu });
    texte(euros(article.unitPriceCents), { taille: densite.corps, finX: COL_PREIS, y: milieu });
    texte(euros(article.lineTotalCents), { taille: densite.corps, finX: DROITE, y: milieu });

    plume.y = haut - hauteurLigne;
  });

  filet(plume.y);
  plume.y -= DECOMPTE_ENTETE;

  // ---- Décompte ----
  // Les lignes sont TTC et s'additionnent réellement jusqu'au total ; la TVA
  // est signalée comme contenue, conformément au § 3 PAngV.
  const ligneTotal = (etiquette: string, valeur: string, options: { fort?: boolean } = {}) => {
    const taille = options.fort ? 17 : 12.5;
    // Le total est composé plus gros : son étiquette recule, sans quoi un
    // montant à cinq chiffres viendrait la toucher.
    texte(etiquette, {
      police: grasse,
      taille,
      couleur: options.fort ? NOIR : GRIS,
      finX: options.fort ? COL_PREIS - 52 : COL_PREIS,
    });
    texte(valeur, {
      police: options.fort ? grasse : normale,
      taille,
      finX: DROITE,
    });
    plume.y -= options.fort ? DECOMPTE_TOTAL : DECOMPTE_LIGNE;
  };

  ligneTotal("ZWISCHENSUMME", euros(order.subtotalCents));

  // Remise du coupon, déduite entre le sous-total et la livraison. Sans cette
  // ligne, une facture remisée ne s'additionnait plus : le client lisait un
  // sous-total et un port dont la somme dépassait le total facturé, ce qu'une
  // facture ne peut pas se permettre. Le code est nommé à côté du montant
  // c'est la pièce qui justifie la déduction en cas de contrôle.
  if (order.discountCents > 0) {
    ligneTotal(
      order.couponCode ? `RABATT (${order.couponCode})` : "RABATT",
      // Tiret ASCII et non « − » : `winAnsi` efface tout signe hors du jeu des
      // polices standard, et la remise se lirait alors comme une majoration.
      `- ${euros(order.discountCents)}`,
    );
  }

  ligneTotal("LIEFERUNG", order.shippingCents === 0 ? "KOSTENLOS" : euros(order.shippingCents));
  texte(delaiLivraison(order), { taille: 10.5, couleur: GRIS, finX: DROITE });
  plume.y -= DECOMPTE_DELAI;

  filet(plume.y, COL_PREIS - 120, DROITE);
  plume.y -= DECOMPTE_FILET;
  ligneTotal("GESAMTBETRAG", euros(order.totalCents), { fort: true });

  // ---- Coordonnées bancaires, pour le virement seul ----
  if (virement.length > 0) {
    plume.y -= 12;
    filet(plume.y);
    plume.y -= 24;

    texte(`Zahlungsart : ${order.paymentMethodLabel}`, {
      police: grasse,
      taille: 14.5,
      centreX: LARGEUR / 2,
    });
    plume.y -= 26;

    for (const [etiquette, valeur] of virement) {
      texte(`${etiquette} :`, { police: grasse, taille: 12, finX: 285 });
      texte(valeur, { taille: 12, x: 295 });
      plume.y -= BANQUE_LIGNE;
    }
  }

  // ---- Mentions de bas de page ----
  // Toujours sur la dernière page, à hauteur fixe : ce sont les mentions que le
  // lecteur cherche en bas, pas au fil du décompte.
  const derniere = doc.getPages()[doc.getPageCount() - 1];
  plume.page = derniere;

  const mentions = [
    "Lieferung : Das Lieferdatum entspricht dem Versanddatum und wird gesondert mitgeteilt.",
    `Zahlung : ${order.paymentMethodLabel}. Zahlbar sofort und ohne Abzug.`,
    "Bei Zahlungsverzug berechnen wir Verzugszinsen gemäß § 288 BGB.",
    `${COMPANY.name} · ${COMPANY.street} · ${COMPANY.city} · Tel. ${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.register}`,
  ];

  // La ligne d'identification de la société dépasse la justification à ce
  // corps : on la replie plutôt que de la rogner, les mentions du § 14 UStG
  // devant rester lisibles en entier.
  const TAILLE_MENTION = 9.5;
  const INTERLIGNE_MENTION = 13;
  const lignesMentions = mentions.flatMap((mention) =>
    couperEnLignes(mention, normale, TAILLE_MENTION, DROITE - MARGE, 2),
  );

  let yMention = 56 + (lignesMentions.length - 1) * INTERLIGNE_MENTION;
  for (const ligne of lignesMentions) {
    texte(ligne, { taille: TAILLE_MENTION, couleur: GRIS, x: MARGE, y: yMention });
    yMention -= INTERLIGNE_MENTION;
  }


  const octets = await doc.save();
  return Buffer.from(octets);
}

/** Nom du fichier joint, lisible dans la boîte de réception du client. */
export function invoiceFilename(order: OrderRecord): string {
  return `Rechnung-${order.orderNumber}.pdf`;
}
