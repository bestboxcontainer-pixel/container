import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORY_BAR_TOKENS, CATEGORY_GRID_TOKENS } from "./categoryLayoutTokens";

describe("CATEGORY_BAR_TOKENS", () => {
  it("laisse la barre revenir a la ligne au lieu de defiler", () => {
    // Un rang de boutons qui glisse horizontalement n'annonce jamais ce qu'il
    // cache : sur mobile, les filtres au-dela du bord etaient introuvables.
    assert.match(CATEGORY_BAR_TOKENS.bar, /\bflex-wrap\b/);
    assert.doesNotMatch(CATEGORY_BAR_TOKENS.bar, /\boverflow-x-auto\b/);
    assert.match(CATEGORY_BAR_TOKENS.group, /\bflex-wrap\b/);
  });

  it("pose les menus au-dessus des fiches sans passer devant l'en-tete", () => {
    // L'en-tete est en z-50 et colle en haut au defilement : un menu ouvert ne
    // doit pas lui passer dessus.
    const niveau = CATEGORY_BAR_TOKENS.menu.match(/\bz-(\d+)\b/);
    assert.ok(niveau, "le menu doit declarer un niveau");
    assert.ok(Number(niveau[1]) > 0 && Number(niveau[1]) < 50, `z-${niveau[1]} hors bornes`);
  });

  it("borne la hauteur du menu et le rend defilant", () => {
    // La bauart compte une entree par famille : sans plafond, le menu depasse
    // l'ecran et ses dernieres lignes deviennent inatteignables.
    assert.match(CATEGORY_BAR_TOKENS.menu, /\bmax-h-\d+\b/);
    assert.match(CATEGORY_BAR_TOKENS.menu, /\boverflow-y-auto\b/);
  });

  it("distingue a l'oeil un filtre actif d'un filtre au repos", () => {
    for (const [repos, actif] of [
      [CATEGORY_BAR_TOKENS.trigger, CATEGORY_BAR_TOKENS.triggerActive],
      [CATEGORY_BAR_TOKENS.toggle, CATEGORY_BAR_TOKENS.toggleActive],
    ]) {
      assert.match(repos, /\bborder-border\b/);
      assert.match(actif, /\bborder-primary\b/);
      assert.notEqual(repos, actif);
    }
  });

  it("dessine les reperes de selection au lieu des controles natifs", () => {
    for (const token of [CATEGORY_BAR_TOKENS.box, CATEGORY_BAR_TOKENS.dot]) {
      assert.match(token, /peer-checked:bg-primary/);
      assert.match(token, /peer-focus-visible:ring-2/);
      assert.match(token, /\bbg-white\b/);
      assert.match(token, /\btext-white\b/);
    }
    assert.match(CATEGORY_BAR_TOKENS.box, /rounded-\[0\.35rem\]/);
    assert.match(CATEGORY_BAR_TOKENS.dot, /\brounded-full\b/);
  });

  it("aligne les compteurs en pastille", () => {
    assert.match(CATEGORY_BAR_TOKENS.count, /\brounded-full\b/);
    assert.match(CATEGORY_BAR_TOKENS.count, /\btabular-nums\b/);
    assert.match(CATEGORY_BAR_TOKENS.triggerCount, /\btabular-nums\b/);
  });
});

describe("CATEGORY_GRID_TOKENS", () => {
  it("etale la grille jusqu'a quatre colonnes", () => {
    // La borne a trois datait de la colonne de filtres, qui mangeait 16 rem a
    // gauche. Sur la largeur entiere, une quatrieme fiche tient.
    assert.match(CATEGORY_GRID_TOKENS.grid, /xl:grid-cols-4/);
    assert.match(CATEGORY_GRID_TOKENS.grid, /lg:grid-cols-3/);
    // Deux de front sur mobile : une seule fiche par rangee etire la page.
    assert.match(CATEGORY_GRID_TOKENS.grid, /\bgrid-cols-2\b/);
  });

  it("rappelle les filtres actifs au-dessus de la grille", () => {
    assert.match(CATEGORY_GRID_TOKENS.chipRow, /\bflex-wrap\b/);
    assert.match(CATEGORY_GRID_TOKENS.chip, /\brounded-full\b/);
    assert.match(CATEGORY_GRID_TOKENS.chip, /text-primary/);
  });
});
