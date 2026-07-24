import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { PromoBanner } from "@/types/home";

const bigBanner: PromoBanner = {
  title: "Klimageräte Sale",
  subtitle: "Bis zu 30% sparen",
  href: "/haushalt/klimageraete",
  image: "/images/products/aircon-wall.png",
  alt: "Klimagerät an einer Wand",
};

const smallBanners: PromoBanner[] = [
  {
    title: "Geschirrspüler Aktion",
    href: "/haushalt/geschirrspueler",
    image: "/images/products/dishwasher.jpg",
    alt: "Geschirrspüler in der Küche",
  },
  {
    title: "Smartwatch Deals",
    href: "/multimedia/smartwatches",
    image: "/images/products/smartwatch.jpg",
    alt: "Smartwatch am Handgelenk",
  },
  {
    title: "Waschmaschinen Aktion",
    href: "/haushalt/waschmaschinen",
    image: "/images/products/washing-machine.jpg",
    alt: "Waschmaschine",
  },
  {
    title: "TV Highlights",
    href: "/multimedia/fernseher",
    image: "/images/products/tv.jpg",
    alt: "Fernseher im Wohnzimmer",
  },
];

export function PromoGrid() {
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <h2 className="mb-4 text-xl font-black text-foreground">Topaktuell</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Reveal className="col-span-1 lg:col-span-2">
          <Link
            href={bigBanner.href}
            className="group relative block h-64 overflow-hidden rounded-sm shadow-sm transition-shadow duration-300 hover:shadow-xl lg:h-full"
          >
            <Image
              src={bigBanner.image}
              alt={bigBanner.alt}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <p className="text-2xl font-black">{bigBanner.title}</p>
              <p className="text-sm text-white/80">{bigBanner.subtitle}</p>
            </div>
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          {smallBanners.map((banner, index) => (
            <Reveal key={banner.title} delay={Math.min((index + 1) * 80, 320)}>
              <Link
                href={banner.href}
                className="group relative block h-32 overflow-hidden rounded-sm shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  sizes="20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                <p className="absolute right-2 bottom-1.5 left-2 text-xs font-bold text-white">{banner.title}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
