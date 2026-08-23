import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Phone, UserRound } from "lucide-react";
import { COMPANY } from "@/content/legal";
import { HeaderShell } from "@/components/HeaderShell";
import { CartIndicator } from "@/components/cart/CartIndicator";

/**
 * Navigation principale, réduite à cinq entrées pour tenir sur une seule ligne
 * à côté de la marque et des actions.
 *
 * Les pages de conseil écartées d'ici (Zustandsklassen, Lieferung, FAQ) restent
 * atteignables depuis le pied de page : elles captent la recherche organique et
 * l'internaute y arrive le plus souvent par un moteur, pas par le menu.
 */
const NAV_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/container-masse", label: "Maße & Typen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/**
 * En-tête du site, distinct du back-office. Une seule bande.
 *
 * La navigation partage la ligne de la marque et défile horizontalement quand
 * la place manque, plutôt que de se replier derrière un menu : un menu fermé
 * enterre les pages les plus demandées, et un second rang de liens alourdit
 * l'en-tête sur toutes les pages pour ne servir que sur mobile.
 *
 * Le panier ne quitte pas l'en-tête, sans quoi /warenkorb et /kasse
 * redeviennent inatteignables autrement qu'en tapant l'URL.
 *
 * Pas de champ de recherche : le catalogue tient en six catégories, la
 * navigation y mène plus vite qu'une saisie. La page /suche reste servie et
 * accessible depuis le pied de page.
 *
 * `variant="overlay"` fond l'en-tête dans le hero de la page : elle flotte
 * par-dessus au lieu de former une bande séparée. À réserver aux pages dont la
 * première section est sombre ; la hauteur libérée se rattrape avec
 * `pt-[var(--header-height)]` sur cette section. Voir `HeaderShell`.
 */
export function Header({ variant = "solid" }: { variant?: "solid" | "overlay" }) {
  const telephone = COMPANY.phone.replace(/\s+/g, "");

  return (
    <HeaderShell overlay={variant === "overlay"}>
      <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
          <Image
            src="/images/logo-badge.png"
            alt="BBC Best Box Containerhandel e.K."
            width={160}
            height={160}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-tight text-white sm:text-base">
              BBC <span className="text-signal">Best Box</span>
            </span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 sm:inline">
              Containerhandel e.K.
            </span>
          </span>
        </Link>

        {/* Défile horizontalement quand la place manque, sans replier le menu. */}
        <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto text-[13px] font-semibold whitespace-nowrap lg:gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b-2 border-transparent py-1 text-white/75 transition-colors hover:border-signal hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <a
            href={`tel:${telephone}`}
            aria-label={`Anrufen: ${COMPANY.phone}`}
            className="hidden items-center gap-2 text-sm font-semibold text-white/85 transition-colors hover:text-signal xl:flex"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {COMPANY.phone}
          </a>

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
            className="hidden rounded-full bg-signal px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90 md:inline-block"
          >
            Anfrage stellen
          </Link>
        </div>
      </div>
    </HeaderShell>
  );
}
