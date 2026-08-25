/**
 * Jetons de la fiche produit.
 *
 * La fiche empilait des cartes blanches cernées d'un filet d'un pixel, toutes
 * du même poids : rien n'y hiérarchisait le regard, et la page se lisait comme
 * une pile de boîtes plutôt que comme une page dessinée. Trois principes ici.
 *
 * 1. Un rythme de bandes. Clair pour le fil d'ariane, blanc pour l'achat,
 *    dégradé pour les détails, blanc pour les avis, teinté pour les
 *    suggestions. Le regard descend par paliers au lieu de glisser d'un bloc.
 * 2. De la profondeur plutôt que des filets. Des ombres longues et très
 *    diffuses détachent les cartes du fond sans les cerner.
 * 3. Une ancre sombre. Le panneau d'équipement passe en marine : c'est le seul
 *    endroit de la fiche où l'orange vif de la palette a le droit d'être posé
 *    (signal tient 5,6:1 sur marine et tombe à 2,8:1 sur blanc), et il donne à
 *    la page la colonne vertébrale qui lui manquait.
 *
 * L'ombre ne prend que deux profondeurs : celle des pièces maîtresses et celle
 * des cartes secondaires. Une troisième aurait brouillé la lecture des plans.
 */

/** Ombre des pièces maîtresses : galerie, colonne d'achat, panneau marine. */
const OMBRE_HAUTE = "shadow-[0_24px_80px_-48px_rgba(22,43,95,0.45)]";
/** Ombre des cartes secondaires : description, résumé des avis, formulaire. */
const OMBRE_BASSE = "shadow-[0_20px_70px_-52px_rgba(22,43,95,0.42)]";

export const PRODUCT_SHELL_TOKENS = {
  /** Le fil d'ariane ouvre la page sur un dégradé plutôt que sur un filet nu. */
  breadcrumbBand: "border-b border-border bg-gradient-to-b from-muted to-white",
  breadcrumbInner: "mx-auto max-w-screen-xl px-4 py-2.5 sm:px-6",
  heroBand: "bg-white",
  heroInner: "mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:py-9",
  /**
   * La galerie garde l'avantage sur la colonne d'achat, mais moins qu'avant :
   * à 1,25 contre 0,75, la carte d'achat devenait trop étroite pour que le prix
   * et le bouton respirent une fois la carte passée en 3xl.
   */
  heroGrid:
    "grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-9",
  detailBand: "border-t border-border bg-gradient-to-b from-muted via-muted to-white",
  detailInner: "mx-auto max-w-screen-xl px-4 py-9 sm:px-6 lg:py-11",
  reviewBand: "border-t border-border bg-white",
  relatedBand: "border-t border-border bg-muted",
  /** Surtitre de section : la catégorie du produit, déjà traduite, sert de repère. */
  eyebrow: "text-xs font-black uppercase tracking-[0.18em] text-primary",
  sectionTitle: "mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl",
} as const;

export const PRODUCT_HERO_TOKENS = {
  /**
   * La colonne d'achat suit le défilement sur grand écran : la galerie et ses
   * vignettes sont longues, et le prix sortait de l'écran avant que le visiteur
   * n'ait fini de regarder les visuels.
   */
  buyColumn: "flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start",
  /** La marque en pastille, au lieu d'une ligne capitale posée sur le fond. */
  brandPill:
    "inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.16em] text-muted-foreground",
  title: "mt-2 text-3xl font-black leading-[1.1] tracking-tight text-foreground sm:text-4xl",
  metaRow: "mt-3 flex flex-wrap items-center gap-2",
  /** Note et référence en jetons distincts : accolées, elles se lisaient comme une seule phrase. */
  ratingChip:
    "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary",
  skuChip:
    "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground",
  lede: "mt-3 max-w-prose text-[0.95rem] leading-relaxed text-foreground/75",
} as const;

