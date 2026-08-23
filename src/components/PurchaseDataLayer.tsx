"use client";

import { useEffect } from "react";

/**
 * Signal d'achat poussé dans le `dataLayer` de Google Tag Manager.
 *
 * POURQUOI CE COMPOSANT EXISTE. La fin du tunnel n'est pas un chargement de
 * page : `CheckoutFlow` appelle `router.push()`, et Next remplace le contenu
 * sans que le navigateur recharge quoi que ce soit. Les événements que GTM
 * fabrique tout seul, `gtm.js`, `gtm.dom`, `gtm.load`, ne se produisent donc
 * qu'une fois, à la première page ouverte par le visiteur, jamais sur la
 * confirmation. Un déclencheur bâti sur eux ne se lève pas après un achat.
 *
 * La conversion doit être annoncée explicitement. C'est le rôle de cet
 * événement `purchase`, poussé depuis le navigateur une fois la confirmation
 * affichée.
 *
 * FORMAT. Celui de l'e-commerce GA4, que Google Ads sait lire directement pour
 * peupler la valeur, la devise et l'identifiant de transaction d'une balise de
 * conversion. Le `ecommerce: null` qui précède est la recommandation de Google :
 * sans lui, l'objet `ecommerce` de l'événement précédent survit dans le
 * `dataLayer` et ses articles se mélangent aux nouveaux.
 */

export interface PurchaseArticle {
  sku: string;
  name: string;
  brand: string;
  quantity: number;
  /** Prix unitaire en centimes, tel qu'archivé avec la commande. */
  unitPriceCents: number;
}

export interface PurchaseData {
  /** Identifiant de transaction. Il dédoublonne la conversion côté Google Ads. */
  orderNumber: string;
  totalCents: number;
  taxCents: number;
  shippingCents: number;
  /** Code de réduction appliqué, vide sans coupon. */
  couponCode: string;
  currency: string;
  items: PurchaseArticle[];
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/** Les montants Google s'expriment en unités, jamais en centimes. */
const euros = (centimes: number): number => Math.round(centimes) / 100;

/**
 * Marque de passage, pour qu'un rafraîchissement ne compte pas un second achat.
 *
 * La page de confirmation est adressable : elle porte son jeton dans l'URL et
 * arrive aussi par l'e-mail de confirmation. Sans cette marque, chaque
 * réouverture pousserait un nouvel événement, et Google Ads compterait autant de
 * conversions que de visites. Le stockage local plutôt que celui de session :
 * le client qui rouvre son lien le lendemain ne doit pas davantage recompter.
 *
 * Google Ads dédoublonne de son côté sur l'identifiant de transaction, à
 * condition qu'il soit renseigné dans la balise. Les deux garde-fous se
 * complètent : celui-ci évite l'appel, l'autre rattrape ce qui passerait quand
 * même : navigateur privé, stockage refusé, autre appareil.
 */
function dejaCompte(orderNumber: string): boolean {
  const cle = `hp.purchase.${orderNumber}`;
  try {
    if (window.localStorage.getItem(cle)) return true;
    window.localStorage.setItem(cle, "1");
    return false;
  } catch {
    // Navigation privée, stockage plein ou refusé : on laisse passer
    // l'événement. Une conversion comptée deux fois vaut mieux qu'une
    // conversion perdue, et l'identifiant de transaction la rattrape.
    return false;
  }
}

export function PurchaseDataLayer({ data }: { data: PurchaseData }) {
  useEffect(() => {
    if (dejaCompte(data.orderNumber)) return;

    const fenetre = window as DataLayerWindow;
    // Le tableau est créé s'il n'existe pas encore : ce composant peut être
    // monté avant que le conteneur GTM ait fini de charger. GTM adopte le
    // tableau déjà présent et rejoue ce qu'il contient.
    fenetre.dataLayer = fenetre.dataLayer ?? [];

    fenetre.dataLayer.push({ ecommerce: null });
    fenetre.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: data.orderNumber,
        value: euros(data.totalCents),
        tax: euros(data.taxCents),
        shipping: euros(data.shippingCents),
        currency: data.currency || "EUR",
        ...(data.couponCode ? { coupon: data.couponCode } : {}),
        items: data.items.map((article, index) => ({
          item_id: article.sku,
          item_name: `${article.brand} ${article.name}`.trim(),
          item_brand: article.brand,
          price: euros(article.unitPriceCents),
          quantity: article.quantity,
          index,
        })),
      },
    });
    // Une commande, un événement : les dépendances se limitent à son numéro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.orderNumber]);

  return null;
}
