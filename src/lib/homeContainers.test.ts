import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOME_CONTAINERS } from "./homeContainers";

describe("HOME_CONTAINERS", () => {
  it("remplit exactement les deux rangees de la grille", () => {
    // La grille compte quatre colonnes sur grand ecran : huit fiches evitent
    // une rangee incomplete.
    assert.equal(HOME_CONTAINERS.length, 8);
  });

  it("sert des visuels locaux, presents dans le depot", () => {
    for (const container of HOME_CONTAINERS) {
      assert.match(container.image, /^\/images\/produkte\/[a-z0-9-]+\.jpg$/);
      assert.equal(
        existsSync(`public${container.image}`),
        true,
        `visuel manquant : ${container.image}`,
      );
    }
  });

  it("couvre les cinq familles vendues par l'entreprise", () => {
    const familles = new Set(HOME_CONTAINERS.map((container) => container.brand));

    assert.deepEqual(
      [...familles].sort(),
      ["Bürocontainer", "Lagercontainer", "Sanitärcontainer", "Seecontainer", "Sondercontainer"],
    );
  });

  it("affiche des prix au format allemand", () => {
    for (const container of HOME_CONTAINERS) {
      // « 1.451,00 € » : separateur de milliers en point, decimale en virgule.
      assert.match(container.price, /^\d{1,3}(\.\d{3})*,\d{2} €$/, container.name);
    }
  });

  it("decrit chaque container par trois caracteristiques et un resume", () => {
    for (const container of HOME_CONTAINERS) {
      assert.equal(container.bullets.length, 3, container.name);
      for (const bullet of container.bullets) {
        assert.equal(bullet.trim().length > 0, true);
      }
      assert.equal((container.shortDescription ?? "").length > 40, true, container.name);
    }
  });

  it("renvoie vers le sortiment tant que les fiches produit n'existent pas", () => {
    for (const container of HOME_CONTAINERS) {
      assert.match(container.href, /^\/sortiment#[a-z]+$/, container.name);
    }
  });

  it("donne a chaque fiche un identifiant et un texte alternatif distincts", () => {
    const slugs = HOME_CONTAINERS.map((container) => container.slug);
    assert.equal(new Set(slugs).size, slugs.length);

    for (const container of HOME_CONTAINERS) {
      assert.equal((container.alt ?? "").length > 10, true, container.name);
    }
  });
});
