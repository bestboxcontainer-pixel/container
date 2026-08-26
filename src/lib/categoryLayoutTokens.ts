/**
 * Jetons de la page catégorie et de sa colonne de filtres.
 *
 * La colonne reste à gauche, mais dans un vrai panneau : sections repliables,
 * cases à cocher dessinées plutôt que natives, compteurs en pastille. Les
 * filtres actifs sont rappelés au-dessus de la grille, faute de quoi rien
 * n'indique pourquoi le nombre de fiches a changé.
 */

export const CATEGORY_FILTER_TOKENS = {
  /**
   * Colonne de filtres.
   *
   * Le `z-50` du tiroir mobile ne doit pas survivre au-delà de `lg` : l'en-tête
   * est lui aussi en `z-50` et vient avant dans le balisage, la colonne lui
   * passait donc dessus au défilement, ainsi que sur le reste de la page. En
   * colonne, elle redescend en `z-0`.
   *
   * Le décalage haut suit `--header-height` plutôt qu'une valeur figée : la
   * barre mesure 6,75 rem en deux rangées et 4,5 rem au-delà de md, et un
   * `top-20` en dur ne correspondait ni à l'une ni à l'autre.
   */
  sidebarBase:
    "shrink-0 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:z-0 lg:block lg:max-h-[calc(100vh-var(--header-height)-2rem)] lg:w-64 lg:translate-x-0 lg:self-start lg:overflow-y-auto lg:bg-transparent lg:p-0 lg:shadow-none lg:transition-none",
  sidebarOpen:
    "fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs translate-x-0 overflow-y-auto bg-white p-4 shadow-xl transition-transform",
  /** Fermé, le tiroir sort de l'écran ; `lg:sticky` de la base reprend au-delà. */
  sidebarClosed:
    "fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs -translate-x-full overflow-y-auto bg-white p-4 transition-transform lg:w-64",
  /** Panneau visible, au lieu d'une liste de cases posées sur le fond. */
  panel:
    "rounded-2xl border border-border bg-white p-4 shadow-[0_20px_50px_-40px_rgba(18,40,86,0.35)]",
  panelHead: "flex items-center justify-between gap-2 border-b border-border pb-3",
  panelTitle: "flex items-center gap-2 text-sm font-black text-foreground",
  /** Section repliable : les marques d'un gros catalogue tiennent au chaud. */
  group: "border-b border-border py-3 last:border-b-0 last:pb-0",
  groupSummary:
    "flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground marker:content-['']",
  groupChevron: "h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180",
  option:
    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted",
  /**
   * Repère dessiné : la coche est toujours présente mais blanche, donc
   * invisible sur le fond blanc et lisible dès que la case passe en primary.
   * Évite une règle d'opacité qui dépendrait de la position dans le balisage.
   */
  box:
    "flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-[0.35rem] border border-input bg-white text-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
  dot:
    "flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full border border-input bg-white text-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
  count:
    "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums text-muted-foreground",
  reset:
    "mt-4 w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted",
} as const;

export const CATEGORY_GRID_TOKENS = {
  toolbar: "flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3",
  /** Rappel des filtres actifs : chaque jeton se retire d'un clic. */
  chipRow: "mt-3 flex flex-wrap items-center gap-2",
  chip:
    "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/15",
  chipClear: "text-xs font-bold text-muted-foreground underline-offset-2 hover:underline",
  select:
    "rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground",
  /**
   * Trois colonnes au maximum : à quatre, un catalogue de six fiches laissait
   * une seconde rangée à moitié vide.
   */
  grid: "mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3",
  empty:
    "mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center",
} as const;
