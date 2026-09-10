import type { JsonLdValue } from "@/components/seo/JsonLd";

/**
 * Lecture vocale (speakable). Un seul marqueur DOM pour tout le site :
 * l'attribut `data-speakable` posé sur le titre et le chapô qu'un assistant
 * vocal doit lire, et un unique sélecteur qui le cible partout. Affichage et
 * balisage lisent ainsi la même constante, comme pour le reste du JSON-LD.
 *
 * Portée réelle limitée : Google ne rend `speakable` que pour du contenu de
 * type actualité, en anglais, sur le marché US, via l'Assistant. Ailleurs
 * c'est ignoré sans pénalité. À garder minimal (titre + une ou deux phrases).
 */
export const SPEAKABLE_ATTRIBUTE = "data-speakable";

export const SPEAKABLE_SELECTOR = [`[${SPEAKABLE_ATTRIBUTE}]`] as const;

export const speakableSpecification: Record<string, JsonLdValue> = {
  "@type": "SpeakableSpecification",
  cssSelector: [...SPEAKABLE_SELECTOR],
};
