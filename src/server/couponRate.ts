/**
 * Limitation des essais de codes de réduction.
 *
 * Sans elle, la vérification devient un banc d'essai : on y enchaîne les codes
 * jusqu'à en trouver un qui réponde « ok ». Les codes courts et devinables
 * SOMMER20, WELCOME10 : tombent en quelques minutes.
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
 * Sert de garde-fou mémoire, pas de politique : au-delà, on refuse d'ouvrir un
 * nouveau compteur plutôt que d'en effacer un qui court encore.
 */
const APPELANTS_MAX = 10_000;

/** Intervalle minimal entre deux purges complètes. */
const PURGE_MS = 30_000;

/**
 * Nombre de relais de confiance placés devant l'application.
 *
 * Un derrière Nginx ou Passenger, ce qui est le cas en production. Zéro si
 * l'application est jointe en direct : l'en-tête n'est alors plus qu'une
 * déclaration du client, et cette valeur le dit.
 *
 * Ce réglage n'est pas une commodité : sans lui, il suffirait d'envoyer un
 * `x-forwarded-for` de son cru pour se donner l'identité que l'on veut, autant
 * de fois qu'on le souhaite.
 */
const SAUTS_DE_CONFIANCE = (() => {
  const brut = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
  return Number.isFinite(brut) && brut >= 0 ? brut : 1;
})();

interface Compteur {
  essais: number;
  depuis: number;
}

const compteurs = new Map<string, Compteur>();
let dernierePurge = 0;

/** Retire les compteurs échus. Appelée à intervalle, et avant tout refus. */
function purger(maintenant: number, forcer = false): void {
  if (!forcer && maintenant - dernierePurge < PURGE_MS) return;
  dernierePurge = maintenant;

  for (const [cle, compteur] of compteurs) {
    if (maintenant - compteur.depuis > FENETRE_MS) compteurs.delete(cle);
  }
}

/**
 * Adresse de l'appelant, ou null si aucune ne peut être tenue pour fiable.
 *
 * `x-forwarded-for` est une liste que chaque relais complète en ajoutant à
 * droite l'adresse dont il a reçu la requête. Les entrées de gauche viennent du
 * client et valent ce qu'il a bien voulu écrire ; seules les dernières ont été
 * posées par nos propres relais. On saute donc exactement le nombre de relais
 * connus : ni plus, ce qui reviendrait à croire le client, ni moins, ce qui
 * confondrait tous les visiteurs derrière l'adresse du relais.
 *
 * Une liste trop courte pour ce compte signale une requête qui n'a pas traversé
 * les relais attendus : on préfère alors n'avoir aucune identité qu'une
 * mauvaise.
 */
export function identifiantAppelant(headers: Headers): string | null {
  if (SAUTS_DE_CONFIANCE === 0) {
    // Aucun relais devant nous : l'en-tête ne prouve rien, et l'exécution de
    // Next ne donne pas accès à l'adresse de la connexion depuis une route.
    return null;
  }

  const chaine = headers.get("x-forwarded-for");
  if (!chaine) return null;

  const relais = chaine
    .split(",")
    .map((entree) => entree.trim())
    .filter(Boolean);

  const index = relais.length - SAUTS_DE_CONFIANCE;
  if (index < 0) return null;

  return relais[index] ?? null;
}

/**
 * Enregistre un essai et dit s'il est permis.
 *
 * `portee` sépare les compteurs de deux chemins : un client qui a épuisé ses
 * essais de vérification doit encore pouvoir passer commande.
 *
 * `siInconnu` décide du sort d'un appelant sans identité fiable. Sur la
 * vérification, on refuse : cette route n'existe que pour essayer des codes, et
 * la fermer ne coûte rien d'autre. Sur la commande, on laisse passer : bloquer
 * une vente pour une identité manquante coûterait bien plus qu'un essai de
 * coupon supplémentaire.
 */
export function checkCouponRate(
  cle: string | null,
  portee: "verification" | "commande",
  siInconnu: "refuser" | "laisser-passer",
): { allowed: boolean; retryAfterSeconds: number } {
  if (cle === null) {
    return siInconnu === "refuser"
      ? { allowed: false, retryAfterSeconds: 60 }
      : { allowed: true, retryAfterSeconds: 0 };
  }

  const maintenant = Date.now();
  purger(maintenant);

  const identite = `${portee}:${cle}`;
  const compteur = compteurs.get(identite);

  if (compteur && maintenant - compteur.depuis <= FENETRE_MS) {
    compteur.essais += 1;
    if (compteur.essais > ESSAIS_PAR_FENETRE) {
      const reste = Math.ceil((FENETRE_MS - (maintenant - compteur.depuis)) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, reste) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  // Nouveau compteur. Si la carte est pleine, on purge d'abord ce qui est échu.
  //
  // Ce qui reste court encore : effacer un compteur vivant pour faire de la
  // place offrirait un contournement : il suffirait de saturer la carte pour
  // effacer le sien et repartir de zéro. On refuse donc le nouvel appelant
  // jusqu'à ce qu'une fenêtre se libère d'elle-même.
  if (compteurs.size >= APPELANTS_MAX) {
    purger(maintenant, true);
    if (compteurs.size >= APPELANTS_MAX) {
      return { allowed: false, retryAfterSeconds: 60 };
    }
  }

  compteurs.set(identite, { essais: 1, depuis: maintenant });
  return { allowed: true, retryAfterSeconds: 0 };
}
