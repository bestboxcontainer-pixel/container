"use client";

import { useState, type FormEvent } from "react";

const INPUT_CLASSES =
  "w-full rounded-sm border border-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

/** Formulaire général de la page /kontakt, envoyé via /api/contact. */
export function ContactForm() {
  const [name, setName] = useState("");
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

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, message }),
    });

    setPending(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-sm border border-border p-6 sm:p-8">
        <h2 className="text-xl font-black text-foreground">Vielen Dank für Ihre Nachricht!</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Wir melden uns in Kürze bei Ihnen zurück.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-border p-6 sm:p-8">
      <h2 className="text-xl font-black text-foreground">Anfrage senden</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Ob Kauf, Miete oder Sonderanfertigung: Schildern Sie uns Ihr Vorhaben, wir melden uns
        zeitnah zurück.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Name *</span>
          <input
            required
            minLength={2}
            maxLength={160}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className={INPUT_CLASSES}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">E-Mail *</span>
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
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Telefon <span className="font-normal text-foreground/50">(optional)</span>
          </span>
          <input
            type="tel"
            maxLength={40}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            className={INPUT_CLASSES}
          />
        </label>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-foreground">
            Ihre Anfrage *
          </label>
          <textarea
            id="message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Container-Typ, gewünschte Maße, Einsatzort und Zeitraum…"
            className={INPUT_CLASSES}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-sm bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Wird gesendet…" : "Anfrage senden"}
      </button>
    </form>
  );
}
