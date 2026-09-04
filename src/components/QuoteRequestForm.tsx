"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

const INPUT_CLASSES =
  "w-full rounded-sm border border-input px-3 py-2 outline-none focus:border-primary";

/** Valeurs neutres envoyées à l'API ; l'affichage passe par les traductions. */
type Salutation = "" | "herr" | "frau";

/**
 * Formulaire de demande de devis, envoyé par « Angebot anfragen » sur la
 * fiche produit. Le produit n'est identifié que par le chemin de sa fiche :
 * l'API relit son nom, sa référence et son prix elle-même plutôt que de faire
 * confiance à ce que le navigateur lui envoie.
 */
export function QuoteRequestForm({ productHref }: { productHref: string }) {
  const t = useTranslations("quoteRequest");
  const locale = useLocale();

  const [salutation, setSalutation] = useState<Salutation>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productHref,
        salutation: salutation || undefined,
        firstName,
        lastName,
        email,
        phone,
        message: message || undefined,
      }),
    });

    setPending(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      // L'API ne répond qu'en allemand : son message détaillé n'est repris que
      // sur la boutique allemande, ailleurs on affiche le message générique.
      const serverMessage = locale === "de" ? data?.error : undefined;
      setError(serverMessage ?? t("formError"));
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-sm border border-border bg-muted p-5">
        <p className="font-black text-foreground">{t("formSuccessTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("formSuccessHint")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-border bg-white p-5 sm:p-6">
      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">{t("formSalutation")}</span>
        <select
          value={salutation}
          onChange={(event) => setSalutation(event.target.value as Salutation)}
          autoComplete="honorific-prefix"
          className={INPUT_CLASSES}
        >
          <option value="">{t("formSalutationUnspecified")}</option>
          <option value="herr">{t("formSalutationMr")}</option>
          <option value="frau">{t("formSalutationMrs")}</option>
        </select>
      </label>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-foreground">
            {t("formFirstName")} <span aria-hidden>*</span>
          </span>
          <input
            required
            minLength={2}
            maxLength={80}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            className={INPUT_CLASSES}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-foreground">
            {t("formLastName")} <span aria-hidden>*</span>
          </span>
          <input
            required
            minLength={2}
            maxLength={80}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            className={INPUT_CLASSES}
          />
        </label>
      </div>

      {/* Bloc « Coordonnées » : c'est par là que la boutique recontacte le
          client, l'e-mail et le téléphone sont donc tous deux obligatoires. */}
      <fieldset className="mb-4 border-t border-border pt-4">
        <legend className="font-black text-foreground">{t("formContactHeading")}</legend>
        <p className="mb-3 text-sm text-muted-foreground">{t("formContactHint")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-foreground">
              {t("formEmail")} <span aria-hidden>*</span>
            </span>
            <input
              type="email"
              required
              maxLength={160}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className={INPUT_CLASSES}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-foreground">
              {t("formPhone")} <span aria-hidden>*</span>
            </span>
            <input
              type="tel"
              required
              minLength={4}
              maxLength={40}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className={INPUT_CLASSES}
            />
            <span className="mt-1 block text-xs text-muted-foreground">{t("formPhoneHint")}</span>
          </label>
        </div>
      </fieldset>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">{t("formMessage")}</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("formMessagePlaceholder")}
          className={INPUT_CLASSES}
        />
      </label>

      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("formSubmitting") : t("formSubmit")}
      </button>
    </form>
  );
}
