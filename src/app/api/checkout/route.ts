import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createOrder, OrderError, parseCheckoutPayload } from "@/server/orders";
import type { CheckoutErrorCode } from "@/server/orders";
import { getCurrentCustomer } from "@/server/customerSession";
import { resolveCampaignContext } from "@/server/campaignContext";

// Point d'entrée public du tunnel de commande.
//
// Rien de ce que le navigateur envoie n'est repris tel quel en dehors des
// coordonnées : les identifiants de produit servent à relire les prix et le
// stock en base, les montants sont recalculés côté serveur, et le moyen de
// paiement doit figurer parmi ceux activés dans le back-office.
//
// La route reste ouverte aux visiteurs sans compte : commander en tant
// qu'invité est la règle, pas une tolérance. Si un cookie de session client
// valide accompagne la requête, la commande est simplement rattachée au compte
// correspondant.

/** Messages neutres, doublés en allemand et en anglais : le client affiche sa propre traduction à partir du code. */
const MESSAGES: Record<CheckoutErrorCode, { de: string; en: string }> = {
  invalid_payload: {
    de: "Die Bestellung konnte nicht gelesen werden.",
    en: "The order could not be read.",
  },
  cart_empty: { de: "Ihr Warenkorb ist leer.", en: "Your cart is empty." },
  cart_too_large: {
    de: "Ihr Warenkorb enthält zu viele verschiedene Artikel.",
    en: "Your cart contains too many different items.",
  },
  invalid_quantity: {
    de: "Bitte wählen Sie je Artikel eine Menge zwischen 1 und 20.",
    en: "Please choose a quantity between 1 and 20 per item.",
  },
  invalid_email: {
    de: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    en: "Please enter a valid email address.",
  },
  invalid_name: {
    de: "Bitte geben Sie Vor- und Nachnamen an.",
    en: "Please enter a first and last name.",
  },
  invalid_street: {
    de: "Bitte geben Sie Straße und Hausnummer an.",
    en: "Please enter a street and house number.",
  },
  invalid_postal_code: {
    de: "Bitte geben Sie eine gültige Postleitzahl an.",
    en: "Please enter a valid postcode.",
  },
  invalid_city: { de: "Bitte geben Sie einen Ort an.", en: "Please enter a city." },
  unsupported_country: {
    de: "Wir liefern derzeit ausschließlich innerhalb Deutschlands.",
    en: "We currently deliver within Germany only.",
  },
  invalid_phone: {
    de: "Bitte geben Sie eine gültige Telefonnummer an.",
    en: "Please enter a valid phone number.",
  },
  invalid_payment_method: {
    de: "Bitte wählen Sie eine verfügbare Zahlungsart.",
    en: "Please choose an available payment method.",
  },
  terms_required: { de: "Bitte akzeptieren Sie die AGB.", en: "Please accept the terms." },
  withdrawal_required: {
    de: "Bitte bestätigen Sie die Widerrufsbelehrung.",
    en: "Please confirm the withdrawal policy.",
  },
  product_unavailable: {
    de: "Ein Artikel aus Ihrem Warenkorb ist nicht mehr verfügbar.",
    en: "An item in your cart is no longer available.",
  },
  insufficient_stock: {
    de: "Der gewünschte Bestand ist nicht mehr verfügbar.",
    en: "The requested quantity is no longer in stock.",
  },
  order_failed: {
    de: "Die Bestellung konnte nicht abgeschlossen werden.",
    en: "The order could not be completed.",
  },
};

function errorResponse(code: CheckoutErrorCode, status: number, detail?: unknown) {
  const message = MESSAGES[code];
  return NextResponse.json(
    {
      code,
      // « error » reste rempli pour les appels bruts (curl, intégrations)
      error: `${message.de} / ${message.en}`,
      messages: message,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const { input, errors } = parseCheckoutPayload(payload);

  if (!input) {
    return errorResponse(errors[0] ?? "invalid_payload", 400);
  }

  // Rattachement au compte : lu dans le cookie signé, jamais dans la charge
  // utile. Un visiteur sans compte, ou dont la session a expiré, passe commande
  // comme avant.
  const customer = await getCurrentCustomer();

  // Rattachement à la campagne qui a amené le visiteur, lu dans son cookie et
  // revalidé en base. C'est le seul endroit où l'attribution se décide : le
  // navigateur n'envoie qu'un jeton, jamais un montant ni un droit.
  const campaign = await resolveCampaignContext();

  try {
    const order = await createOrder(
      input,
      customer?.id,
      campaign ? { campaignId: campaign.campaignId, recipientId: campaign.recipientId } : undefined,
    );

    // Les stocks affichés dans la boutique ont changé.
    revalidatePath("/", "layout");

    return NextResponse.json(
      {
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        // Chemin à suivre après la commande ; le jeton évite qu'un numéro
        // deviné donne accès à l'adresse du client.
        confirmationPath: `/bestellung/${order.orderNumber}?token=${order.accessToken}`,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalCents: order.totalCents,
        currency: order.currency,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.code === "order_failed" ? 500 : 409;
      return errorResponse(error.code, status, error.detail);
    }
    // Panne inattendue : la trace reste côté serveur, le client ne reçoit
    // qu'un message générique.
    console.error("[checkout] Bestellung fehlgeschlagen:", error);
    return errorResponse("order_failed", 500);
  }
}
