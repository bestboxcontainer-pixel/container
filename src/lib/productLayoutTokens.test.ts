import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRODUCT_BUY_TOKENS,
  PRODUCT_DETAIL_TOKENS,
  PRODUCT_GALLERY_TOKENS,
  PRODUCT_HERO_TOKENS,
  PRODUCT_REVIEW_TOKENS,
  PRODUCT_SHELL_TOKENS,
} from "./productLayoutTokens";

describe("PRODUCT_SHELL_TOKENS", () => {
  it("alterne les fonds pour donner un rythme a la page", () => {
    assert.match(PRODUCT_SHELL_TOKENS.heroBand, /\bbg-white\b/);
    assert.match(PRODUCT_SHELL_TOKENS.detailBand, /\bbg-gradient-to-b\b/);
    assert.match(PRODUCT_SHELL_TOKENS.reviewBand, /\bbg-white\b/);
    assert.match(PRODUCT_SHELL_TOKENS.relatedBand, /\bbg-muted\b/);
  });

  it("garde toutes les bandes sur la meme laisse de contenu", () => {
    for (const inner of [
      PRODUCT_SHELL_TOKENS.breadcrumbInner,
      PRODUCT_SHELL_TOKENS.heroInner,
      PRODUCT_SHELL_TOKENS.detailInner,
    ]) {
      assert.match(inner, /max-w-screen-xl/);
      assert.match(inner, /\bmx-auto\b/);
    }
  });
});

describe("PRODUCT_HERO_TOKENS", () => {
  it("fait suivre la colonne d'achat au defilement", () => {
    assert.match(PRODUCT_HERO_TOKENS.buyColumn, /lg:sticky/);
    assert.match(PRODUCT_HERO_TOKENS.buyColumn, /lg:self-start/);
  });

  it("separe la note de la reference article", () => {
    assert.match(PRODUCT_HERO_TOKENS.ratingChip, /\brounded-full\b/);
    assert.match(PRODUCT_HERO_TOKENS.skuChip, /\brounded-full\b/);
    assert.notEqual(PRODUCT_HERO_TOKENS.ratingChip, PRODUCT_HERO_TOKENS.skuChip);
  });

  it("borne la longueur de ligne du chapo", () => {
    assert.match(PRODUCT_HERO_TOKENS.lede, /max-w-prose/);
  });
});

describe("PRODUCT_GALLERY_TOKENS", () => {
  it("garde le conteneur entier dans son cadre", () => {
    // Recadrer un conteneur lui coupe les extremites : object-contain, jamais cover.
    assert.match(PRODUCT_GALLERY_TOKENS.image, /object-contain/);
    assert.doesNotMatch(PRODUCT_GALLERY_TOKENS.image, /object-cover/);
    assert.match(PRODUCT_GALLERY_TOKENS.frame, /aspect-\[4\/3\]/);
    assert.match(PRODUCT_GALLERY_TOKENS.frame, /overflow-hidden/);
  });

  it("ne bouge que si la personne accepte les animations", () => {
    assert.match(PRODUCT_GALLERY_TOKENS.image, /motion-safe:/);
  });

  it("distingue la vignette active des autres", () => {
    assert.match(PRODUCT_GALLERY_TOKENS.thumbOn, /border-primary/);
    assert.match(PRODUCT_GALLERY_TOKENS.thumbOff, /border-border/);
    assert.match(PRODUCT_GALLERY_TOKENS.thumb, /focus-visible:outline-2/);
  });
});

describe("PRODUCT_BUY_TOKENS", () => {
  it("pose le prix comme premiere information de la carte", () => {
    assert.match(PRODUCT_BUY_TOKENS.price, /text-4xl/);
    assert.match(PRODUCT_BUY_TOKENS.price, /text-primary/);
  });

  it("ferme la carte par le bandeau de garanties", () => {
    assert.match(PRODUCT_BUY_TOKENS.trust, /-mb-\d/);
    assert.match(PRODUCT_BUY_TOKENS.trust, /rounded-b-3xl/);
  });

  it("donne deux etats lisibles a la disponibilite", () => {
    assert.match(PRODUCT_BUY_TOKENS.stockOn, /text-primary/);
    assert.match(PRODUCT_BUY_TOKENS.stockOff, /text-muted-foreground/);
  });
});

describe("PRODUCT_DETAIL_TOKENS", () => {
  it("fait du panneau d'equipement l'ancre sombre de la fiche", () => {
    assert.match(PRODUCT_DETAIL_TOKENS.specCard, /\bbg-secondary\b/);
    assert.match(PRODUCT_DETAIL_TOKENS.specCard, /\btext-white\b/);
  });

  it("ne pose l'orange vif que sur le marine", () => {
    // Regle de la palette : signal tombe a 2,8:1 sur blanc, il reste sur marine.
    for (const token of [
      PRODUCT_DETAIL_TOKENS.specLabel,
      PRODUCT_DETAIL_TOKENS.specIcon,
      PRODUCT_DETAIL_TOKENS.specHalo,
    ]) {
      assert.match(token, /signal/);
    }
    for (const token of [
      PRODUCT_DETAIL_TOKENS.descCard,
      PRODUCT_DETAIL_TOKENS.descText,
      PRODUCT_DETAIL_TOKENS.label,
    ]) {
      assert.doesNotMatch(token, /signal/);
    }
  });

  it("aere la description, seul texte long de la fiche", () => {
    assert.match(PRODUCT_DETAIL_TOKENS.descText, /leading-\[1\.\d+\]/);
    assert.match(PRODUCT_DETAIL_TOKENS.descText, /max-w-prose/);
  });
});

describe("PRODUCT_REVIEW_TOKENS", () => {
  it("rend les etoiles pleines visibles sur fond blanc", () => {
    // Elles etaient remplies en accent, un gris bleute invisible sur du blanc.
    assert.match(PRODUCT_REVIEW_TOKENS.starOn, /fill-primary/);
    assert.doesNotMatch(PRODUCT_REVIEW_TOKENS.starOn, /accent/);
    assert.doesNotMatch(PRODUCT_REVIEW_TOKENS.starOff, /accent/);
  });

  it("garde la liste d'avis atteignable au clavier", () => {
    assert.match(PRODUCT_REVIEW_TOKENS.list, /overflow-y-auto/);
    assert.match(PRODUCT_REVIEW_TOKENS.list, /focus-visible:outline-2/);
  });

  it("mesure la hauteur de la liste en rem", () => {
    // En pixels, la liste couperait le texte des qu'on agrandit la police.
    assert.match(PRODUCT_REVIEW_TOKENS.list, /max-h-\[\d+rem\]/);
  });
});
