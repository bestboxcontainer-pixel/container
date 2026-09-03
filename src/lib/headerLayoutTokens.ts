/**
 * Jetons de l'en-tête et de son repli mobile.
 *
 * L'en-tête tenait sur une rangée unique à toutes les tailles : la marque, cinq
 * liens et quatre actions. Sous 1024 px, la navigation se retrouvait dans une
 * bande de quelques centaines de pixels et ne s'atteignait plus qu'en la
 * faisant défiler à l'horizontale, geste que rien n'annonce et que la plupart
 * des visiteurs ne tentent pas. Les liens étaient donc présents sans être
 * praticables.
 *
 * La navigation se replie maintenant derrière un bouton sous `lg`, et reste en
 * ligne au-dessus. Le repli ne coûte rien aux grands écrans, qui n'ont jamais
 * de bouton, et rend les cinq pages réellement atteignables au doigt.
 *
 * Le panier et le compte ne rentrent pas dans le repli : ils restent dans la
 * barre à toutes les tailles, sans quoi /warenkorb et /kasse redeviennent
 * inatteignables autrement qu'en tapant l'URL.
 *
 * Le panneau porte son propre fond marine opaque. L'en-tête en surimpression
 * (`variant="overlay"`) est transparent tant que la page n'a pas défilé : sans
 * fond à lui, le menu déplié se serait posé sur la photo du hero.
 */

export const HEADER_LAYOUT_TOKENS = {
  /** Rangée unique de la barre, resserrée sur petit écran. */
  row: "mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:gap-8",
  brand: "flex shrink-0 items-center gap-2.5 whitespace-nowrap",
  /** Navigation en ligne : réservée aux écrans qui ont la place de la porter. */
  deskNav:
    "hidden min-w-0 flex-1 items-center gap-5 text-[13px] font-semibold whitespace-nowrap lg:flex lg:gap-7",
  deskLink:
    "border-b-2 border-transparent py-1 text-white/75 transition-colors hover:border-signal hover:text-white",
  /** Sous `lg`, la navigation quitte la rangée : ce vide pousse les actions à droite. */
  spacer: "flex-1 lg:hidden",
  actions: "flex shrink-0 items-center gap-3 sm:gap-4",
} as const;

export const HEADER_MENU_TOKENS = {
  /**
   * Cible de 40 px de côté : en dessous, le bouton devient difficile à viser au
   * pouce, et c'est le seul accès à la navigation sur mobile.
   */
  toggle:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal lg:hidden",
  /** Fond opaque à lui : l'en-tête en surimpression n'en a pas avant défilement. */
  panel:
    "absolute inset-x-0 top-full z-50 border-t border-white/10 bg-secondary shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] lg:hidden",
  panelInner: "mx-auto flex max-w-screen-xl flex-col gap-1 px-4 py-4 sm:px-6",
  /** Ligne pleine largeur plutôt que lien serré : la cible fait toute la rangée. */
  panelLink:
    "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-[15px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
  panelChevron: "h-4 w-4 shrink-0 text-white/30",
  panelFoot: "mt-3 flex flex-col gap-2 border-t border-white/10 pt-4",
  /** Le téléphone n'apparaît dans la barre qu'à partir de `xl` : le repli le rend. */
  panelPhone:
    "flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10",
  panelCta:
    "flex items-center justify-center rounded-xl bg-signal px-4 py-3 text-sm font-black uppercase tracking-wide text-signal-foreground transition-colors hover:bg-signal/90",
} as const;
