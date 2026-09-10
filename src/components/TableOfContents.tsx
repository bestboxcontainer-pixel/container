/**
 * Sommaire d'une page longue : une liste d'ancres vers les titres de section.
 *
 * L'appelant pose les mêmes `id` sur ses `h2`/`h3` (via `slugify`) et passe
 * ici la liste correspondante. Rendu seulement à partir de trois entrées :
 * en dessous, un sommaire coûte plus d'espace qu'il n'aide.
 *
 * `scroll-padding-top` est déjà réglé globalement sur `--header-height`
 * (globals.css), les ancres tombent donc sous l'en-tête fixe sans marge ici.
 */

export interface TocItem {
  id: string;
  label: string;
}

export function TableOfContents({
  items,
  label,
  title = "Auf dieser Seite",
}: {
  items: readonly TocItem[];
  /** Intitulé de la nav pour les lecteurs d'écran, ex. « Inhaltsverzeichnis ». */
  label: string;
  title?: string;
}) {
  if (items.length < 3) return null;

  return (
    <nav
      aria-label={label}
      className="mb-8 rounded-sm border border-border bg-muted p-4"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">{title}</p>
      <ol className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-sm text-primary hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
