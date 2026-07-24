import Link from "next/link";
import { listCategories, listProducts } from "@/server/store";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const countByCategory = new Map<string, number>();
  for (const product of products) {
    countByCategory.set(product.categoryId, (countByCategory.get(product.categoryId) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Kategorien</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          Neue Kategorie
        </Link>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Gruppe</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Produkte</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-foreground">{category.label}</td>
                <td className="px-4 py-3 text-muted-foreground">{category.group}</td>
                <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {countByCategory.get(category.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="mr-3 font-semibold text-primary hover:underline"
                  >
                    Bearbeiten
                  </Link>
                  <DeleteButton
                    action={`/api/admin/categories/${category.id}`}
                    confirmLabel={`Kategorie "${category.label}" wirklich löschen? Alle zugehörigen Produkte werden ebenfalls gelöscht.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
