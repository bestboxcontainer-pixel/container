/**
 * Échelles d'efficacité énergétique, par famille de produits.
 *
 * Le règlement (UE) 2017/1369 impose au vendeur à distance d'afficher la classe
 * d'un appareil « à proximité du prix », accompagnée de l'étendue de l'échelle
 * applicable — sans quoi un « A » ne veut rien dire : c'est le haut de l'échelle
 * pour un lave-linge, le milieu pour un four.
 *
 * Deux échelles cohabitent encore en 2026. Les familles rééchelonnées depuis
 * mars 2021 (lave-linge, lave-vaisselle, froid, téléviseurs, et les smartphones
 * et tablettes depuis juin 2025) vont de A à G. Les fours et les climatiseurs
 * relèvent toujours de leurs règlements délégués d'origine, dont l'échelle
 * culmine à A+++ et descend à D.
 *
 * Une famille absente de cette table n'est soumise à aucun étiquetage : les
 * aspirateurs depuis l'annulation du règlement 665/2013, les cafetières, les
 * robots de cuisine, les ordinateurs portables, les montres connectées. Rien
 * ne s'affiche alors, et c'est correct.
 */

/** Étendue d'une échelle, du plus efficace au moins efficace. */
export interface EchelleEnergie {
  /** Classe la plus efficace, par ex. « A » ou « A+++ ». */
  readonly meilleure: string;
  /** Classe la moins efficace, par ex. « G » ou « D ». */
  readonly pire: string;
}

/** Échelle A–G, issue du rééchelonnage de 2021. */
const ECHELLE_REECHELONNEE: EchelleEnergie = { meilleure: "A", pire: "G" };

/** Échelle A+++–D, maintenue pour les familles non encore rééchelonnées. */
const ECHELLE_HISTORIQUE: EchelleEnergie = { meilleure: "A+++", pire: "D" };

/**
 * Échelle applicable, par identifiant de catégorie de la boutique.
 *
 * La table est indexée sur le slug plutôt que sur la catégorie Google : c'est
 * le slug qui décide de l'arborescence du site, il ne bouge pas, et le lien
 * entre une famille réglementaire et une rubrique de vente se lit d'un coup.
 */
const ECHELLES: Readonly<Record<string, EchelleEnergie>> = {
  waschmaschinen: ECHELLE_REECHELONNEE,
  geschirrspueler: ECHELLE_REECHELONNEE,
  fernseher: ECHELLE_REECHELONNEE,
  smartphones: ECHELLE_REECHELONNEE,
  "backoefen-herde": ECHELLE_HISTORIQUE,
  klimageraete: ECHELLE_HISTORIQUE,
};

/**
 * Échelle d'une catégorie, ou `undefined` si la famille n'est pas étiquetée.
 *
 * L'appelant qui n'obtient rien n'affiche rien : mieux vaut taire la classe que
 * l'annoncer sur une échelle inventée.
 */
export function echelleEnergie(categorySlug: string): EchelleEnergie | undefined {
  return ECHELLES[categorySlug];
}

/**
 * La classe annoncée tient-elle sur l'échelle de sa catégorie ?
 *
 * Un « A+ » sur une famille rééchelonnée est le signe d'une donnée qui n'a pas
 * suivi la réforme de 2021 : l'afficher tromperait l'acheteur et vaudrait un
 * refus de la fiche. Dans le doute, on préfère ne rien montrer.
 */
export function classeCoherente(classe: string, echelle: EchelleEnergie): boolean {
  const valeur = classe.trim().toUpperCase();
  if (!/^A\+{0,3}$|^[B-G]$/.test(valeur)) return false;

  // Les classes à « + » n'existent que sur l'échelle historique ; réciproquement,
  // celle-ci s'arrête à D et ne connaît ni E, ni F, ni G.
  return echelle.meilleure === "A+++"
    ? !/^[E-G]$/.test(valeur)
    : !valeur.includes("+");
}
