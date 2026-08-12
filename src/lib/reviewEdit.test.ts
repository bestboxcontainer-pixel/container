/**
 * Tests du contrôle de saisie à la modification d'un avis.
 *
 * L'enjeu : cet écran est le seul endroit où le contenu d'un avis publié peut
 * changer après coup. Trop permissif, il laisse écrire ce qu'un visiteur
 * n'aurait pas pu déposer — et un avis retouché reste un avis affiché à des
 * acheteurs.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseReviewEdit } from "./reviewEdit";

const VALIDE = {
  authorName: "Hans M.",
  city: "Trier",
  rating: 4,
  title: "Gutes Gerät",
  body: "Läuft leise und wäscht sehr gut.",
};

const MAINTENANT = new Date("2026-08-12T10:00:00.000Z");

describe("Modification d'un avis", () => {
  it("accepte une saisie normale", () => {
    const r = parseReviewEdit(VALIDE, MAINTENANT);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.authorName, "Hans M.");
      assert.equal(r.value.city, "Trier");
      assert.equal(r.value.rating, 4);
      assert.equal(r.value.createdAt, undefined);
    }
  });

  it("rend la ville nulle quand elle est effacée", () => {
    // Cas réel : le modérateur retire une ville trop identifiante.
    const r = parseReviewEdit({ ...VALIDE, city: "   " }, MAINTENANT);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.city, null);
  });

  it("refuse une note hors de l'échelle", () => {
    for (const rating of [0, 6, 2.5, "quatre", null]) {
      const r = parseReviewEdit({ ...VALIDE, rating }, MAINTENANT);
      assert.equal(r.ok, false, `note ${String(rating)} acceptée à tort`);
    }
  });

  it("refuse un texte trop court ou vide", () => {
    for (const body of ["", "   ", "top"]) {
      assert.equal(parseReviewEdit({ ...VALIDE, body }, MAINTENANT).ok, false);
    }
  });

  it("refuse un nom d'auteur vide", () => {
    assert.equal(parseReviewEdit({ ...VALIDE, authorName: " " }, MAINTENANT).ok, false);
  });

  it("refuse ce qui dépasse les bornes du dépôt public", () => {
    assert.equal(parseReviewEdit({ ...VALIDE, body: "x".repeat(2001) }, MAINTENANT).ok, false);
    assert.equal(parseReviewEdit({ ...VALIDE, title: "x".repeat(121) }, MAINTENANT).ok, false);
    assert.equal(parseReviewEdit({ ...VALIDE, authorName: "x".repeat(81) }, MAINTENANT).ok, false);
    assert.equal(parseReviewEdit({ ...VALIDE, city: "x".repeat(81) }, MAINTENANT).ok, false);
  });

  it("accepte une date de dépôt passée", () => {
    const r = parseReviewEdit({ ...VALIDE, createdAt: "2025-03-04" }, MAINTENANT);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.createdAt?.toISOString().slice(0, 10), "2025-03-04");
  });

  it("refuse une date de dépôt dans le futur", () => {
    // Un avis daté de demain se repère au premier tri et discrédite la fiche.
    const r = parseReviewEdit({ ...VALIDE, createdAt: "2026-12-01" }, MAINTENANT);
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /futur/i);
  });

  it("refuse une date illisible", () => {
    assert.equal(parseReviewEdit({ ...VALIDE, createdAt: "hier" }, MAINTENANT).ok, false);
  });

  it("ignore une date absente plutôt que de la remettre à aujourd'hui", () => {
    // Sans ce comportement, enregistrer une correction d'orthographe
    // remonterait l'avis en tête de liste comme s'il venait d'être déposé.
    for (const createdAt of [undefined, null, ""]) {
      const r = parseReviewEdit({ ...VALIDE, createdAt }, MAINTENANT);
      assert.equal(r.ok, true);
      if (r.ok) assert.equal(r.value.createdAt, undefined);
    }
  });
});
