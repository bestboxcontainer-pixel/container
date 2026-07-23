import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/home";

export function ProductGrid({
  heading,
  ctaLabel,
  ctaHref,
  products,
}: {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
  products: Product[];
}) {
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground">{heading}</h2>
        <Link href={ctaHref} className="text-sm font-semibold text-primary hover:underline">
          {ctaLabel}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}
