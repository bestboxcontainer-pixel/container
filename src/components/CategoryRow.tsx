import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { CategoryGroup } from "@/types/home";

export const categoryGroups: CategoryGroup[] = [
  {
    label: "Haushalt",
    href: "/haushalt",
    items: [
      { label: "Kaffeemaschinen", href: "/haushalt/kaffeemaschinen", image: "/images/products/coffee-machine.jpg" },
      { label: "Waschmaschinen", href: "/haushalt/waschmaschinen", image: "/images/products/washing-machine.jpg" },
      { label: "Geschirrspüler", href: "/haushalt/geschirrspueler", image: "/images/products/dishwasher.jpg" },
      { label: "Staubsauger", href: "/haushalt/staubsauger", image: "/images/products/vacuum.jpg" },
      { label: "Backöfen & Herde", href: "/haushalt/backoefen-herde", image: "/images/products/oven.jpg" },
      { label: "Klimageräte", href: "/haushalt/klimageraete", image: "/images/products/aircon-unit.png" },
    ],
  },
  {
    label: "Multimedia",
    href: "/multimedia",
    items: [
      { label: "Smartphones", href: "/multimedia/smartphones", image: "/images/products/smartphone.jpg" },
      { label: "Videospiele", href: "/multimedia/videospiele", image: "/images/products/game-controller.jpg" },
      { label: "Fernseher", href: "/multimedia/fernseher", image: "/images/products/tv.jpg" },
      { label: "Computer", href: "/multimedia/computer", image: "/images/products/computer.jpg" },
      { label: "Smartwatches", href: "/multimedia/smartwatches", image: "/images/products/smartwatch.jpg" },
    ],
  },
];

export function CategoryRow() {
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      {categoryGroups.map((group) => (
        <div key={group.label} className="mb-8 last:mb-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">{group.label}</h2>
            <Link href={group.href} className="text-sm font-semibold text-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {group.items.map((item, index) => (
              <Reveal key={item.label} delay={Math.min(index * 60, 300)}>
                <Link href={item.href} className="group flex w-24 flex-col items-center gap-2 sm:w-28 lg:w-32">
                  <span className="relative block aspect-square w-full overflow-hidden rounded-full border border-border transition-shadow duration-300 group-hover:border-primary/40 group-hover:shadow-lg">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      sizes="(min-width: 1024px) 8rem, (min-width: 640px) 7rem, 6rem"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>
                  <span className="text-center text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.label}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
