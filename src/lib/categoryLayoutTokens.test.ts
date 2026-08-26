import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORY_FILTER_TOKENS, CATEGORY_GRID_TOKENS } from "./categoryLayoutTokens";

describe("CATEGORY_FILTER_TOKENS, colonne laterale", () => {
  it("ne laisse pas la colonne passer au-dessus de l'en-tete", () => {
    // L'en-tete est en z-50 : la colonne doit redescendre des qu'elle devient
    // une colonne collante, sinon elle lui passe dessus au defilement.
    assert.match(CATEGORY_FILTER_TOKENS.sidebarBase, /\blg:z-0\b/);
    for (const token of [CATEGORY_FILTER_TOKENS.sidebarOpen, CATEGORY_FILTER_TOKENS.sidebarClosed]) {
      assert.doesNotMatch(token, /\blg:z-50\b/);
    }
  });

  it("ne declare qu'une seule position au-dela de lg", () => {
    const classes = [
      CATEGORY_FILTER_TOKENS.sidebarBase,
      CATEGORY_FILTER_TOKENS.sidebarOpen,
      CATEGORY_FILTER_TOKENS.sidebarClosed,
    ].join(" ");
    const positions = classes.match(/\blg:(static|sticky|fixed|absolute|relative)\b/g) ?? [];

    // `lg:static` et `lg:sticky` ensemble laissaient l'ordre du CSS trancher.
    assert.deepEqual(positions, ["lg:sticky"]);
  });

  it("cale le decalage haut sur la hauteur reelle de l'en-tete", () => {
    // 6,75 rem en deux rangees, 4,5 rem au-dela de md : aucune valeur figee ne
    // convient aux deux.
    assert.match(CATEGORY_FILTER_TOKENS.sidebarBase, /lg:top-\[calc\(var\(--header-height\)/);
    assert.match(CATEGORY_FILTER_TOKENS.sidebarBase, /lg:max-h-\[calc\(100vh-var\(--header-height\)/);
    assert.doesNotMatch(CATEGORY_FILTER_TOKENS.sidebarBase, /\blg:top-\d+\b/);
  });
});

describe("CATEGORY_FILTER_TOKENS", () => {
  it("enferme les filtres dans un panneau visible", () => {
    assert.match(CATEGORY_FILTER_TOKENS.panel, /\bborder\b/);
    assert.match(CATEGORY_FILTER_TOKENS.panel, /\bbg-white\b/);
    assert.match(CATEGORY_FILTER_TOKENS.panel, /rounded-2xl/);
  });

  it("masque le marqueur natif des sections repliables", () => {
    assert.match(CATEGORY_FILTER_TOKENS.groupSummary, /\blist-none\b/);
    assert.match(CATEGORY_FILTER_TOKENS.groupSummary, /marker:content-\['\]?'\]/);
    assert.match(CATEGORY_FILTER_TOKENS.groupChevron, /group-open:rotate-180/);
  });

  it("dessine les reperes de selection au lieu des controles natifs", () => {
    for (const token of [CATEGORY_FILTER_TOKENS.box, CATEGORY_FILTER_TOKENS.dot]) {
      // La coche reste blanche : invisible sur fond blanc, lisible sur primary.
      assert.match(token, /\btext-white\b/);
      assert.match(token, /peer-checked:bg-primary/);
      // Le focus clavier doit rester visible malgre l'input masque.
      assert.match(token, /peer-focus-visible:ring-2/);
    }
    assert.match(CATEGORY_FILTER_TOKENS.box, /rounded-\[0\.35rem\]/);
    assert.match(CATEGORY_FILTER_TOKENS.dot, /\brounded-full\b/);
  });

  it("aligne les compteurs en pastille", () => {
    assert.match(CATEGORY_FILTER_TOKENS.count, /\brounded-full\b/);
    assert.match(CATEGORY_FILTER_TOKENS.count, /\btabular-nums\b/);
  });
});

describe("CATEGORY_GRID_TOKENS", () => {
  it("plafonne la grille a trois colonnes", () => {
    assert.match(CATEGORY_GRID_TOKENS.grid, /xl:grid-cols-3/);
    assert.doesNotMatch(CATEGORY_GRID_TOKENS.grid, /grid-cols-4/);
  });

  it("rappelle les filtres actifs au-dessus de la grille", () => {
    assert.match(CATEGORY_GRID_TOKENS.chipRow, /\bflex-wrap\b/);
    assert.match(CATEGORY_GRID_TOKENS.chip, /\brounded-full\b/);
    assert.match(CATEGORY_GRID_TOKENS.chip, /text-primary/);
  });
});
