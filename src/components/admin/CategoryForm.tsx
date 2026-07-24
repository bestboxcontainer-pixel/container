"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CategoryRecord } from "@/server/types";

interface CategoryFormProps {
  mode: "new" | "edit";
  initialData?: CategoryRecord;
}

export function CategoryForm({ mode, initialData }: CategoryFormProps) {
  const router = useRouter();
  const [group, setGroup] = useState(initialData?.group ?? "haushalt");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [image, setImage] = useState(initialData?.image ?? "");
  const [guideJson, setGuideJson] = useState(
    JSON.stringify(initialData?.guide ?? { intro: "", sections: [], closing: "" }, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let guide;
    try {
      guide = JSON.parse(guideJson);
    } catch {
      setError("Der Ratgeber-Inhalt (JSON) ist ungültig.");
      return;
    }

    setPending(true);
    const payload = { group, slug, label, description, image, guide };
    const url = mode === "new" ? "/api/admin/categories" : `/api/admin/categories/${initialData?.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);
    if (response.ok) {
      router.push("/admin/categories");
      router.refresh();
    } else {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Speichern fehlgeschlagen.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-sm border border-border bg-white p-6">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Gruppe</span>
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value as "haushalt" | "multimedia")}
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          >
            <option value="haushalt">Haushalt</option>
            <option value="multimedia">Multimedia</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Slug</span>
          <input
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">Label</span>
        <input
          required
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">Beschreibung</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">Bildpfad</span>
        <input
          value={image}
          onChange={(event) => setImage(event.target.value)}
          placeholder="/images/products/…"
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">
          Ratgeber (JSON — intro, sections, closing)
        </span>
        <textarea
          value={guideJson}
          onChange={(event) => setGuideJson(event.target.value)}
          rows={8}
          className="w-full rounded-sm border border-border px-3 py-2 font-mono text-xs outline-none focus:border-primary"
        />
      </label>

      {error && <p className="mb-4 text-sm font-semibold text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Speichern…" : "Speichern"}
      </button>
    </form>
  );
}
