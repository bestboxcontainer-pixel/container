/**
 * Jetons de la page catégorie et de sa barre de filtres.
 *
 * Les filtres tenaient une colonne de 16 rem à gauche : le quart de la largeur
 * pour une poignée de cases à cocher, et une grille bornée à trois fiches par
 * rangée. Ils sont passés sur une ligne au-dessus des fiches, en menus
 * déroulants, et la grille occupe désormais toute la largeur, à quatre.
 *
 * Les filtres actifs restent rappelés sous la barre, faute de quoi rien
 * n'indique pourquoi le nombre de fiches a changé.
 */

export const CATEGORY_BAR_TOKENS = {
  /**
   * La barre elle-même. `flex-wrap` plutôt qu'un défilement latéral : sur
   * mobile un rang de boutons qui se glisse horizontalement n'annonce jamais
   * ce qu'il cache, alors qu'un retour à la ligne se voit.
   */
  bar: "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-4",
  group: "flex flex-wrap items-center gap-2",
  /** Bouton d'ouverture d'un menu, au repos puis quand il filtre. */
  trigger:
    "inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted",
  triggerActive:
    "inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary/8 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15",
  triggerCount:
    "rounded-full bg-primary px-1.5 text-[0.7rem] font-bold tabular-nums text-primary-foreground",
  /**
   * Panneau du menu. `z-30` le pose au-dessus des fiches sans atteindre le
   * `z-50` de l'en-tête, qui doit rester devant au défilement.
   */
  menu:
    "absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-80 w-64 overflow-y-auto rounded-2xl border border-border bg-white p-2 shadow-[0_24px_60px_-30px_rgba(18,40,86,0.45)]",
  option:
    "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted",
  /** Bascule à un seul état, sans menu : la disponibilité se coche d'un clic. */
  toggle:
    "inline-flex items-center rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted",
  toggleActive:
    "inline-flex items-center rounded-xl border border-primary bg-primary/8 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15",
  /**
   * Repère dessiné : la coche est toujours présente mais blanche, donc
   * invisible sur le fond blanc et lisible dès que la case passe en primary.
   */
  box:
    "flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-[0.35rem] border border-input bg-white text-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
  dot:
    "flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full border border-input bg-white text-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
  count:
    "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums text-muted-foreground",
} as const;

export const CATEGORY_GRID_TOKENS = {
  /** Décompte à gauche, tri à droite, sur la même ligne que les filtres. */
  toolbarCount: "text-sm text-muted-foreground",
  /** Rappel des filtres actifs : chaque jeton se retire d'un clic. */
  chipRow: "mt-3 flex flex-wrap items-center gap-2",
  chip:
    "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/15",
  chipClear: "text-xs font-bold text-muted-foreground underline-offset-2 hover:underline",
  select:
    "rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground",
  /**
   * Quatre colonnes au-delà de xl. La borne à trois datait de la colonne de
   * filtres, qui mangeait 16 rem à gauche : sur la largeur entière, une
   * quatrième fiche tient sans se tasser.
   */
  grid: "mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  empty:
    "mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center",
} as const;
