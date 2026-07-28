import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
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
      {/* Quatre par ligne sur grand écran : à six, la vignette devenait trop
          étroite pour que le nom du modèle et la liste d'arguments tiennent
          sans être coupés. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={product.slug ?? product.name} delay={Math.min(index * 60, 300)}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
