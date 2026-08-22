"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export interface PhotoSlide {
  src: string;
  alt: string;
}

/**
 * Fond de hero en rotation automatique (fondu enchaîné) à partir de vraies
 * photographies (pas de vidéo disponible pour ce projet). Respecte
 * prefers-reduced-motion en coupant la rotation automatique.
 */
export function PhotoHeroCarousel({ slides }: { slides: readonly PhotoSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
          style={{ opacity: index === active ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <span
            key={slide.src}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === active ? "w-6 bg-primary" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
