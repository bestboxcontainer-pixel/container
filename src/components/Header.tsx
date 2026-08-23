import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Phone, UserRound } from "lucide-react";
import { COMPANY } from "@/content/legal";
import { HeaderShell } from "@/components/HeaderShell";
import { SearchBar } from "@/components/SearchBar";
import { CartIndicator } from "@/components/cart/CartIndicator";

/**
 * Navigation principale. Elle mêle volontairement les pages marchandes
 * (Sortiment) et les pages de conseil (Maße, Zustandsklassen, Lieferung, FAQ) :
 * dans le négoce de conteneurs, l'acheteur cherche les cotes et les classes
 * d'état avant de chercher un produit, et ces pages sont les portes d'entrée
 * naturelles depuis les moteurs de recherche.
 */
const NAV_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/container-masse", label: "Maße & Typen" },
  { href: "/zustandsklassen", label: "Zustandsklassen" },
  { href: "/lieferung", label: "Lieferung" },
  { href: "/faq", label: "FAQ" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/**
 * En-tête du site, distinct du back-office.
 *
 * Deux rangées : une rangée utilitaire (marque, recherche, téléphone, espace
 * client, panier, appel à l'action) et une rangée de navigation. La recherche,
 * le panier et l'espace client sont les points d'entrée de la boutique ; sans
 * eux, les pages /warenkorb, /kasse et /konto ne sont accessibles qu'en tapant
 * l'URL à la main.
 *
 * `variant="overlay"` fond l'en-tête dans le hero de la page : elle flotte
 * par-dessus au lieu de former une bande séparée. À réserver aux pages dont la
 * première section est sombre ; la hauteur libérée se rattrape avec
 * `pt-[var(--header-height)]` sur cette section. Voir `HeaderShell`.
 */
export function Header({ variant = "solid" }: { variant?: "solid" | "overlay" }) {
  return (
    <HeaderShell overlay={variant === "overlay"}>
      <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:gap-6">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
          <Image
            src="/images/logo-badge.png"
            alt="BBC Best Box Containerhandel e.K."
            width={160}
            height={160}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-tight text-white">
              BBC <span className="text-signal">Best Box</span>
            </span>
            <span className="hidden text-[11px] font-bold tracking-wide text-white sm:inline">
              Containerhandel e.K.
            </span>
          </span>
        </Link>

        <div className="ml-auto hidden w-full max-w-sm md:block lg:ml-8">
          <SearchBar placeholder="Container suchen…" label="Suchen" />
        </div>

        <a
          href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`}
          className="ml-auto hidden items-center gap-2 text-sm font-semibold text-white/85 hover:text-white lg:flex lg:ml-0"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {COMPANY.phone}
        </a>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <Link
            href="/konto"
            aria-label="Kundenkonto"
            className="text-white/85 transition-colors hover:text-signal"
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>

          <CartIndicator className="relative flex items-center text-white/85 transition-colors hover:text-signal" />

          <Link
            href="/kontakt"
            className="hidden rounded-full bg-signal px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90 sm:inline-block"
          >
            Anfrage stellen
          </Link>
        </div>
      </div>

      {/* Rangée de navigation, visible à toutes les tailles : elle défile
          horizontalement sur mobile plutôt que de disparaître derrière un menu,
          car ces pages sont les plus demandées. */}
      <nav className="border-t border-white/10 group-data-[merged=true]:border-transparent">
        <div className="mx-auto flex max-w-screen-xl items-center gap-5 overflow-x-auto px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap sm:px-6 lg:gap-7 lg:uppercase lg:tracking-wide">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </HeaderShell>
  );
}
