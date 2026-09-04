import { ExternalLink } from "lucide-react";
import { COMPANY } from "@/content/legal";

const ADRESSE = `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`;

/** Ouvre la fiche du lieu, jamais l'itinéraire : le visiteur choisit lui-même son point de départ. */
const LIEN_MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADRESSE)}`;

/**
 * URL d'intégration classique (sans clé API), à ne pas confondre avec
 * `maps/embed/v1/place`, qui en réclame une et facturerait l'affichage.
 */
const SRC_CARTE = `https://www.google.com/maps?q=${encodeURIComponent(ADRESSE)}&output=embed`;

/** Carte d'accès de la page Contact. */
export function ContactMap() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-border">
      <a
        href={LIEN_MAPS}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-sm bg-white px-3 py-2 text-sm font-bold text-foreground shadow-md hover:text-primary"
      >
        In Maps öffnen
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
      <iframe
        title={`Anfahrt zu ${COMPANY.name}`}
        src={SRC_CARTE}
        className="h-[420px] w-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
