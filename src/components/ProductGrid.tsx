import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { PRODUCT_SHELL_TOKENS } from "@/lib/productLayoutTokens";
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
    <section className={PRODUCT_SHELL_TOKENS.detailInner}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className={PRODUCT_SHELL_TOKENS.sectionTitle}>{heading}</h2>
        <Link
          href={ctaHref}
          className="rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          {ctaLabel}
        </Link>
      </div>
      {/* Quatre par ligne sur grand écran : à six, la vignette devenait trop
          étroite pour que le nom du modèle et la liste d'arguments tiennent
          sans être coupés. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={product.slug ?? product.name} delay={Math.min(index * 60, 300)}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
