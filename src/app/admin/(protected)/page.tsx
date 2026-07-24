import Link from "next/link";
import { listCategories, listProducts } from "@/server/store";

export default async function AdminDashboardPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const outOfStock = products.filter((product) => product.inStock === false).length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-foreground">Übersicht</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/categories"
          className="rounded-sm border border-border bg-white p-5 hover:border-primary"
        >
          <p className="text-3xl font-black text-foreground">{categories.length}</p>
          <p className="text-sm text-muted-foreground">Kategorien</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-sm border border-border bg-white p-5 hover:border-primary"
        >
          <p className="text-3xl font-black text-foreground">{products.length}</p>
          <p className="text-sm text-muted-foreground">Produkte</p>
        </Link>
        <div className="rounded-sm border border-border bg-white p-5">
          <p className="text-3xl font-black text-foreground">{outOfStock}</p>
          <p className="text-sm text-muted-foreground">Auf Anfrage (nicht vorrätig)</p>
        </div>
      </div>
    </div>
  );
}
