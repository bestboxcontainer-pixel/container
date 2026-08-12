/**
 * Contrôle de la saisie du back-office lorsqu'un avis est modifié.
 *
 * Un modérateur retouche un avis pour de bonnes raisons : corriger une faute,
 * retirer un nom de famille, effacer un numéro de téléphone laissé dans le
 * texte. Les bornes sont donc celles du dépôt public — un avis corrigé ne doit
 * pas pouvoir devenir ce qu'un visiteur n'aurait jamais pu écrire.
 *
 * La date de dépôt est modifiable, mais jamais dans le futur : un avis daté de
 * demain se voit au premier tri et décrédibilise toute la fiche.
 *
 * Ce fichier ne touche pas à la base : il se teste seul.
 */

/** Saisie brute reçue de l'écran d'administration. */
export interface ReviewEditInput {
  authorName?: unknown;
  city?: unknown;
  rating?: unknown;
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
}

/** Avis modifié, prêt pour la base. */
export interface ReviewEdit {
  authorName: string;
  city: string | null;
  rating: number;
  title: string;
  body: string;
  createdAt?: Date;
}

export const REVIEW_LIMITS = {
  authorNameMin: 2,
  authorNameMax: 80,
  cityMax: 80,
  titleMax: 120,
  bodyMin: 10,
  bodyMax: 2000,
} as const;

type Resultat = { ok: true; value: ReviewEdit } | { ok: false; error: string };

const texte = (valeur: unknown): string => (typeof valeur === "string" ? valeur.trim() : "");

/**
 * Contrôle la saisie. `maintenant` est injecté plutôt que lu de l'horloge :
 * c'est ce qui rend le refus d'une date future vérifiable par un test.
 */
export function parseReviewEdit(
  input: ReviewEditInput,
  maintenant: Date = new Date(),
): Resultat {
  const authorName = texte(input.authorName);
  if (authorName.length < REVIEW_LIMITS.authorNameMin) {
    return { ok: false, error: "Le nom de l'auteur fait au moins deux caractères." };
  }
  if (authorName.length > REVIEW_LIMITS.authorNameMax) {
    return { ok: false, error: `Le nom dépasse ${REVIEW_LIMITS.authorNameMax} caractères.` };
  }

  const city = texte(input.city);
  if (city.length > REVIEW_LIMITS.cityMax) {
    return { ok: false, error: `La ville dépasse ${REVIEW_LIMITS.cityMax} caractères.` };
  }

  const rating = typeof input.rating === "number" ? input.rating : Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "La note est un entier de 1 à 5." };
  }

  const title = texte(input.title);
  if (title.length > REVIEW_LIMITS.titleMax) {
    return { ok: false, error: `L'intitulé dépasse ${REVIEW_LIMITS.titleMax} caractères.` };
  }

  const body = texte(input.body);
  if (body.length < REVIEW_LIMITS.bodyMin) {
    return { ok: false, error: "Le texte de l'avis fait au moins dix caractères." };
  }
  if (body.length > REVIEW_LIMITS.bodyMax) {
    return { ok: false, error: `Le texte dépasse ${REVIEW_LIMITS.bodyMax} caractères.` };
  }

  // La date est facultative : l'écran ne l'envoie que si elle a été touchée.
  let createdAt: Date | undefined;
  if (input.createdAt !== undefined && input.createdAt !== null && input.createdAt !== "") {
    const brut = new Date(String(input.createdAt));
    if (Number.isNaN(brut.getTime())) {
      return { ok: false, error: "La date de dépôt est illisible." };
    }
    if (brut.getTime() > maintenant.getTime()) {
      return { ok: false, error: "Un avis ne peut pas être daté du futur." };
    }
    createdAt = brut;
  }

  return {
    ok: true,
    value: { authorName, city: city || null, rating, title, body, createdAt },
  };
}
