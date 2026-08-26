import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Invariants du catalogue relevé par `scripts/collecter-containers.ts`.
 *
 * Le fichier est le seul intermédiaire entre la source et la base : ce qui
 * passe ici finit sur le site. Les contrôles portent donc sur ce qu'une fiche
 * doit avoir pour être publiable, et sur les défauts d'extraction déjà
 * rencontrés, qu'une évolution du gabarit de la source ferait revenir.
 */
interface Fiche {
  slug: string;
  name: string;
  categorie: string;
  sku: string;
  priceCents: number;
  condition: string;
  shortDescription: string;
  description: string;
  bullets: string[];
  images: string[];
}

const CATEGORIES_ATTENDUES = [
  "seecontainer",
  "lagercontainer",
  "buerocontainer",
  "sanitaercontainer",
  "sondercontainer",
];

const fiches: Fiche[] = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "catalogue-containers.json"), "utf8"),
);

describe("catalogue des conteneurs", () => {
  it("ne range les conteneurs que dans les cinq categories du site", () => {
    const trouvees = [...new Set(fiches.map((fiche) => fiche.categorie))].sort();
    assert.deepEqual(trouvees, [...CATEGORIES_ATTENDUES].sort());
  });

  it("remplit chaque categorie", () => {
    for (const categorie of CATEGORIES_ATTENDUES) {
      const compte = fiches.filter((fiche) => fiche.categorie === categorie).length;
      assert.ok(compte > 0, `${categorie} est vide`);
    }
  });

  it("donne a chaque fiche un identifiant, un prix et au moins un visuel", () => {
    for (const fiche of fiches) {
      assert.match(fiche.slug, /^[a-z0-9-]+$/, fiche.slug);
      assert.match(fiche.sku, /^BBC-[A-Z]{3}-\d{3}$/, fiche.slug);
      assert.ok(fiche.priceCents > 0, `${fiche.slug} sans prix`);
      assert.ok(fiche.images.length > 0, `${fiche.slug} sans visuel`);
      assert.ok(["new", "used"].includes(fiche.condition), fiche.slug);
    }
  });

  it("n'attribue jamais deux fois le meme slug ni la meme reference", () => {
    assert.equal(new Set(fiches.map((f) => f.slug)).size, fiches.length);
    assert.equal(new Set(fiches.map((f) => f.sku)).size, fiches.length);
  });

  it("tient la limite de 200 caracteres du resume, sans le laisser vide", () => {
    for (const fiche of fiches) {
      assert.ok(fiche.shortDescription.length >= 40, `${fiche.slug} : resume trop court`);
      assert.ok(fiche.shortDescription.length <= 201, `${fiche.slug} : resume trop long`);
    }
  });

  it("ne laisse passer ni balise ni entite HTML", () => {
    for (const fiche of fiches) {
      const texte = [fiche.name, fiche.shortDescription, fiche.description, ...fiche.bullets].join(" ");
      assert.doesNotMatch(texte, /<[a-z/]/i, `${fiche.slug} : balise residuelle`);
      assert.doesNotMatch(texte, /&(nbsp|amp|lt|gt|quot|#\d+);/i, `${fiche.slug} : entite residuelle`);
    }
  });

  it("retire la puce typographique que la source laisse en tete de ligne", () => {
    for (const fiche of fiches) {
      for (const puce of fiche.bullets) {
        assert.doesNotMatch(puce, /^[•·*–—-]/, `${fiche.slug} : « ${puce} »`);
      }
    }
  });

  it("ne publie pas de titre crie, mais preserve les sigles du metier", () => {
    for (const fiche of fiches) {
      const mots = fiche.name.match(/\p{L}+/gu) ?? [];
      const crie = mots.filter((mot) => mot.length >= 3 && mot === mot.toUpperCase());
      const consecutifs = crie.length > 0 && mots.some((mot, index) =>
        index > 0 && crie.includes(mot) && crie.includes(mots[index - 1]));
      assert.equal(consecutifs, false, `${fiche.slug} : « ${fiche.name} »`);
    }
    // « IICL » doit avoir survecu a la normalisation.
    assert.ok(fiches.some((fiche) => fiche.name.includes("IICL")));
  });

  it("ne laisse aucune fiche sans caracteristique sous son titre", () => {
    // Huit fiches arrivaient nues sur la grille : la source les decrit en
    // prose, sans tableau. Elles reprennent desormais les cotes ISO 668 de
    // leur type. Une carte sans une seule ligne sous le titre est un defaut.
    for (const fiche of fiches) {
      assert.ok(fiche.bullets.length > 0, `${fiche.slug} : aucune caracteristique`);
    }
  });

  it("ne liste jamais deux fois la meme caracteristique", () => {
    // La source donne parfois les memes cotes en « Außenmaße » et en
    // « Innenmaße » : la ligne sortait deux fois sous le titre.
    for (const fiche of fiches) {
      assert.equal(new Set(fiche.bullets).size, fiche.bullets.length, fiche.slug);
    }
  });

  it("ne repete pas le resume dans les caracteristiques", () => {
    // La fiche produit affiche le resume sous le titre, puis les
    // caracteristiques : une ligne reprise a l'identique s'y lisait deux fois.
    for (const fiche of fiches) {
      for (const puce of fiche.bullets) {
        assert.notEqual(puce.trim(), fiche.shortDescription.trim(), fiche.slug);
      }
    }
  });

  it("ne garde aucun intitule de section parmi les caracteristiques", () => {
    const intitules = /^(technische daten|abmessungen und gewicht|ausstattung|innenausstattung|elektroinstallation|produkt[üu]bersicht)$/i;
    for (const fiche of fiches) {
      for (const puce of fiche.bullets) {
        assert.doesNotMatch(puce, intitules, `${fiche.slug} : « ${puce} »`);
      }
    }
  });
});