export const PRODUCT_GALLERY_TOKENS = {
  frame: `group relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-white ${OMBRE_HAUTE}`,
  /** Halo posé sous le conteneur : le détache du blanc sans lui ajouter de cadre. */
  halo: "pointer-events-none absolute inset-x-10 bottom-4 h-20 rounded-[50%] bg-secondary/10 blur-2xl",
  image:
    "object-contain p-4 transition-transform duration-500 ease-out motion-safe:group-hover:scale-105",
  rail: "mt-3 flex flex-wrap gap-2.5",
  thumb:
    "relative block h-16 w-20 overflow-hidden rounded-2xl border bg-white transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-18 sm:w-24",
  thumbOn: "border-primary ring-2 ring-primary/25",
  thumbOff: "border-border hover:-translate-y-0.5 hover:border-primary/40",
} as const;

export const PRODUCT_BUY_TOKENS = {
  card: `flex flex-col gap-4 rounded-3xl border border-border bg-white p-5 ${OMBRE_HAUTE}`,
  oldPrice: "text-sm text-muted-foreground",
  price: "text-4xl font-black leading-none tracking-tight text-primary",
  badge:
    "rounded-full bg-badge px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-wide text-badge-foreground",
  vatNote: "mt-2 text-xs leading-relaxed text-muted-foreground",
  energy:
    "flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground",
  energyClass: "rounded-lg bg-primary px-2 py-0.5 text-sm font-bold text-primary-foreground",
  /** La disponibilité devient un état lisible d'un coup d'oeil, pas une ligne de texte. */
  stockOn:
    "inline-flex items-center gap-2 self-start rounded-xl bg-primary/8 px-3 py-2 text-sm font-bold text-primary",
  stockOff:
    "inline-flex items-center gap-2 self-start rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground",
  /**
   * Les garanties débordent la carte pour en occuper tout le pied : elles la
   * ferment au lieu de flotter au-dessus de son bord inférieur.
   */
  trust:
    "-mx-5 -mb-5 mt-0.5 flex flex-col gap-2 rounded-b-3xl border-t border-border bg-muted px-5 py-4 text-xs leading-relaxed text-muted-foreground",
  trustIcon: "mt-0.5 h-4 w-4 shrink-0 text-primary",
} as const;

export const PRODUCT_DETAIL_TOKENS = {
  grid: "mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
  descCard: `rounded-3xl border border-border bg-white p-5 ${OMBRE_BASSE} sm:p-6`,
  label: "text-xs font-black uppercase tracking-[0.16em] text-muted-foreground",
  /** Interligne large : la description est le seul texte long de la fiche. */
  descText: "mt-3 max-w-prose text-[0.95rem] leading-[1.7] text-foreground/80",
  /** Ancre sombre de la fiche. Voir l'en-tête du fichier pour la règle de pose. */
  specCard: `relative overflow-hidden rounded-3xl bg-secondary p-5 text-white ${OMBRE_HAUTE} sm:p-6`,
  specHalo:
    "pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-signal/20 blur-3xl",
  specLabel: "relative text-xs font-black uppercase tracking-[0.16em] text-signal",
  specList: "relative mt-3 divide-y divide-white/10",
  specItem:
    "flex items-start gap-3 py-2.5 text-sm leading-relaxed text-white/85 first:pt-0 last:pb-0",
  specIcon: "mt-0.5 h-4 w-4 shrink-0 text-signal",
} as const;

export const PRODUCT_REVIEW_TOKENS = {
  summary: `mb-5 flex flex-col gap-4 rounded-3xl border border-border bg-white p-5 ${OMBRE_BASSE} sm:flex-row sm:items-center sm:gap-8`,
  average: "text-4xl font-black leading-none tracking-tight text-foreground",
  /**
   * Les étoiles étaient remplies en accent, un gris bleuté très pâle : sur la
   * carte blanche, une note de 5 sur 5 ne se distinguait pas d'une note de 1.
   * L'orange profond de la palette tient 4,7:1 sur blanc et reste dans le ton.
   */
  starOn: "fill-primary text-primary",
  starOff: "fill-transparent text-border",
  bar: "h-2 flex-1 overflow-hidden rounded-full bg-muted",
  barFill: "block h-2 rounded-full bg-primary/70",
  list:
    "max-h-[22rem] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  item: "px-5 py-4",
  empty: `rounded-3xl border border-dashed border-border bg-white p-6 ${OMBRE_BASSE}`,
  form: `group overflow-hidden rounded-3xl border border-border bg-white ${OMBRE_BASSE}`,
} as const;
