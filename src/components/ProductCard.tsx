import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/home";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={product.href}
      className="flex h-full flex-col rounded-sm border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative mb-2 min-h-6">
        {product.badge && (
          <span className="absolute top-0 left-0 z-10 rounded-sm bg-badge px-2 py-0.5 text-[11px] font-bold text-badge-foreground">
            {product.badge}
          </span>
        )}
      </div>
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-sm bg-muted">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 16vw, 45vw"
          className="object-cover"
        />
      </div>
      <p className="truncate text-xs font-bold text-muted-foreground uppercase">{product.brand}</p>
      <p className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
      <ul className="mb-3 space-y-0.5 text-xs text-muted-foreground">
        {product.bullets.map((bullet) => (
          <li key={bullet}>• {bullet}</li>
        ))}
      </ul>
      <div className="mt-auto flex items-end gap-2">
        {product.oldPrice && (
          <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
        )}
        <span className="text-lg font-black text-primary">{product.price}</span>
      </div>
    </Link>
  );
}
