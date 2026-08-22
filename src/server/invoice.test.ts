/**
 * Tests du bloc bancaire de la facture et de la préparation des vignettes.
 *
 * L'enjeu : la facture d'une commande payée d'avance doit porter le compte sur
 * lequel virer et la référence à indiquer — c'est la pièce que le client passe
 * à sa banque. Inversement, une facture déjà réglée, ou réglée autrement, ne
 * doit surtout pas réclamer un virement de plus.
 *
 * Les vignettes, elles, ne doivent jamais faire échouer la composition : une
 * adresse inutilisable se traduit par une case vide, pas par une exception.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import type { BankTransferSettings } from "@/lib/bankTransfer";
import type { OrderRecord } from "@/server/orders";
import { buildInvoicePdf, lignesVirement, urlVignette } from "./invoice";

const BANK: BankTransferSettings = {
  holder: "BBC Best Box Containerhandel e.K.",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
  transferType: "SEPA-Echtzeitüberweisung",
  instructions: { de: "Bitte überweisen Sie {total}.", en: "Please transfer {total}." },
};

const COMMANDE = {
  paymentMethodKey: "vorkasse",
  paidAt: undefined,
  orderNumber: "HP-2026-000042",
};

/** Les paires sont mises à plat pour vérifier la présence d'une mention. */
function aplati(paires: Array<[string, string]>): string {
  return paires.map(([etiquette, valeur]) => `${etiquette}: ${valeur}`).join("\n");
}

