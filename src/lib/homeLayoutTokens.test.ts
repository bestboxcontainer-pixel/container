import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOME_SIZE_ACCENT,
  HOME_SIZE_CARD_TOKENS,
  HOME_SIZE_SECTION_TOKENS,
} from "./homeLayoutTokens";

describe("HOME_SIZE_SECTION_TOKENS", () => {
  it("pose un bandeau sombre pleine largeur, aux memes dimensions que la section Ablauf", () => {
    assert.match(HOME_SIZE_SECTION_TOKENS.section, /\bbg-secondary\b/);
    assert.match(HOME_SIZE_SECTION_TOKENS.section, /\btext-white\b/);
    // Memes classes de conteneur que « Wie läuft die Lieferung ab? » (Ablauf).
    assert.match(HOME_SIZE_SECTION_TOKENS.container, /max-w-screen-xl/);
    assert.match(HOME_SIZE_SECTION_TOKENS.container, /\bpy-8\b/);
    assert.doesNotMatch(HOME_SIZE_SECTION_TOKENS.container, /\bbg-white\b/);
  });

  it("n'utilise aucune trame ni damier en fond", () => {
    for (const token of Object.values(HOME_SIZE_SECTION_TOKENS)) {
      assert.doesNotMatch(token, /background-image/);
      assert.doesNotMatch(token, /background-size/);
    }
  });

  it("garde la decoration diffuse et non bloquante", () => {
    for (const token of [HOME_SIZE_SECTION_TOKENS.glow, HOME_SIZE_SECTION_TOKENS.glowSoft]) {
      assert.match(token, /\bpointer-events-none\b/);
      assert.match(token, /\babsolute\b/);
      assert.match(token, /\bblur-/);
    }
  });

  it("aligne le titre et les compteurs sur une seule ligne", () => {
    assert.match(HOME_SIZE_SECTION_TOKENS.header, /\bjustify-between\b/);
    assert.match(HOME_SIZE_SECTION_TOKENS.header, /\bflex-wrap\b/);
    assert.match(HOME_SIZE_SECTION_TOKENS.counterRow, /\bshrink-0\b/);
  });

  it("donne a chaque groupe son propre panneau", () => {
    assert.match(HOME_SIZE_SECTION_TOKENS.groupPanel, /\brounded-3xl\b/);
    assert.match(HOME_SIZE_SECTION_TOKENS.groupPanel, /bg-white\/\[0\.035\]/);
    assert.match(HOME_SIZE_SECTION_TOKENS.groupPanel, /ring-inset/);
  });

  it("garde le panneau de groupe plus sombre que les dimensions qu'il contient", () => {
    const opacite = (token: string) => {
      const trouve = token.match(/bg-white\/\[(0\.\d+)\]/);
      assert.ok(trouve, `aucune opacite de fond dans : ${token}`);
      return Number.parseFloat(trouve[1]);
    };

    // Sans cet ecart, les blocs se confondraient avec le panneau qui les porte.
    assert.equal(
      opacite(HOME_SIZE_CARD_TOKENS.item) > opacite(HOME_SIZE_SECTION_TOKENS.groupPanel),
      true,
    );
  });
});

describe("HOME_SIZE_CARD_TOKENS", () => {
  it("detache chaque dimension par un aplat, sans filet ni bordure", () => {
    // Un fond suffit a separer deux voisines ; une bordure reprenait le pas
    // sur le container qu'elle encadrait.
    assert.match(HOME_SIZE_CARD_TOKENS.item, /\bbg-white\/\[0\.07\]/);
    assert.match(HOME_SIZE_CARD_TOKENS.item, /\brounded-2xl\b/);
    assert.doesNotMatch(HOME_SIZE_CARD_TOKENS.item, /\bborder\b/);
    assert.doesNotMatch(HOME_SIZE_CARD_TOKENS.item, /\bring-/);
  });

  it("cale la zone image sur le ratio des PNG recadres pour ne rien rogner", () => {
    // Les visuels sont recadres sur leur boite utile : 535x250, soit 107/50.
    assert.match(HOME_SIZE_CARD_TOKENS.media, /aspect-\[107\/50\]/);
    // Les containers reposent tous sur la meme ligne de base.
    assert.match(HOME_SIZE_CARD_TOKENS.media, /\bitems-end\b/);
  });

  it("pose le container sur une ligne de sol plutot qu'un cadre", () => {
    for (const token of [HOME_SIZE_CARD_TOKENS.floor, HOME_SIZE_CARD_TOKENS.floorFeatured]) {
      assert.match(token, /\bh-px\b/);
      assert.match(token, /bg-gradient-to-r/);
    }
  });

  it("reserve la place du badge pour qu'il ne chevauche pas le visuel", () => {
    assert.match(HOME_SIZE_CARD_TOKENS.head, /\bh-4\b/);
    assert.doesNotMatch(HOME_SIZE_CARD_TOKENS.badge, /\babsolute\b/);
  });

  it("remplit le pied avec le libelle et la cote", () => {
    assert.match(HOME_SIZE_CARD_TOKENS.footer, /\bjustify-between\b/);
    assert.match(HOME_SIZE_CARD_TOKENS.detail, /\btabular-nums\b/);
  });

  it("met en avant l'option featured par un halo, pas par un aplat de carte", () => {
    assert.match(HOME_SIZE_CARD_TOKENS.featuredGlow, new RegExp(HOME_SIZE_ACCENT, "i"));
    assert.match(HOME_SIZE_CARD_TOKENS.featuredGlow, /\bblur-/);
    assert.match(HOME_SIZE_CARD_TOKENS.labelFeatured, new RegExp(HOME_SIZE_ACCENT, "i"));
  });
});

describe("HOME_SIZE_ACCENT", () => {
  it("est un terracotta eclairci, lisible sur le navy de la section", () => {
    assert.match(HOME_SIZE_ACCENT, /^#[0-9a-f]{6}$/i);

    const channel = (start: number) => {
      const value = Number.parseInt(HOME_SIZE_ACCENT.slice(start, start + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
    // Le fond de section est --secondary (#071825), luminance ~0.0083.
    const contrast = (luminance + 0.05) / (0.0083 + 0.05);

    assert.equal(contrast >= 4.5, true);
  });
});
