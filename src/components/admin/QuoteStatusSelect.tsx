"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteRequestStatus } from "@/server/quotes";

const LABELS: Record<QuoteRequestStatus, string> = {
  new: "Nouvelle",
  contacted: "Contacté",
  closed: "Clôturée",
};

export function QuoteStatusSelect({ id, status }: { id: string; status: QuoteRequestStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(next: QuoteRequestStatus) {
    setPending(true);
    const response = await fetch(`/api/admin/devis/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    // La liste dépend du filtre actif : un changement de statut peut faire
    // sortir la ligne de l'onglet courant, d'où le rafraîchissement complet
    // plutôt qu'une mise à jour locale de l'état.
    if (response.ok) router.refresh();
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(event) => handleChange(event.target.value as QuoteRequestStatus)}
      className="rounded-sm border border-border bg-white px-2 py-1.5 text-xs font-bold text-foreground disabled:opacity-60"
    >
      {(Object.keys(LABELS) as QuoteRequestStatus[]).map((value) => (
        <option key={value} value={value}>
          {LABELS[value]}
        </option>
      ))}
    </select>
  );
}