describe("Bloc bancaire de la facture", () => {
  it("porte le compte et la référence sur une commande en virement non réglée", () => {
    const lignes = aplati(lignesVirement(COMMANDE, BANK));

    assert.match(lignes, /Kontoinhaber: BBC Best Box Containerhandel e.K./);
    assert.match(lignes, /IBAN: DE89 3704 0044 0532 0130 00/);
    assert.match(lignes, /BIC: COBADEFFXXX/);
    assert.match(lignes, /Bank: Commerzbank/);
    assert.match(lignes, /Überweisungsart: SEPA-Echtzeitüberweisung/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });

  it("passe le type de virement sous silence quand il n'est pas renseigné", () => {
    const lignes = aplati(lignesVirement(COMMANDE, { ...BANK, transferType: "" }));

    assert.doesNotMatch(lignes, /Überweisungsart/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });

  it("ne réclame rien sur une commande déjà payée", () => {
    const paid = { ...COMMANDE, paidAt: "2026-08-01T10:00:00.000Z" };
    assert.deepEqual(lignesVirement(paid, BANK), []);
  });

  it("ne réclame rien sur un autre moyen de paiement", () => {
    assert.deepEqual(lignesVirement({ ...COMMANDE, paymentMethodKey: "rechnung" }, BANK), []);
    assert.deepEqual(lignesVirement({ ...COMMANDE, paymentMethodKey: "nachnahme" }, BANK), []);
  });

  it("ne réclame rien sans coordonnées disponibles", () => {
    assert.deepEqual(lignesVirement(COMMANDE, undefined), []);
  });

  it("omet le nom de la banque quand il n'est pas renseigné", () => {
    const lignes = aplati(lignesVirement(COMMANDE, { ...BANK, bank: "" }));
    assert.doesNotMatch(lignes, /Bank:/);
    assert.match(lignes, /Verwendungszweck: HP-2026-000042/);
  });
});

/**
 * Commande d'essai. Les désignations sont volontairement longues — elles tiennent
 * sur deux lignes — et l'adresse complète : c'est le cas défavorable, celui qui
 * décide de la pagination.
 */
function commandeEssai(nbArticles: number, remiseCents: number): OrderRecord {
  const adresse = {
    firstName: "Maximilian",
    lastName: "Wagenknecht-Hofmann",
    company: "",
    street: "Friedrichstraße 128a",
    postalCode: "10117",
    city: "Berlin",
    country: "DE",
  };
  const items = Array.from({ length: nbArticles }, (_, i) => ({
    id: `it${i}`,
    productId: `p${i}`,
    sku: `SKU-00${i}`,
    brand: "Siemens",
    name: "EQ.6 plus s700 Kaffeevollautomat mit Milchaufschäumer und Keramikmahlwerk",
    image: "",
    unitPriceCents: 64900,
    quantity: 1,
    lineTotalCents: 64900,
  }));
  const subtotal = items.reduce((somme, article) => somme + article.lineTotalCents, 0);

  return {
    orderNumber: "HP-2026-000042",
    locale: "de",
    email: "maximilian.wagenknecht@example.de",
    phone: "+49 30 12345678",
    billing: adresse,
    shipping: adresse,
    shippingSameAsBilling: true,
    paymentMethodKey: "vorkasse",
    paymentMethodLabel: "Vorkasse per Überweisung",
    shippingMethodKey: "standard",
    subtotalCents: subtotal,
    shippingCents: 0,
    couponCode: remiseCents > 0 ? "SOMMER10" : "",
    discountCents: remiseCents,
    totalCents: subtotal - remiseCents,
    taxRatePercent: 19,
    createdAt: "2026-08-06T10:00:00.000Z",
    items,
    events: [],
  } as unknown as OrderRecord;
}

async function nombreDePages(order: OrderRecord): Promise<number> {
  const pdf = await buildInvoicePdf(order, BANK);
  return (await PDFDocument.load(pdf)).getPageCount();
}

describe("Pagination de la facture", () => {
  // La facture est une pièce qu'on imprime et qu'on classe : une deuxième page
  // pour une seule ligne de remise est une régression visible par le client.
  it("tient sur une page qu'un coupon s'applique ou non", async () => {
    for (const nbArticles of [1, 3, 8]) {
      assert.equal(
        await nombreDePages(commandeEssai(nbArticles, 0)),
        1,
        `${nbArticles} article(s) sans coupon`,
      );
      assert.equal(
        await nombreDePages(commandeEssai(nbArticles, 6490)),
        1,
        `${nbArticles} article(s) avec coupon`,
      );
    }
  });

  it("ne bascule pas d'une page à l'autre à cause de la seule ligne de remise", async () => {
    // Le défaut d'origine : le tableau était composé à hauteur fixe, et les
    // dix-neuf points de la ligne « RABATT » suffisaient à pousser le bloc
    // bancaire sur une deuxième page.
    for (let nbArticles = 1; nbArticles <= 14; nbArticles += 1) {
      const sans = await nombreDePages(commandeEssai(nbArticles, 0));
      const avec = await nombreDePages(commandeEssai(nbArticles, 6490));
      assert.equal(avec, sans, `${nbArticles} article(s) : le coupon change la pagination`);
    }
  });
});

describe("Adresse des vignettes produits", () => {
  it("force le JPEG sur une image Cloudinary livrée en format automatique", () => {
    const source =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1712345678/produits/waschmaschine.jpg";
    const url = urlVignette(source);

    // pdf-lib ne sait embarquer ni AVIF ni WebP : le format doit être imposé.
    assert.ok(url);
    assert.match(url, /f_jpg/);
    assert.doesNotMatch(url, /f_auto/);
    assert.match(url, /w_160/);
  });

  it("insère la transformation quand l'URL Cloudinary n'en porte aucune", () => {
    const url = urlVignette("https://res.cloudinary.com/demo/image/upload/v1/produits/tv.jpg");
    assert.ok(url);
    assert.match(url, /\/upload\/f_jpg,q_auto,w_160,c_fit\/v1\//);
  });

  it("laisse intacte une image hébergée ailleurs", () => {
    const source = "https://exemple.de/bilder/kuehlschrank.png";
    assert.equal(urlVignette(source), source);
  });

  it("ignore un chemin local, faute d'origine à laquelle le rattacher", () => {
    // La facture est composée hors requête HTTP : « /images/x.png » n'est
    // rattachable à aucun domaine, la case restera vide.
    assert.equal(urlVignette("/images/produkte/herd.png"), null);
    assert.equal(urlVignette(""), null);
  });
});
