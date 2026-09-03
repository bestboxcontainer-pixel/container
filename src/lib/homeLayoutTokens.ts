/**
 * Jetons de la section « Größen » de la page d'accueil.
 *
 * Parti pris : un bandeau sombre (navy) qui tranche avec le reste de la page
 * claire, et surtout aucune carte encadrée. Les containers sont blancs sur fond
 * transparent : posés directement sur le navy, avec une ligne de sol sous eux,
 * ce sont eux qu'on regarde. Enfermés dans des cartes bordées, ils passaient au
 * second plan derrière leur propre encadrement.
 */

/** Terracotta éclairci : le --primary (#a8490e) manque de contraste sur navy. */
export const HOME_SIZE_ACCENT = "#e8813a";

export const HOME_SIZE_SECTION_TOKENS = {
  section: "relative isolate overflow-hidden bg-secondary text-white",
  /** Halo terracotta diffus, seule décoration de fond : aucune trame ni damier. */
  glow: "pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-[#e8813a]/20 blur-[140px]",
  /** Second halo froid en bas à gauche, évite un aplat de navy trop plat. */
  glowSoft:
    "pointer-events-none absolute -bottom-56 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#2b6fa8]/25 blur-[150px]",
  container: "relative mx-auto max-w-screen-xl px-4 py-14 sm:px-6 lg:py-16",
  /** Titre à gauche, compteurs à droite : une seule ligne au lieu de deux blocs. */
  header: "flex flex-wrap items-end justify-between gap-x-10 gap-y-6",
  eyebrow: "text-xs font-black uppercase tracking-[0.28em] text-[#e8813a]",
  counterRow: "flex shrink-0 items-center gap-6 sm:gap-8",
  counterValue: "text-2xl font-black leading-none tabular-nums text-white",
  counterLabel: "mt-1.5 block text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45",
  /** En-tête de groupe : filet horizontal qui occupe la largeur restante. */
  groupHead: "flex items-baseline justify-between gap-4 border-b border-white/12 pb-3",
  groupTitle: "text-sm font-black uppercase tracking-[0.24em] text-white",
  groupRange: "text-sm font-semibold text-white/50",
  /**
   * Chaque groupe dans son propre panneau. Posés à même le fond, Breiten et
   * Höhen côte à côte se lisaient comme une seule rangée de cinq visuels : rien
   * ne disait où finissait un groupe et où commençait l'autre.
   */
  groupPanel: "rounded-3xl bg-white/[0.035] p-5 ring-1 ring-inset ring-white/[0.07] sm:p-6",
  groupStack: "mt-10 space-y-6",
} as const;

export const HOME_SIZE_CARD_TOKENS = {
  /**
   * Aplat doux et coins arrondis, sans filet : chaque dimension se détache de
   * sa voisine sans revenir aux cartes bordées, qui reprenaient le pas sur le
   * container qu'elles encadraient.
   */
  item:
    "group flex flex-col rounded-2xl bg-white/[0.07] p-4 transition-colors duration-300 hover:bg-white/[0.12] sm:p-5",
  /**
   * Bandeau de badge de hauteur fixe, présent sur tous les éléments même vide :
   * il réserve la place du « Top-Maß » sans que celui-ci chevauche le visuel,
   * et garde les containers alignés d'une colonne à l'autre.
   */
  head: "mb-1 flex h-4 items-center justify-end",
  /**
   * Ratio des visuels une fois recadrés sur leur boîte utile (535×250) : plus
   * aucune marge transparente, le container remplit toute la zone.
   */
  media: "flex aspect-[107/50] items-end justify-center",
  image:
    "h-auto w-full object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-1",
  /** Halo posé sous le container mis en avant, à la place d'une carte colorée. */
  featuredGlow:
    "pointer-events-none absolute inset-x-1 bottom-0 h-14 rounded-[50%] bg-[#e8813a]/30 blur-2xl",
  /** Ligne de sol : c'est elle qui pose le container, pas un cadre. */
  floor: "h-px w-full bg-gradient-to-r from-transparent via-white/45 to-transparent",
  floorFeatured: "h-px w-full bg-gradient-to-r from-transparent via-[#e8813a] to-transparent",
  /** Le lien occupe tout le bloc : la cible de clic est la vignette entiere. */
  link:
    "flex h-full flex-col rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8813a]",
  footer: "mt-2.5 flex items-baseline justify-between gap-2",
  label: "text-base font-black tracking-[-0.02em] text-white",
  labelFeatured: "text-base font-black tracking-[-0.02em] text-[#e8813a]",
  detail: "text-[0.7rem] font-semibold tabular-nums text-white/45",
  badge:
    "inline-flex rounded-full bg-[#e8813a] px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-white",
} as const;
