/**
 * Limitation des essais de codes de réduction.
 *
 * Sans elle, la vérification devient un banc d'essai : on y enchaîne les codes
 * jusqu'à en trouver un qui réponde « ok ». Les codes courts et devinables —
 * SOMMER20, WELCOME10 — tombent en quelques minutes.
 *
 * Le compteur vit en mémoire, comme celui des connexions administrateur : un
 * redémarrage le remet à zéro, ce qui est acceptable pour ralentir une
 * exploration sans monter une table de plus.
 */

const FENETRE_MS = 60_000;
const ESSAIS_PAR_FENETRE = 10;

/**
 * Nombre maximal d'appelants suivis simultanément.
 *
 * Sans plafond, il suffirait de faire varier son identité à chaque requête pour
 * faire grossir la carte sans fin — la protection contre la devinette
 * deviendrait un moyen d'épuiser la mémoire du serveur. Au-delà, les entrées
 * les plus anciennes cèdent la place.
 */
const APPELANTS_MAX = 10_000;

/** Intervalle minimal entre deux purges complètes. */
const PURGE_MS = 30_000;

interface Compteur {
  essais: number;
  depuis: number;
}

const compteurs = new Map<string, Compteur>();
let dernierePurge = 0;

/**
 * Purge les compteurs échus.
 *
 * Balayer toute la carte à chaque requête ferait payer à chaque visiteur le
 * coût des dizaines de milliers d'entrées laissées par un autre : on ne le fait
 * qu'à intervalle, et la carte reste bornée par ailleurs.
 */
function purger(maintenant: number): void {
  if (maintenant - dernierePurge < PURGE_MS) return;
  dernierePurge = maintenant;

  for (const [cle, compteur] of compteurs) {
    if (maintenant - compteur.depuis > FENETRE_MS) compteurs.delete(cle);
  }
}

/**
 * Identifiant de l'appelant, tiré de ce que le client ne peut pas forger.
 *
 * `x-forwarded-for` est une liste que chaque relais complète en ajoutant à
 * droite l'adresse dont il a reçu la requête. La valeur la plus à gauche vient
 * donc du client lui-même : la prendre reviendrait à laisser chacun choisir son
 * identité, et donc contourner la limitation en changeant un en-tête à chaque
 * essai. C'est la valeur la plus à droite qui a été posée par notre propre
 * relais, et elle seule est digne de foi.
 *
 * Sans en-tête exploitable, tous les appels partagent une même clé : la
 * limitation devient collective plutôt que nulle. C'est volontaire — mieux vaut
 * gêner tout le monde qu'ouvrir la porte à qui n'envoie aucun en-tête.
 */
export function identifiantAppelant(headers: Headers): string {
  const chaine = headers.get("x-forwarded-for");
  if (chaine) {
    const relais = chaine
      .split(",")
      .map((entree) => entree.trim())
      .filter(Boolean);
    const dernier = relais.at(-1);
    if (dernier) return dernier;
  }

  const direct = headers.get("x-real-ip")?.trim();
  if (direct) return direct;

  return "sans-identifiant";
}

/**
 * Enregistre un essai et dit s'il est permis.
 *
 * `portee` sépare les compteurs de deux chemins différents : un client qui
 * atteint sa limite en vérifiant des codes doit encore pouvoir passer commande.
 */
export function checkCouponRate(
  cle: string,
  portee: "verification" | "commande" = "verification",
): { allowed: boolean; retryAfterSeconds: number } {
  const maintenant = Date.now();
  purger(maintenant);

  const identite = `${portee}:${cle}`;
  const compteur = compteurs.get(identite);

  if (!compteur || maintenant - compteur.depuis > FENETRE_MS) {
    // Plafond atteint : on libère la place la plus ancienne. Une carte pleine
    // ne doit jamais empêcher de suivre un nouvel appelant.
    if (compteurs.size >= APPELANTS_MAX) {
      const plusAncienne = compteurs.keys().next();
      if (!plusAncienne.done) compteurs.delete(plusAncienne.value);
    }
    compteurs.set(identite, { essais: 1, depuis: maintenant });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  compteur.essais += 1;
  if (compteur.essais > ESSAIS_PAR_FENETRE) {
    const reste = Math.ceil((FENETRE_MS - (maintenant - compteur.depuis)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, reste) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
