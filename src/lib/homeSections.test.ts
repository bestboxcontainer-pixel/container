import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatSizeDetail, HOME_FAQS, HOME_SIZE_GROUPS } from "./homeSections";

describe("HOME_FAQS", () => {
  it("propose une FAQ courte et exploitable", () => {
    assert.equal(HOME_FAQS.length >= 4, true);
    for (const item of HOME_FAQS) {
      assert.equal(item.question.endsWith("?"), true);
      assert.equal(item.answer.length > 40, true);
    }
  });
});

describe("HOME_SIZE_GROUPS", () => {
  it("reprend trois blocs de tailles avec options visibles", () => {
    assert.deepEqual(
      HOME_SIZE_GROUPS.map((group) => group.id),
      ["laengen", "breiten", "hoehen"],
    );
    assert.deepEqual(
      HOME_SIZE_GROUPS.map((group) => group.options.length),
      [10, 2, 3],
    );
  });

  it("utilise uniquement des visuels locaux pour chaque option", () => {
    for (const group of HOME_SIZE_GROUPS) {
      for (const option of group.options) {
        assert.match(option.imageSrc, /^\/images\/.+\.(png|jpg)$/);
        assert.equal(existsSync(`public${option.imageSrc}`), true);
      }
    }
  });

  it("mappe les longueurs sur les dix PNG transparents dédiés", () => {
    const lengthGroup = HOME_SIZE_GROUPS.find((group) => group.id === "laengen");

    assert.ok(lengthGroup);
    assert.deepEqual(
      lengthGroup.options.map((option) => option.imageSrc),
      [
        "/images/sizes/3m.png",
        "/images/sizes/4m.png",
        "/images/sizes/5m.png",
        "/images/sizes/6m.png",
        "/images/sizes/7m.png",
        "/images/sizes/8m.png",
        "/images/sizes/9m.png",
        "/images/sizes/10m.png",
        "/images/sizes/11m.png",
        "/images/sizes/12m.png",
      ],
    );
  });
});

describe("formatSizeDetail", () => {
  it("derive la cote millimetrique du libelle, au format allemand", () => {
    assert.equal(formatSizeDetail("3m"), "3.000 mm");
    assert.equal(formatSizeDetail("12m"), "12.000 mm");
    assert.equal(formatSizeDetail("2,4m"), "2.400 mm");
    assert.equal(formatSizeDetail("2,60m"), "2.600 mm");
  });

  it("renvoie une chaine vide quand le libelle ne porte aucun nombre", () => {
    assert.equal(formatSizeDetail("auf Anfrage"), "");
  });

  it("couvre chaque option des trois groupes", () => {
    for (const group of HOME_SIZE_GROUPS) {
      for (const option of group.options) {
        assert.match(formatSizeDetail(option.label), /^[\d.]+ mm$/);
      }
    }
  });
});
