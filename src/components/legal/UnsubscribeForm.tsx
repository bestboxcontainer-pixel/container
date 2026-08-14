"use client";

import { useState } from "react";

interface UnsubscribeFormProps {
  token: string;
  labels: {
    confirm: string;
    sending: string;
    done: string;
    error: string;
  };
}

/**
 * Bouton de confirmation du désabonnement.
 *
 * Le refus n'est enregistré qu'au clic, jamais à l'ouverture de la page : les
 * antivirus et les proxys de messagerie préchargent les liens des messages, et
 * une page qui agirait au chargement désabonnerait des gens qui n'ont rien
 * demandé.
 */
export function UnsubscribeForm({ token, labels }: UnsubscribeFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function confirm() {
    setState("sending");
    const response = await fetch("/api/abmeldung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  if (state === "done") {
    return <p className="text-sm text-muted-foreground">{labels.done}</p>;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={confirm}
        disabled={state === "sending"}
        className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
      >
        {state === "sending" ? labels.sending : labels.confirm}
      </button>
      {state === "error" && <p className="text-sm text-destructive">{labels.error}</p>}
    </div>
  );
}
