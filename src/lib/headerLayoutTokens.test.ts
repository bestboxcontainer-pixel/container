import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HEADER_LAYOUT_TOKENS, HEADER_MENU_TOKENS } from "./headerLayoutTokens";

describe("HEADER_LAYOUT_TOKENS", () => {
  it("ne montre la navigation en ligne qu'a partir de lg", () => {
    assert.match(HEADER_LAYOUT_TOKENS.deskNav, /\bhidden\b/);
    assert.match(HEADER_LAYOUT_TOKENS.deskNav, /\blg:flex\b/);
  });

  it("ne fait plus defiler la navigation a l'horizontale", () => {
    // C'est le geste que le repli remplace : rien ne l'annonçait a l'ecran.
    assert.doesNotMatch(HEADER_LAYOUT_TOKENS.deskNav, /overflow-x-auto/);
  });

  it("pousse les actions a droite quand la navigation est repliee", () => {
    assert.match(HEADER_LAYOUT_TOKENS.spacer, /\bflex-1\b/);
    assert.match(HEADER_LAYOUT_TOKENS.spacer, /\blg:hidden\b/);
  });
});

describe("HEADER_MENU_TOKENS", () => {
  it("cache le bouton des que la navigation tient en ligne", () => {
    assert.match(HEADER_MENU_TOKENS.toggle, /\blg:hidden\b/);
    assert.match(HEADER_MENU_TOKENS.panel, /\blg:hidden\b/);
  });

  it("donne au bouton une cible visable au pouce", () => {
    assert.match(HEADER_MENU_TOKENS.toggle, /\bh-10\b/);
    assert.match(HEADER_MENU_TOKENS.toggle, /\bw-10\b/);
  });

  it("garde le focus clavier visible sur le bouton et les liens", () => {
    assert.match(HEADER_MENU_TOKENS.toggle, /focus-visible:outline-2/);
    assert.match(HEADER_MENU_TOKENS.panelLink, /focus-visible:outline-2/);
  });

  it("donne au panneau un fond opaque a lui", () => {
    // L'en-tete en surimpression est transparent avant defilement : sans fond
    // propre, le menu deplie se poserait sur la photo du hero.
    assert.match(HEADER_MENU_TOKENS.panel, /\bbg-secondary\b/);
    assert.doesNotMatch(HEADER_MENU_TOKENS.panel, /bg-secondary\//);
  });

  it("ancre le panneau sous la barre, sur toute la largeur", () => {
    assert.match(HEADER_MENU_TOKENS.panel, /\babsolute\b/);
    assert.match(HEADER_MENU_TOKENS.panel, /\btop-full\b/);
    assert.match(HEADER_MENU_TOKENS.panel, /\binset-x-0\b/);
  });

  it("etale la cible des liens sur toute la rangee", () => {
    assert.match(HEADER_MENU_TOKENS.panelLink, /\bflex\b/);
    assert.match(HEADER_MENU_TOKENS.panelLink, /\bpy-3\b/);
  });
});
