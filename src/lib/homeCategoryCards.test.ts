import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOME_CATEGORY_CARDS } from "./homeCategoryCards";

describe("HOME_CATEGORY_CARDS", () => {
  it("expose exactement cinq categories dans l'ordre attendu", () => {
    assert.deepEqual(
      HOME_CATEGORY_CARDS.map((card) => card.id),
      [
        "seecontainer",
        "lagercontainer",
        "buerocontainer",
        "sanitaercontainer",
        "sondercontainer",
      ],
    );
  });

  it("utilise uniquement des visuels locaux sous /images/kategorien/", () => {
    for (const card of HOME_CATEGORY_CARDS) {
      assert.match(card.imageSrc, /^\/images\/kategorien\/[a-z0-9-]+\.png$/);
      assert.equal(card.imageAlt.length > 10, true);
    }
  });
});
