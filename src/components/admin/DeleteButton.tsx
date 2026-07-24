"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ action, confirmLabel }: { action: string; confirmLabel: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmLabel)) return;
    setPending(true);
    const response = await fetch(action, { method: "DELETE" });
    setPending(false);
    if (response.ok) {
      router.refresh();
    } else {
      window.alert("Löschen fehlgeschlagen.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="font-semibold text-destructive hover:underline disabled:opacity-50"
    >
      Löschen
    </button>
  );
}
