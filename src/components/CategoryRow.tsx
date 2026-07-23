import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/home";

const categories: Category[] = [
  { label: "Küche", href: "/kueche", image: "/images/products/oven.jpg" },
  { label: "Kühlen & Gefrieren", href: "/kuehlen-gefrieren", image: "/images/products/fridge.jpg" },
  { label: "Waschen & Trocknen", href: "/waschen-trocknen", image: "/images/products/washing-machine.jpg" },
  { label: "Kleingeräte", href: "/kleingeraete", image: "/images/products/coffee-machine.jpg" },
  { label: "TV & Audio", href: "/tv-audio", image: "/images/products/tv.jpg" },
  { label: "Reinigung", href: "/reinigung", image: "/images/products/vacuum.jpg" },
  { label: "Klimageräte", href: "/klimageraete", image: "/images/products/aircon.jpg" },
  { label: "Smart Home", href: "/smart-home", image: "/images/products/smart-speaker.jpg" },
];

export function CategoryRow() {
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <h2 className="mb-4 text-xl font-black text-foreground">Entdecken Sie unsere Kategorien</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((cat) => (
          <Link key={cat.label} href={cat.href} className="group flex flex-col items-center gap-2">
            <span className="relative block aspect-square w-full overflow-hidden rounded-full border border-border">
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(min-width: 1024px) 12vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            </span>
            <span className="text-center text-xs font-semibold text-foreground group-hover:text-primary">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
