"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Enveloppe cliente de l'en-tête : elle ne porte que l'état de défilement, le
 * contenu (marque, navigation, téléphone) reste rendu côté serveur.
 *
 * Deux poses :
 *
 * - `overlay` : l'en-tête est fondue dans le hero. Elle flotte par-dessus, sans
 *   fond ni filet, pour que la photo (ou l'aplat marine) monte jusqu'au bord
 *   haut de l'écran ; un léger dégradé marine sert de voile de lisibilité. Dès
 *   que la page défile, elle reprend un fond marine opaque, sinon les liens
 *   blancs passeraient sur les sections claires qui suivent.
 * - sinon : barre marine classique, pour les pages sans hero sombre (mentions
 *   légales, espace client).
 */
export function HeaderShell({
  overlay,
  children,
}: {
  overlay: boolean;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); // rétablit l'état après un rechargement en cours de page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const merged = overlay && !scrolled;

  return (
    <header
      data-merged={merged}
      className={cn(
        "group z-50 w-full text-secondary-foreground transition-colors duration-300",
        overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
        merged
          ? "bg-gradient-to-b from-header/75 via-header/30 to-transparent"
          : "border-b border-white/10 bg-header/95 backdrop-blur supports-[backdrop-filter]:bg-header/90",
      )}
    >
      {children}
    </header>
  );
}
