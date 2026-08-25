import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Garde-fou de contraste de la palette.
 *
 * Les valeurs ne sont pas recopiees ici : le test lit `globals.css` et mesure
 * les paires reellement declarees. Changer un hexadecimal sans verifier ce
 * qu'il devient sur les fonds ou il est pose fait donc echouer la suite, ce qui
 * est exactement la faute que ce fichier existe pour attraper.
 *
 * Le chemin est relatif a la racine, comme dans `homeSections.test.ts` : les
 * tests sont lances depuis le dossier du projet.
 */
const CSS = readFileSync("src/app/globals.css", "utf8");

/** Bloc `:root` seul : le bloc `.dark` porte d'autres valeurs pour les memes noms. */
function jetonsDeRacine(): Map<string, string> {
  const bloc = CSS.match(/:root\s*\{([\s\S]*?)\n\}/);
  assert.ok(bloc, "bloc :root introuvable dans globals.css");

  const jetons = new Map<string, string>();
  for (const ligne of bloc[1].split(/\r?\n/)) {
    const m = ligne.match(/^\s*--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/);
    if (m) jetons.set(m[1], m[2].toLowerCase());
  }
  return jetons;
}

const JETONS = jetonsDeRacine();

function canaux(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16));
  return [r, g, b];
}

function luminance(hex: string): number {
  const [r, g, b] = canaux(hex).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
}

/** Aplat equivalent d'une couleur posee a `part` d'opacite sur un fond. */
function melange(couleur: string, fond: string, part: number): string {
  const [c, f] = [canaux(couleur), canaux(fond)];
  return (
    "#" +
    c
      .map((v, i) => Math.round(v * part + f[i] * (1 - part)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function jeton(nom: string): string {
  const valeur = JETONS.get(nom);
  assert.ok(valeur, `--${nom} absent de :root ou declare autrement qu'en hexadecimal`);
  return valeur;
}

/** Seuil WCAG AA pour du texte de taille courante. */
const TEXTE = 4.5;
/** Seuil WCAG 1.4.11 pour le pourtour d'un controle d'interface. */
const CONTROLE = 3;

function verifie(encre: string, fond: string, seuil: number) {
  const valeur = contraste(jeton(encre), jeton(fond));
  assert.ok(
    valeur >= seuil,
    `--${encre} sur --${fond} : ${valeur.toFixed(2)}:1, il en faut ${seuil}:1`,
  );
}

describe("palette : texte sur les fonds clairs", () => {
  it("pose le texte principal et secondaire au-dessus du seuil", () => {
    verifie("foreground", "background", TEXTE);
    verifie("muted-foreground", "background", TEXTE);
    verifie("muted-foreground", "muted", TEXTE);
  });

  it("garde le terracotta lisible partout ou il est pose, pas seulement sur blanc", () => {
    // C'est la regression qui a motive le passage de #be5310 a #a8490e :
    // l'ancien tenait sur blanc et tombait des qu'il touchait un fond teinte.
    verifie("primary", "background", TEXTE);
    verifie("primary", "muted", TEXTE);
    verifie("primary", "accent", TEXTE);
  });

  it("garde le terracotta lisible sur ses propres teintes", () => {
    // Les pastilles de la fiche produit posent le texte primary sur un fond
    // primary a faible opacite : le fond n'est pas blanc, le seuil s'y applique.
    const primary = jeton("primary");
    for (const part of [0.08, 0.1, 0.15]) {
      const fond = melange(primary, jeton("background"), part);
      const valeur = contraste(primary, fond);
      assert.ok(
        valeur >= TEXTE,
        `--primary sur bg-primary/${part * 100} (${fond}) : ${valeur.toFixed(2)}:1`,
      );
    }
  });
});

describe("palette : surfaces sombres", () => {
  it("porte le blanc sur le marine, l'en-tete et le pied de page", () => {
    verifie("secondary-foreground", "secondary", TEXTE);
    verifie("secondary-foreground", "secondary-soft", TEXTE);
    verifie("footer-foreground", "footer", TEXTE);
    verifie("footer-foreground", "header", TEXTE);
  });

  it("garde l'orange lisible sur l'en-tete, y compris translucide", () => {
    // L'en-tete est colle en haut et defile au-dessus de pages claires : son
    // aplat laisse passer ce qui se trouve dessous. Le pire cas est donc une
    // page blanche vue au travers, et non l'aplat plein. L'orange y porte le
    // mot de marque et l'etat de survol des liens : il doit tenir le seuil de
    // texte, ce qui a impose de remonter l'opacite de 80 a 90 %.
    const OPACITE_MIN = 0.9;
    const fond = melange(jeton("header"), jeton("background"), OPACITE_MIN);
    const valeur = contraste(jeton("signal"), fond);
    assert.ok(
      valeur >= TEXTE,
      `--signal sur l'en-tete a ${OPACITE_MIN * 100} % au-dessus d'une page blanche (${fond}) : ${valeur.toFixed(2)}:1`,
    );
  });

  it("reserve l'orange vif au marine, ou il tient", () => {
    verifie("signal", "secondary", TEXTE);
  });

  it("rappelle que l'orange vif ne tient pas sur blanc", () => {
    // La palette documente cette limite : ce test la rend opposable. Si un jour
    // --signal devient lisible sur blanc, la regle de pose peut etre relachee,
    // et c'est ce test qui doit le signaler.
    const valeur = contraste(jeton("signal"), jeton("background"));
    assert.ok(
      valeur < TEXTE,
      `--signal atteint ${valeur.toFixed(2)}:1 sur blanc : la regle de pose documentee dans globals.css est a revoir`,
    );
  });
});

describe("palette : couleurs semantiques", () => {
  it("rend le vert de succes lisible, teintes comprises", () => {
    verifie("success", "background", TEXTE);
    verifie("success-foreground", "success", TEXTE);

    // Les encarts de succes posent le texte sur bg-success a faible opacite.
    const success = jeton("success");
    for (const part of [0.05, 0.1, 0.15]) {
      const fond = melange(success, jeton("background"), part);
      const valeur = contraste(success, fond);
      assert.ok(
        valeur >= TEXTE,
        `--success sur bg-success/${part * 100} (${fond}) : ${valeur.toFixed(2)}:1`,
      );
    }
  });

  it("garde le rouge et le badge lisibles", () => {
    verifie("sale-foreground", "sale", TEXTE);
    verifie("badge-foreground", "badge", TEXTE);
  });
});

describe("palette : pourtour des controles", () => {
  it("detache le contour des champs du filet des cartes", () => {
    // --border reste doux pour les cartes ; --input doit se reperer.
    verifie("input", "background", CONTROLE);
    assert.notEqual(
      jeton("input"),
      jeton("border"),
      "--input a repris la valeur de --border : les champs redeviennent sans contour visible",
    );
  });
});
