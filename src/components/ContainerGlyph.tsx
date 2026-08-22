/**
 * Pictogramme original (dessiné pour ce projet) évoquant un container empilé :
 * un simple rectangle à coins arrondis avec cannelures verticales et une porte.
 * Utilisé comme mini-logo tant qu'aucune identité visuelle réelle n'existe.
 */
export function ContainerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6.5 6v12M10 6v12M14 6v12M17.5 6v12"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeOpacity="0.55"
      />
      <rect x="18.3" y="8.4" width="2.4" height="7.2" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
