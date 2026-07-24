import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types/home";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={product.href}
      className="group flex h-full flex-col rounded-sm border border-border bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
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
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <p className="truncate text-xs font-bold text-muted-foreground uppercase">{product.brand}</p>
      <p className="mb-1 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{product.name}</p>
      {typeof product.rating === "number" && (
        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          {product.rating.toFixed(1)}
        </p>
      )}
      <ul className="mb-3 space-y-0.5 text-xs text-muted-foreground">
        {product.bullets.map((bullet) => (
          <li key={bullet}>• {bullet}</li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="flex items-end gap-2">
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
          )}
          <span className="text-lg font-black text-primary">{product.price}</span>
        </div>
        {product.inStock === false && (
          <span className="text-[11px] font-semibold text-muted-foreground">Auf Anfrage</span>
        )}
      </div>
    </Link>
  );
}
