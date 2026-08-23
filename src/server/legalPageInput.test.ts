/**
 * Tests du contrôle des pages légales soumises par l'administration.
 *
 * L'enjeu : ce contrôle est la dernière barrière avant que du contenu saisi
 * dans un navigateur ne devienne une page juridique publique. On vérifie donc
 * ce qui est refusé autant que ce qui est accepté.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deLegalPages } from "@/content/legal/de";
import {
  isIsoDate,
  normalizeLegalPage,
  parseStoredLegalPage,
  toLegalPageInput,
  type LegalPageInput,
} from "./legalPageInput";

function validInput(overrides: Partial<LegalPageInput> = {}): LegalPageInput {
  return {
    title: "Impressum",
    intro: "Anbieterkennzeichnung nach § 5 DDG.",
    sections: [
      {
        heading: "Diensteanbieter",
        body: "Verantwortlich für diesen Onlineshop ist:",
        list: ["BBC Best Box Containerhandel e.K.", "Musterstraße 12"],
      },
    ],
    updatedAt: "2026-07-28",
    ...overrides,
  };
}

describe("normalizeLegalPage: contenu accepté", () => {
  it("accepte une page complète et lui rend son slug", () => {
    const result = normalizeLegalPage(validInput(), "impressum");
    assert.ok(result.ok);
    assert.equal(result.page.slug, "impressum");
    assert.equal(result.page.title, "Impressum");
    assert.deepEqual(result.page.sections[0].list, ["BBC Best Box Containerhandel e.K.", "Musterstraße 12"]);
  });

  it("omet le chapeau quand il est vide plutôt que d'afficher un encadré vide", () => {
    const result = normalizeLegalPage(validInput({ intro: "   " }), "kontakt");
    assert.ok(result.ok);
    assert.equal(result.page.intro, undefined);
  });

  it("omet la liste quand elle ne contient que des entrées vides", () => {
    const result = normalizeLegalPage(
      validInput({ sections: [{ heading: "Titel", body: "Text", list: ["", "  "] }] }),
      "agb",
    );
    assert.ok(result.ok);
    assert.equal(result.page.sections[0].list, undefined);
  });

  it("accepte une section qui ne porte qu'une liste", () => {
    const result = normalizeLegalPage(
      validInput({ sections: [{ heading: "Kontakt", body: "", list: ["Telefon: 0800 123 45"] }] }),
      "kontakt",
    );
    assert.ok(result.ok);
    assert.equal(result.page.sections[0].body, "");
  });

  it("retire une section entièrement vide au lieu de refuser l'enregistrement", () => {
    const result = normalizeLegalPage(
      validInput({
        sections: [
          { heading: "Titel", body: "Text", list: [] },
          { heading: "", body: "", list: [] },
        ],
      }),
      "agb",
    );
    assert.ok(result.ok);
    assert.equal(result.page.sections.length, 1);
  });

  it("normalise les fins de ligne Windows", () => {
    const result = normalizeLegalPage(
      validInput({ sections: [{ heading: "Titel", body: "Zeile 1\r\nZeile 2", list: [] }] }),
      "agb",
    );
    assert.ok(result.ok);
    assert.equal(result.page.sections[0].body, "Zeile 1\nZeile 2");
  });

  it("conserve les marques de formatage sans y toucher", () => {
    const body = "Nur **heute** gültig, siehe [AGB](/agb).";
    const result = normalizeLegalPage(
      validInput({ sections: [{ heading: "Aktion", body, list: [] }] }),
      "aktion" as never,
    );
    assert.ok(result.ok);
    assert.equal(result.page.sections[0].body, body);
  });
});

describe("normalizeLegalPage : contenu refusé", () => {
  const cases: [string, unknown][] = [
    ["un objet absent", null],
    ["une chaîne", "Impressum"],
  ];

  for (const [label, raw] of cases) {
    it(`refuse ${label}`, () => {
      const result = normalizeLegalPage(raw, "impressum");
      assert.equal(result.ok, false);
    });
  }

  it("refuse un titre vide", () => {
    const result = normalizeLegalPage(validInput({ title: "  " }), "impressum");
    assert.equal(result.ok, false);
  });

  it("refuse une page sans aucune section", () => {
    const result = normalizeLegalPage(validInput({ sections: [] }), "impressum");
    assert.equal(result.ok, false);
  });

  it("refuse une section sans titre mais avec du texte", () => {
    const result = normalizeLegalPage(
      validInput({ sections: [{ heading: "", body: "Text", list: [] }] }),
      "impressum",
    );
    assert.equal(result.ok, false);
  });

  it("refuse une date mal formée ou inexistante", () => {
    assert.equal(normalizeLegalPage(validInput({ updatedAt: "28.07.2026" }), "agb").ok, false);
    assert.equal(normalizeLegalPage(validInput({ updatedAt: "2026-02-31" }), "agb").ok, false);
    assert.equal(normalizeLegalPage(validInput({ updatedAt: "" }), "agb").ok, false);
  });

  it("refuse un titre démesuré", () => {
    const result = normalizeLegalPage(validInput({ title: "x".repeat(201) }), "agb");
    assert.equal(result.ok, false);
  });
});

describe("isIsoDate", () => {
  it("accepte une date réelle", () => {
    assert.ok(isIsoDate("2026-07-28"));
    assert.ok(isIsoDate("2024-02-29"));
  });

  it("refuse une date impossible", () => {
    assert.equal(isIsoDate("2026-13-01"), false);
    assert.equal(isIsoDate("2025-02-29"), false);
    assert.equal(isIsoDate("2026-7-8"), false);
  });
});

describe("aller-retour formulaire ↔ page", () => {
  it("ne modifie pas le contenu d'origine allemand", () => {
    for (const page of Object.values(deLegalPages)) {
      const result = normalizeLegalPage(toLegalPageInput(page), page.slug);
      assert.ok(result.ok, `${page.slug} devrait rester valide`);
      assert.deepEqual(result.page, page, `${page.slug} a été altéré par l'aller-retour`);
    }
  });
});

describe("parseStoredLegalPage", () => {
  it("relit un contenu stocké", () => {
    const stored = JSON.stringify(deLegalPages.impressum);
    assert.deepEqual(parseStoredLegalPage(stored, "impressum"), deLegalPages.impressum);
  });

  it("rend null sur un JSON cassé plutôt que de lever", () => {
    assert.equal(parseStoredLegalPage("{ pas du json", "impressum"), null);
  });

  it("rend null sur un contenu qui ne passe plus le contrôle", () => {
    assert.equal(parseStoredLegalPage(JSON.stringify({ title: "" }), "impressum"), null);
  });
});
