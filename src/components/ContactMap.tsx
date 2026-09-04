"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { ouvrirReglagesConsentement, useConsentement } from "@/lib/consent";
import { COMPANY } from "@/content/legal";

const ADRESSE = `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`;

/** Ouvre la fiche du lieu, jamais l'itinéraire : le visiteur choisit lui-même son point de départ. */
const LIEN_MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADRESSE)}`;

/**
 * URL d'intégration classique (sans clé API), à ne pas confondre avec
 * `maps/embed/v1/place`, qui en réclame une et facturerait l'affichage.
 */
const SRC_CARTE = `https://www.google.com/maps?q=${encodeURIComponent(ADRESSE)}&output=embed`;

/**
 * Carte d'accès de la page Contact.
 *
 * L'iframe charge des ressources Google dès l'affichage et transmet l'adresse
 * IP du visiteur, exactement comme le live-chat Smartsupp stocke une
 * identification : elle attend donc le même consentement (src/lib/consent.ts),
 * et le bandeau en parle désormais explicitement plutôt que de ne couvrir que
 * le chat. Sans consentement, un simple lien ouvre Google Maps dans un nouvel
 * onglet, sans établir la moindre connexion à Google depuis notre page.
 */
export function ContactMap() {
  const { consentement } = useConsentement();

  if (consentement !== "accepte") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-border bg-muted px-6 py-16 text-center">
        <MapPin className="h-8 w-8 text-primary" aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">
          Die Anfahrtskarte lädt Kartenmaterial von Google und startet erst mit Ihrer
          Einwilligung.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={ouvrirReglagesConsentement}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
          >
            Einwilligung erteilen
          </button>
          <a
            href={LIEN_MAPS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            In Google Maps öffnen
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

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
