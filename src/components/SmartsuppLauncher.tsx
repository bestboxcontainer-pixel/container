"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useConsentement } from "@/lib/consent";

/**
 * File d'attente de l'API Smartsupp.
 * Le chargeur rejoue `smartsupp._` une fois prêt : les appels passés avant la
 * fin du chargement — ici « ouvre le chat » — ne sont donc pas perdus.
 */
type SmartsuppQueue = ((...args: unknown[]) => void) & { _: unknown[][] };

declare global {
  interface Window {
    _smartsupp?: { key?: string; language?: string };
    smartsupp?: SmartsuppQueue;
  }
}

const LOADER = "https://www.smartsuppchat.com/loader.js?";

/**
 * Éléments que le chargeur Smartsupp ajoute au corps de page une fois le widget
 * prêt. Leur présence est le seul signal fiable que quelque chose de visible a
 * remplacé notre bouton — `window.smartsupp`, lui, existe dès qu'on crée la file
 * d'attente, donc avant même que le script soit parti.
 *
 * Le sélecteur ratisse large volontairement. Smartsupp ne s'engage sur aucun nom
 * d'élément et l'a déjà changé ; viser un identifiant précis, c'est accepter que
 * le bouton tourne indéfiniment le jour où ils le renomment, alors même que le
 * chat s'est ouvert. Tout ce qu'on demande ici, c'est « quelque chose leur
 * appartenant est-il apparu ».
 */
const SELECTEUR_WIDGET = '[id^="smartsupp"], [class^="smartsupp"], iframe[src*="smartsupp"]';

/**
 * Délai au-delà duquel on considère que le widget ne viendra pas.
 *
 * Le script peut se charger sans que rien n'apparaisse : clé invalide, compte
 * suspendu, ou bloqueur qui laisse passer le fichier mais coupe la connexion
 * temps réel. Sans cette limite, le visiteur resterait devant une roue qui
 * tourne indéfiniment.
 */
const DELAI_WIDGET = 8000;

type Etat = "repos" | "chargement" | "echec";

/** Le script ne s'injecte qu'une fois, quelle que soit l'entrée qui le demande. */
let injecte = false;

/**
 * Injecte le chargeur Smartsupp.
 *
 * `ouvrirLeChat` distingue les deux entrées : le visiteur qui clique veut voir
 * la fenêtre s'ouvrir, celui qui a simplement accepté le chat ne veut pas
 * qu'elle lui saute au visage — Smartsupp décidera lui-même, à sa cadence, de
 * lui adresser le message de bienvenue.
 *
 * `enEchec` n'est utile qu'à celui qui attend devant son bouton ; le chargement
 * silencieux, lui, n'a rien à rattraper puisque rien n'a bougé à l'écran.
 */
function injecterSmartsupp(
  chatKey: string,
  language: string,
  ouvrirLeChat: boolean,
  enEchec: () => void,
): void {
  window._smartsupp = window._smartsupp ?? {};
  window._smartsupp.key = chatKey;
  window._smartsupp.language = language;

  if (!window.smartsupp) {
    const file: SmartsuppQueue = Object.assign(
      (...args: unknown[]) => {
        file._.push(args);
      },
      { _: [] as unknown[][] },
    );
    window.smartsupp = file;
  }

  if (ouvrirLeChat) {
    // Mis en file avant tout le reste : le chargeur l'exécutera, le chat
    // s'ouvrira sans second clic — y compris si le script est déjà parti tout
    // seul après l'accord au bandeau.
    window.smartsupp("chat:open");

    // Filet : script chargé mais widget jamais posé — clé refusée, compte
    // suspendu, connexion temps réel coupée. Le visiteur récupère son bouton.
    //
    // Posé à chaque demande, et non à la seule injection : le script ne part
    // qu'une fois, mais la roue, elle, repart à chaque clic. Le laisser avec
    // l'injection, c'est promettre au visiteur qu'on lui rendra la main, puis
    // ne plus rien faire dès le deuxième essai.
    window.setTimeout(() => {
      if (!document.querySelector(SELECTEUR_WIDGET)) enEchec();
    }, DELAI_WIDGET);
  }

  // Un second script dédoublerait le widget : l'appel mis en file suffit.
  if (injecte) return;
  injecte = true;

  const script = document.createElement("script");
  script.async = true;
  script.charset = "utf-8";
  script.src = LOADER;
  // Le chargement du fichier ne prouve rien : c'est l'apparition du widget qui
  // fait foi, et elle est observée dans le composant. On ne signale donc rien
  // ici — le bouton garde sa roue jusqu'à ce que le widget soit là.
  //
  // Un bloqueur de publicité filtre couramment ce domaine : mieux vaut rendre
  // la main au visiteur que laisser un bouton qui tourne dans le vide.
  script.addEventListener("error", () => {
    injecte = false;
    enEchec();
  });
  document.head.appendChild(script);
}

