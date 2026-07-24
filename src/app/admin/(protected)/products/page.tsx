import Link from "next/link";
import { listCategories, listProducts } from "@/server/store";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CategoryFilterSelect } from "@/components/admin/CategoryFilterSelect";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(categoryId ? { categoryId } : undefined),
  ]);
  const categoryLabelById = new Map(categories.map((category) => [category.id, category.label]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">Produkte</h1>
        <Link
          href="/admin/products/new"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          Neues Produkt
        </Link>
      </div>

      <CategoryFilterSelect categories={categories} value={categoryId ?? ""} />

      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Marke</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Kategorie</th>
              <th className="px-4 py-3">Preis</th>
              <th className="px-4 py-3">Lager</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{product.brand}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{product.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categoryLabelById.get(product.categoryId) ?? product.categoryId}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{product.price}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.inStock === false ? "Auf Anfrage" : "Vorrätig"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="mr-3 font-semibold text-primary hover:underline"
                  >
                    Bearbeiten
                  </Link>
                  <DeleteButton
                    action={`/api/admin/products/${product.id}`}
                    confirmLabel={`Produkt "${product.name}" wirklich löschen?`}
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
