"use client";

import { useRouter } from "next/navigation";
import type { CategoryRecord } from "@/server/types";

export function CategoryFilterSelect({
  categories,
  value,
}: {
  categories: CategoryRecord[];
  value: string;
}) {
  const router = useRouter();

  return (
    <label className="mb-4 flex items-center gap-2 text-sm">
      <span className="font-semibold text-foreground">Kategorie filtern:</span>
      <select
        value={value}
        onChange={(event) => {
          const categoryId = event.target.value;
          router.push(categoryId ? `/admin/products?categoryId=${categoryId}` : "/admin/products");
        }}
        className="rounded-sm border border-border px-2 py-1.5 outline-none focus:border-primary"
      >
        <option value="">Alle Kategorien</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
    </label>
  );
}