/**
 * Chat en direct, en bas à droite de la boutique.
 *
 * DEUX FAÇONS D'ARRIVER LÀ, ET C'EST VOULU.
 *
 * 1. Le visiteur a accepté au bandeau : le chat se charge tout seul dès
 *    l'ouverture de la page. C'est la seule manière d'obtenir ce que Smartsupp
 *    sait faire — voir le visiteur arriver, le compter parmi les connectés,
 *    lui adresser un message de bienvenue au bout de quelques secondes et
 *    prévenir l'application du commerçant. Le script pose une identification
 *    de visiteur : elle n'est pas nécessaire à la boutique, elle relève donc
 *    du consentement (§ 25 Abs. 1 TDDDG, article 5(3) de la directive
 *    ePrivacy), et c'est exactement ce que le bandeau a demandé.
 *
 * 2. Le visiteur a refusé, ou n'a pas encore répondu : le bouton ci-dessous
 *    reste, et rien ne part tant qu'il ne clique pas. Le clic EST la demande
 *    expresse du service, cas que le § 25 Abs. 2 Nr. 2 TDDDG dispense de
 *    recueil préalable. Refuser le bandeau ne prive donc personne du chat —
 *    cela prive seulement le commerçant de l'aborder le premier.
 *
 * La page « Datenschutzerklärung » décrit ce fonctionnement ; les deux doivent
 * rester d'accord.
 */
export function SmartsuppLauncher({
  chatKey,
  language,
  label,
}: {
  chatKey: string;
  language: string;
  label: string;
}) {
  const [etat, setEtat] = useState<Etat>("repos");
  const { consentement } = useConsentement();

  // Le widget, une fois posé, survit au démontage du composant — un changement
  // de langue remonte cette partie de l'arbre alors que le chat, lui, reste dans
  // la page. Sans cette lecture, le bouton reviendrait se poser par-dessus.
  //
  // On observe la présence du conteneur, et non `window.smartsupp` : cette
  // variable est créée pour la file d'attente, donc dès le clic. S'y fier
  // faisait disparaître le bouton immédiatement, avant que le chargeur ait rendu
  // quoi que ce soit — le visiteur cliquait, tout s'effaçait, et aucun chat ne
  // s'ouvrait.
  //
  // `useSyncExternalStore` est la façon prévue de lire une valeur qui vit hors
  // de React : elle rend `false` au rendu serveur, où `document` n'existe pas.
  const widgetPose = useSyncExternalStore(
    (prevenir) => {
      // `subtree` est nécessaire : le widget n'est pas toujours greffé
      // directement sur le corps de page, il arrive qu'il soit enveloppé.
      const observateur = new MutationObserver(prevenir);
      observateur.observe(document.body, { childList: true, subtree: true });
      return () => observateur.disconnect();
    },
    () => document.querySelector(SELECTEUR_WIDGET) != null,
    () => false,
  );

  // Chargement automatique après accord.
  //
  // Le bouton reste affiché et cliquable pendant ce temps, sans roue : rien n'a
  // été demandé à l'écran, et le visiteur qui veut écrire tout de suite ne doit
  // pas tomber sur un bouton grisé. Son clic sera mis en file de toute façon, et
  // le widget effacera le bouton en arrivant.
  useEffect(() => {
    if (consentement !== "accepte") return;
    if (injecte) return;

    injecterSmartsupp(chatKey, language, false, () => {});
  }, [chatKey, consentement, language]);

  const ouvrir = useCallback(() => {
    // Garde contre le double-clic : sans elle, le script partirait deux fois.
    if (etat !== "repos" && etat !== "echec") return;
    setEtat("chargement");

    injecterSmartsupp(chatKey, language, true, () => setEtat("echec"));
  }, [chatKey, etat, language]);

  // Une fois le widget posé, c'est lui qui occupe le coin : notre bouton doit
  // disparaître pour ne pas le recouvrir.
  if (widgetPose) return null;

  return (
    <button
      type="button"
      onClick={ouvrir}
      disabled={etat === "chargement"}
      aria-label={label}
      title={label}
      className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:scale-100 disabled:opacity-70"
    >
      {etat === "chargement" ? (
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.9 3 3 6.6 3 11c0 2.3 1.1 4.4 2.9 5.8L5 21l4.4-2.1c.8.2 1.7.3 2.6.3 5.1 0 9-3.6 9-8s-3.9-8-9-8z" />
        </svg>
      )}
    </button>
  );
}
