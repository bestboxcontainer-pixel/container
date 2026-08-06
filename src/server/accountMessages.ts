import { NextResponse } from "next/server";
import { PASSWORD_MIN_LENGTH, type AccountErrorCode } from "@/server/customers";

/**
 * Réponses d'erreur des routes de l'espace client.
 *
 * La boutique est allemande : `error` porte le message allemand, seul texte
 * qu'un appelant brut (curl, intégration) verra. L'interface, elle, traduit à
 * partir de `code` via le namespace « account » — l'anglais est donc complet
 * sans dupliquer les libellés ici.
 *
 * Aucun message ne distingue « adresse inconnue » de « mot de passe faux » :
 * l'OWASP Authentication Cheat Sheet demande un libellé unique, et le BSI
 * (ORP.4.A23) interdit explicitement d'indiquer lequel des deux est en cause.
 */
const MESSAGES: Record<AccountErrorCode, { de: string; en: string }> = {
  invalid_payload: {
    de: "Die Anfrage konnte nicht gelesen werden.",
    en: "The request could not be read.",
  },
  invalid_email: {
    de: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    en: "Please enter a valid email address.",
  },
  invalid_name: {
    de: "Bitte geben Sie Vor- und Nachnamen an.",
    en: "Please enter a first and last name.",
  },
  invalid_salutation: {
    de: "Bitte wählen Sie eine gültige Anrede.",
    en: "Please choose a valid salutation.",
  },
  invalid_phone: {
    de: "Bitte geben Sie eine gültige Telefonnummer an.",
    en: "Please enter a valid phone number.",
  },
  weak_password: {
    de: `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`,
    en: `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  },
  password_mismatch: {
    de: "Die beiden Passwörter stimmen nicht überein.",
    en: "The two passwords do not match.",
  },
  invalid_credentials: {
    de: "E-Mail-Adresse oder Passwort ist falsch.",
    en: "Email address or password is incorrect.",
  },
  account_disabled: {
    de: "E-Mail-Adresse oder Passwort ist falsch.",
    en: "Email address or password is incorrect.",
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
    de: "Dieses Land können wir nicht zuordnen. Bitte wählen Sie es erneut aus der Liste.",
    en: "We could not recognise this country. Please pick it again from the list.",
  },
  invalid_token: {
    de: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.",
    en: "This link has expired or was already used. Please request a new one.",
  },
  rate_limited: {
    de: "Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    en: "Too many attempts. Please wait a moment and try again.",
  },
  not_found: { de: "Nicht gefunden.", en: "Not found." },
  confirmation_required: {
    de: "Bitte bestätigen Sie die Löschung ausdrücklich.",
    en: "Please confirm the deletion explicitly.",
  },
  mail_failed: {
    de: "Die E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.",
    en: "The email could not be sent. Please try again later.",
  },
  server_error: {
    de: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
    en: "Something went wrong. Please try again later.",
  },
};

export function accountErrorResponse(
  code: AccountErrorCode,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  const message = MESSAGES[code];
  return NextResponse.json(
    { code, error: message.de, messages: message, ...(extra ?? {}) },
    { status },
  );
}
