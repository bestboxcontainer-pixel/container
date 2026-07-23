import Image from "next/image";
import Link from "next/link";
import type { PromoBanner } from "@/types/home";

const bigBanner: PromoBanner = {
  title: "Klimageräte Sale",
  subtitle: "Bis zu 30% sparen",
  href: "/klimageraete",
  image: "/images/products/aircon.jpg",
  alt: "Klimagerät an einer Wand",
};

const smallBanners: PromoBanner[] = [
  {
    title: "Kleingeräte ab 19,99 €",
    href: "/kleingeraete",
    image: "/images/products/blender.jpg",
    alt: "Standmixer in der Küche",
  },
  {
    title: "Smart Home Deals",
    href: "/smart-home",
    image: "/images/products/smart-speaker.jpg",
    alt: "Smart Speaker",
  },
  {
    title: "Waschen & Trocknen Aktion",
    href: "/waschen-trocknen",
    image: "/images/products/washing-machine.jpg",
    alt: "Waschmaschine",
  },
  {
    title: "TV Highlights",
    href: "/tv-audio",
    image: "/images/products/tv.jpg",
    alt: "Fernseher im Wohnzimmer",
  },
];

export function PromoGrid() {
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <h2 className="mb-4 text-xl font-black text-foreground">Topaktuell</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Link
          href={bigBanner.href}
          className="group relative col-span-1 h-64 overflow-hidden rounded-sm lg:col-span-2 lg:h-auto"
        >
          <Image
            src={bigBanner.image}
            alt={bigBanner.alt}
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 text-white">
            <p className="text-2xl font-black">{bigBanner.title}</p>
            <p className="text-sm text-white/80">{bigBanner.subtitle}</p>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          {smallBanners.map((banner) => (
            <Link key={banner.title} href={banner.href} className="group relative h-32 overflow-hidden rounded-sm">
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                sizes="20vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
              <p className="absolute right-2 bottom-1.5 left-2 text-xs font-bold text-white">{banner.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
