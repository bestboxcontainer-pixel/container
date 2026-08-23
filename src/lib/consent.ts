"use client";

import { useSyncExternalStore } from "react";

/**
 * Consentement du visiteur aux services qui déposent quelque chose sur son
 * appareil sans être nécessaires au fonctionnement de la boutique.
 *
 * UN SEUL SERVICE EST CONCERNÉ AUJOURD'HUI : le chat Smartsupp, qui pose une
 * identification de visiteur dès qu'il se charge. Le panier, la session, la
 * langue et la sécurité restent hors de ce mécanisme, ils relèvent du § 25
 * Abs. 2 Nr. 2 TDDDG et ne se demandent pas.
 *
 * Le jour où un fragment posé depuis le back-office chargera une mesure
 * d'audience ou un pixel publicitaire, il devra passer par ici lui aussi : le
 * bandeau ne parle que de ce qu'il couvre réellement, et un bandeau qui ment
 * est pire que pas de bandeau.
 *
 * Le choix vit dans le navigateur, comme le panier et la liste de souhaits :
 * c'est la donnée du visiteur, elle n'a pas à faire un aller-retour serveur.
 * L'enregistrer est lui-même exempté de consentement, sans mémoire du refus,
 * il faudrait redemander à chaque page.
 */

export const CLE_CONSENTEMENT = "hgp.consent.v1";

/** « inconnu » : le visiteur n'a pas encore répondu, le bandeau est dû. */
export type Consentement = "accepte" | "refuse" | "inconnu";

interface Etat {
  consentement: Consentement;
  /**
   * Réouverture demandée depuis le pied de page.
   *
   * Un choix déjà fait doit rester révocable aussi facilement qu'il a été donné
   * (article 7 alinéa 3 RGPD) : sans cela, le bandeau ne reviendrait jamais et
   * le visiteur n'aurait aucun moyen de revenir dessus.
   */
  reglagesOuverts: boolean;
  /** Vrai une fois le stockage lu. Avant, on n'affiche rien. */
  hydrate: boolean;
}

type Ecouteur = () => void;

/**
 * L'état est remplacé, jamais modifié en place : `useSyncExternalStore` compare
 * les références pour décider s'il doit rendre à nouveau. Muter cet objet
 * laisserait le bandeau fermé quand on le rouvre.
 */
const ETAT_INITIAL: Etat = { consentement: "inconnu", reglagesOuverts: false, hydrate: false };

let instantane: Etat = ETAT_INITIAL;
let ecouteurStockageAttache = false;

const ecouteurs = new Set<Ecouteur>();

function lireStockage(): Consentement {
  if (typeof window === "undefined") return "inconnu";
  try {
    const brut = window.localStorage.getItem(CLE_CONSENTEMENT);
    return brut === "accepte" || brut === "refuse" ? brut : "inconnu";
  } catch {
    // Navigation privée verrouillée : on ne mémorise rien, donc on redemandera.
    return "inconnu";
  }
}

function ecrireStockage(valeur: Consentement): void {
  if (typeof window === "undefined") return;
  try {
    if (valeur === "inconnu") window.localStorage.removeItem(CLE_CONSENTEMENT);
    else window.localStorage.setItem(CLE_CONSENTEMENT, valeur);
  } catch {
    // Stockage refusé : le choix ne vaudra que pour cette page. Tant pis pour
    // le confort, jamais pour le respect du refus, rien ne se charge sans un
    // « accepte » en mémoire.
  }
}

function poser(etat: Etat): void {
  instantane = etat;
  for (const ecouteur of ecouteurs) ecouteur();
}

/** Un autre onglet a répondu au bandeau : celui-ci s'aligne. */
function surStockage(evenement: StorageEvent): void {
  if (evenement.key !== null && evenement.key !== CLE_CONSENTEMENT) return;
  poser({ consentement: lireStockage(), reglagesOuverts: false, hydrate: true });
}

function sabonner(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);

  if (typeof window !== "undefined" && !ecouteurStockageAttache) {
    window.addEventListener("storage", surStockage);
    ecouteurStockageAttache = true;
  }

  if (!instantane.hydrate && typeof window !== "undefined") {
    poser({ consentement: lireStockage(), reglagesOuverts: false, hydrate: true });
  }

  return () => {
    ecouteurs.delete(ecouteur);
  };
}

function lireInstantane(): Etat {
  return instantane;
}

/** Le serveur ne sait rien du navigateur : il rend toujours l'état d'attente. */
function lireInstantaneServeur(): Etat {
  return ETAT_INITIAL;
}

/** Enregistre la réponse du visiteur et referme le bandeau. */
export function repondreConsentement(valeur: "accepte" | "refuse"): void {
  ecrireStockage(valeur);
  poser({ consentement: valeur, reglagesOuverts: false, hydrate: true });
}

/** Rouvre le bandeau : appelé depuis le lien « Cookie-Einstellungen ». */
export function ouvrirReglagesConsentement(): void {
  poser({ ...instantane, reglagesOuverts: true, hydrate: true });
}

export function useConsentement(): {
  /** Réponse du visiteur, « inconnu » tant qu'il n'a rien dit. */
  consentement: Consentement;
  /** Vrai s'il faut afficher le bandeau. */
  banniereVisible: boolean;
} {
  const etat = useSyncExternalStore(sabonner, lireInstantane, lireInstantaneServeur);

  return {
    consentement: etat.consentement,
    banniereVisible:
      etat.hydrate && (etat.consentement === "inconnu" || etat.reglagesOuverts),
  };
}
