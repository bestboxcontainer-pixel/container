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
 *
 * La première photo reste peinte en dessous à opacité pleine en permanence :
 * seules les suivantes se superposent en fondu par-dessus. Un fondu croisé
 * « classique », où les deux opacités animent indépendamment de 1 vers 0 et de
 * 0 vers 1, laisse un instant où les deux tombent sous 100 % à la fois : un
 * décalage de peinture d'une seule frame (fréquent sur un fondu de 1,6 s avec
 * deux images 1920px superposées) suffit alors à laisser voir le fond marine
 * nu derrière. Avec une base toujours opaque, cet instant ne peut plus exister :
 * il y a toujours au moins une photo à 100 % d'opacité sous les autres.
 */
export function PhotoHeroCarousel({ slides }: { slides: readonly PhotoSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (slides.length < 2) return;

    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          sizes="100vw"
          className={`absolute inset-0 object-cover transition-opacity duration-[1600ms] ease-in-out ${
            index === 0 || index === active ? "opacity-100" : "opacity-0"
          }`}
          style={{ zIndex: index === 0 ? 0 : 1 }}
        />
      ))}

      {slides.length > 1 && (
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
      )}
    </div>
  );
}
