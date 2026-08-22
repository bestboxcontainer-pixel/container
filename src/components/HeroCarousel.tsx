"use client";

import { useEffect, useState } from "react";
import { ContainerGlyph } from "@/components/ContainerGlyph";

export interface HeroSlide {
  label: string;
  from: string;
  to: string;
}

/**
 * Fond de hero en rotation automatique (fondu enchaîné), à défaut d'une vraie
 * vidéo/photo de containers : aucune image/vidéo réelle n'est disponible pour
 * ce projet, donc chaque « diapositive » est un dégradé + pictogramme stylisé.
 * Facile à remplacer plus tard par de vraies photos (ex. via Cloudinary/admin).
 * Respecte prefers-reduced-motion en coupant la rotation automatique.
 */
export function HeroCarousel({ slides }: { slides: readonly HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {slides.map((slide, index) => (
        <div
          key={slide.label}
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-[1400ms] ease-in-out"
          style={{
            opacity: index === active ? 1 : 0,
            background: `linear-gradient(135deg, ${slide.from} 0%, ${slide.to} 100%)`,
          }}
        >
          <ContainerGlyph className="h-[46vh] w-[46vh] max-h-[420px] max-w-[420px] text-white/10" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <span
            key={slide.label}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === active ? "w-6 bg-primary" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
