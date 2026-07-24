"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Anmeldung fehlgeschlagen.");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-sm border border-border bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-black text-foreground">Admin-Login</h1>
        <p className="mb-6 text-sm text-muted-foreground">Hausgeräte Pfeffer – Verwaltung</p>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold text-foreground">E-Mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block font-semibold text-foreground">Passwort</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {error && <p className="mb-4 text-sm font-semibold text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
