import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Phone, UserRound } from "lucide-react";
import { COMPANY } from "@/content/legal";
import { HeaderShell } from "@/components/HeaderShell";
import { HeaderNav, type HeaderNavLink } from "@/components/HeaderNav";
import { CartIndicator } from "@/components/cart/CartIndicator";
import { HEADER_LAYOUT_TOKENS } from "@/lib/headerLayoutTokens";

/**
 * Navigation principale, réduite à quatre entrées pour tenir sur une seule
 * ligne à côté de la marque et des actions.
 *
 * Les pages de conseil écartées d'ici (Zustandsklassen, Lieferung, FAQ) restent
 * atteignables depuis le pied de page : elles captent la recherche organique et
 * l'internaute y arrive le plus souvent par un moteur, pas par le menu.
 */
const NAV_LINKS: readonly HeaderNavLink[] = [
  { href: "/container", label: "Sortiment" },
  { href: "/container-masse", label: "Maße & Typen" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const CTA_LABEL = "Anfrage stellen";
const CTA_HREF = "/kontakt";

/**
 * En-tête du site, distinct du back-office. Une seule bande.
 *
 * La navigation reste en ligne à partir de `lg` et se replie derrière un bouton
 * en dessous. Elle défilait auparavant à l'horizontale plutôt que de se
 * replier, pour ne pas enterrer les pages les plus demandées derrière un menu
 * fermé ; le résultat était pire sur mobile : cinq liens comprimés dans la
 * largeur restante, atteignables par un glissement latéral que rien n'annonce.
 * Un bouton visible vaut mieux qu'un geste invisible. Voir `HeaderNav`.
 *
 * Le panier et le compte ne rentrent pas dans le repli et gardent leur place
 * dans la barre, sans quoi /warenkorb et /kasse redeviennent inatteignables
 * autrement qu'en tapant l'URL.
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
      <div className={HEADER_LAYOUT_TOKENS.row}>
        <Link href="/" className={HEADER_LAYOUT_TOKENS.brand}>
          <Image
            src="/images/logo-badge.png"
            alt="BBC Best Box Containerhandel e.K."
            width={160}
            height={160}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight text-white sm:text-lg">
              BBC <span className="text-signal">Best Box</span>
            </span>
            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.16em] text-white/50 sm:inline">
              Containerhandel e.K.
            </span>
          </span>
        </Link>

        {/* Les actions passent en `children` : elles restent rendues côté
            serveur, et le bouton de menu se place après elles dans la rangée. */}
        <HeaderNav links={NAV_LINKS} phone={COMPANY.phone} ctaLabel={CTA_LABEL} ctaHref={CTA_HREF}>
          <div className={HEADER_LAYOUT_TOKENS.actions}>
            <a
              href={`tel:${telephone}`}
              aria-label={`Anrufen: ${COMPANY.phone}`}
              className="hidden items-center gap-2 text-[15px] font-semibold text-white/85 transition-colors hover:text-signal xl:flex"
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

            {/* Le bouton de demande ne réapparaît qu'avec la navigation en
                ligne : en dessous, il vit dans le pied du panneau, où il a la
                largeur de la carte au lieu d'un timbre coincé près du menu. */}
            <Link
              href={CTA_HREF}
              className="hidden rounded-full bg-signal px-5 py-2.5 text-[15px] font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90 lg:inline-block"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </HeaderNav>
      </div>
    </HeaderShell>
  );
}
