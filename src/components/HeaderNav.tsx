"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Menu, Phone, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { HEADER_LAYOUT_TOKENS, HEADER_MENU_TOKENS } from "@/lib/headerLayoutTokens";

export interface HeaderNavLink {
  href: string;
  label: string;
}

/** Cible du `aria-controls` du bouton : le panneau doit être nommable. */
const MENU_ID = "header-menu";

/** Seuil de repli, en phase avec le `lg:` des jetons de l'en-tête. */
const LARGEUR_NAV_EN_LIGNE = "(min-width: 1024px)";

/**
 * Navigation de l'en-tête, en ligne sur grand écran et repliée derrière un
 * bouton en dessous de `lg`.
 *
 * Les actions (téléphone, compte, panier, bouton de demande) arrivent par
 * `children` : elles restent rendues côté serveur, seul l'état d'ouverture vit
 * ici. C'est aussi ce qui permet de placer le bouton après elles dans la
 * rangée, donc tout à droite, sans découper l'en-tête en deux composants qui
 * devraient se partager l'état.
 */
export function HeaderNav({
  links,
  phone,
  ctaLabel,
  ctaHref,
  children,
}: {
  links: readonly HeaderNavLink[];
  phone: string;
  ctaLabel: string;
  ctaHref: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Une navigation cliente laisse le composant monté : sans cela, le panneau
  // resterait ouvert après un retour en arrière du navigateur.
  //
  // L'ajustement se fait pendant le rendu et non dans un effet : React reprend
  // aussitôt le rendu avec la nouvelle valeur, sans passer par une passe
  // supplémentaire où le panneau serait encore affiché ouvert.
  const [cheminSuivi, setCheminSuivi] = useState(pathname);
  if (cheminSuivi !== pathname) {
    setCheminSuivi(pathname);
    setOpen(false);
  }

  // Passé le seuil, le panneau est masqué par `lg:hidden` mais son état
  // survivrait : au retour en dessous, le menu se rouvrirait tout seul.
  useEffect(() => {
    const mq = window.matchMedia(LARGEUR_NAV_EN_LIGNE);
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const cible = event.target as Node;
      if (panelRef.current?.contains(cible) || toggleRef.current?.contains(cible)) return;
      setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Le focus repart sur le bouton : sans cela, il resterait sur un élément
      // que la fermeture vient de retirer de l'écran.
      toggleRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <nav className={HEADER_LAYOUT_TOKENS.deskNav}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={HEADER_LAYOUT_TOKENS.deskLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={HEADER_LAYOUT_TOKENS.spacer} />

      {children}

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? t("menuClose") : t("menuOpen")}
        onClick={() => setOpen((courant) => !courant)}
        className={HEADER_MENU_TOKENS.toggle}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <div ref={panelRef} id={MENU_ID} className={HEADER_MENU_TOKENS.panel}>
          <div className={HEADER_MENU_TOKENS.panelInner}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={HEADER_MENU_TOKENS.panelLink}
              >
                {link.label}
                <ChevronRight className={HEADER_MENU_TOKENS.panelChevron} aria-hidden />
              </Link>
            ))}

            <div className={HEADER_MENU_TOKENS.panelFoot}>
              {/* Le numéro ne paraît dans la barre qu'à partir de `xl` : sur les
                  tailles qui replient la navigation, il n'existait nulle part. */}
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                aria-label={`Anrufen: ${phone}`}
                className={HEADER_MENU_TOKENS.panelPhone}
              >
                <Phone className="h-4 w-4" aria-hidden />
                {phone}
              </a>

              <Link
                href={ctaHref}
                onClick={() => setOpen(false)}
                className={HEADER_MENU_TOKENS.panelCta}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
