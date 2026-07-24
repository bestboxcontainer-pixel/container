"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CategoryRecord } from "@/server/types";
import type { ProductRecord } from "@/server/types";

interface ProductFormProps {
  mode: "new" | "edit";
  categories: CategoryRecord[];
  initialData?: ProductRecord;
}

export function ProductForm({ mode, categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [bulletsText, setBulletsText] = useState((initialData?.bullets ?? []).join("\n"));
  const [image, setImage] = useState(initialData?.image ?? "");
  const [oldPrice, setOldPrice] = useState(initialData?.oldPrice ?? "");
  const [price, setPrice] = useState(initialData?.price ?? "");
  const [badge, setBadge] = useState(initialData?.badge ?? "");
  const [rating, setRating] = useState(initialData?.rating?.toString() ?? "");
  const [inStock, setInStock] = useState(initialData?.inStock !== false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      categoryId,
      brand,
      name,
      bullets: bulletsText.split("\n").map((line) => line.trim()).filter(Boolean),
      image: image || undefined,
      oldPrice: oldPrice || undefined,
      price,
      badge: badge || undefined,
      rating: rating ? Number.parseFloat(rating) : undefined,
      inStock,
    };

    const url = mode === "new" ? "/api/admin/products" : `/api/admin/products/${initialData?.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);
    if (response.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Speichern fehlgeschlagen.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-sm border border-border bg-white p-6">
      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">Kategorie</span>
        <select
          required
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Marke</span>
          <input
            required
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">
          Merkmale (eine Zeile pro Punkt)
        </span>
        <textarea
          value={bulletsText}
          onChange={(event) => setBulletsText(event.target.value)}
          rows={4}
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block font-semibold text-foreground">
          Bildpfad (leer = Kategoriebild verwenden)
        </span>
        <input
          value={image}
          onChange={(event) => setImage(event.target.value)}
          placeholder="/images/products/…"
          className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Alter Preis</span>
          <input
            value={oldPrice}
            onChange={(event) => setOldPrice(event.target.value)}
            placeholder="z. B. 449,00 €"
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Preis</span>
          <input
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="z. B. 349,00 €"
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Badge</span>
          <input
            value={badge}
            onChange={(event) => setBadge(event.target.value)}
            placeholder="z. B. -20%, Neu"
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-foreground">Bewertung (0–5)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="w-full rounded-sm border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => setInStock(event.target.checked)}
            className="h-4 w-4"
          />
          Vorrätig
        </label>
      </div>

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
