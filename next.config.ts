import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Nombre de processus qui composent les pages à la construction du site.
     *
     * Next en ouvre autant que la machine a de cœurs, soixante-trois sur le
     * serveur de mise en ligne. Chacun ouvre sa propre connexion à la base :
     * une rafale de requêtes simultanées à chaque déploiement, sur une base
     * distante facturée au volume transféré. C'est ce qui a épuisé le quota et
     * arrêté la boutique.
     *
     * Quatre suffisent : la construction dure un peu plus longtemps, mais la
     * base n'est plus prise d'assaut, et le temps gagné par la mise en ligne
     * ne valait pas le prix du transfert.
     */
    cpus: 4,
  },

  images: {
    // Les visuels produits sont hébergés chez Cloudinary ; le chemin reste
    // restreint à un dossier du compte pour éviter de servir n'importe quoi.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    /**
     * Le site n'a qu'un hôte : bestboxcontainer.de.
     *
     * Sans cette règle, « www » répond lui aussi en 200 et sert le catalogue
     * entier une seconde fois. Les balises canoniques limitent la casse pour
     * l'indexation, mais Merchant Center rattache un compte à un domaine
     * vérifié, et le flux ne désigne que la forme sans « www » : deux hôtes qui
     * répondent, c'est une revendication qui hésite et un budget d'exploration
     * dépensé deux fois pour les mêmes pages.
     */
    const hostCanonique = [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.bestboxcontainer.de" }],
        destination: "https://bestboxcontainer.de/:path*",
        permanent: true,
      },
    ];

    // Anciennes adresses citées dans le pied de page et le tunnel d'achat :
    // on les conserve en redirection permanente vers les pages réelles.
    const pairs = [
      // « /sortiment » présentait les cinq familles sous forme d'ancres sur une
      // page de texte, sans un seul conteneur à cliquer. Les pages de catégorie
      // font le travail. L'ancre n'atteint jamais le serveur : un ancien lien
      // « /sortiment#seecontainer » arrive donc sur la grille des catégories.
      ["/sortiment", "/container"],
      ["/widerrufsrecht", "/widerruf"],
      ["/ruecksendung", "/retoure"],
      ["/jobs", "/ueber-uns"],
      ["/presse", "/ueber-uns"],
      ["/partnerprogramm", "/ueber-uns"],

      // Slugs de fiches produit corrigés (2026-09) : les umlauts étaient
      // tronqués (« ü » → « u ») plutôt que développés (« ü » → « ue ») comme
      // le veut src/lib/slugify.ts, et une fiche portait le slug généré à
      // partir d'un nom bien plus long qu'elle a eu par la suite. Les anciennes
      // adresses restent citées par Merchant Center et les résultats déjà
      // indexés : elles redirigent vers la fiche réelle plutôt que de répondre
      // 404.
      ["/container/sondercontainer/20-fuss-versandcontainer-mit-seitlicher-offnung-gebraucht", "/container/sondercontainer/20-fuss-versandcontainer-mit-seitlicher-oeffnung-gebraucht"],
      ["/container/buerocontainer/20-fuss-burocontainer-mit-bad-ref-1101", "/container/buerocontainer/20-fuss-buerocontainer-mit-bad-ref-1101"],
      ["/container/buerocontainer/6x3-burocontainer", "/container/buerocontainer/6x3-buerocontainer"],
      ["/container/sanitaercontainer/sanitarcontainer-mit-dusche-wc-und-urinal", "/container/sanitaercontainer/sanitaercontainer-mit-dusche-wc-und-urinal"],
      ["/container/sanitaercontainer/sanitarblock-s1-mit-wc-und-waschbecken", "/container/sanitaercontainer/sanitaerblock-s1-mit-wc-und-waschbecken"],
      ["/container/sondercontainer/big-cube-vertikal-nero", "/container/sondercontainer/container-vitree-premium"],
      ["/container/sanitaercontainer/sanitareinheit-reinigungseinheit-1-platz", "/container/sanitaercontainer/sanitaereinheit-reinigungseinheit-1-platz"],
      ["/container/lagercontainer/lagercontainer-2-2-meter-mit-doppeltur", "/container/lagercontainer/lagercontainer-2-2-meter-mit-doppeltuer"],
      ["/container/sanitaercontainer/doppelter-sanitarcontainer-mit-weissem-abfalltank", "/container/sanitaercontainer/doppelter-sanitaercontainer-mit-weissem-abfalltank"],
      ["/container/sanitaercontainer/doppelter-sanitarcontainer-mit-abfalltank", "/container/sanitaercontainer/doppelter-sanitaercontainer-mit-abfalltank"],
      ["/container/sondercontainer/40-fuss-hc-container-mit-4-seitenturen-gebraucht", "/container/sondercontainer/40-fuss-hc-container-mit-4-seitentueren-gebraucht"],
      ["/container/sondercontainer/40-fuss-hc-containereinheit-vollstandig-ausgestattet-neu", "/container/sondercontainer/40-fuss-hc-containereinheit-vollstaendig-ausgestattet-neu"],
      ["/container/sondercontainer/40-fuss-seecontainer-mit-seitenoffnung", "/container/sondercontainer/40-fuss-seecontainer-mit-seitenoeffnung"],
      ["/container/buerocontainer/20-fuss-seecontainer-buro-c7510", "/container/buerocontainer/20-fuss-seecontainer-buero-c7510"],
      ["/container/buerocontainer/burocontainer-6-x-2-40-holzfarbe", "/container/buerocontainer/buerocontainer-6-x-2-40-holzfarbe"],
      ["/container/buerocontainer/burocontainer-6-00-x-2-40-m-mit-toilette-dusche-und-kuche", "/container/buerocontainer/buerocontainer-6-00-x-2-40-m-mit-toilette-dusche-und-kueche"],
      ["/container/buerocontainer/burocontainer-mit-jalousien-6-x-2-4-m", "/container/buerocontainer/buerocontainer-mit-jalousien-6-x-2-4-m"],
      ["/container/buerocontainer/dali-modulares-projekt-24-m-ref-11900-dali-modularprojekt-8-x-3-0-m-24-m-wohnflache-offener-grundriss", "/container/buerocontainer/dali-modulares-projekt-24-m-ref-11900"],
      ["/container/buerocontainer/premium-modulcontainer-ideal-fur-moderne-unternehmen-ref-c4100", "/container/buerocontainer/premium-modulcontainer-ideal-fuer-moderne-unternehmen-ref-c4100"],
      ["/container/buerocontainer/standard-burocontainer-6-00-x-2-43-m", "/container/buerocontainer/standard-buerocontainer-6-00-x-2-43-m"],
      ["/container/buerocontainer/mobiler-burocontainer-mit-panoramafenstern-ref-c3301", "/container/buerocontainer/mobiler-buerocontainer-mit-panoramafenstern-ref-c3301"],
      ["/container/buerocontainer/wohn-buroeinheit-von-24-m-ref-42290", "/container/buerocontainer/wohn-bueroeinheit-von-24-m-ref-42290"],
      ["/container/buerocontainer/5x2-20-burocontainer-mit-toilette", "/container/buerocontainer/5x2-20-buerocontainer-mit-toilette"],
      ["/container/sondercontainer/40-fuss-seecontainer-mit-seitenoffnung-variante-2", "/container/sondercontainer/40-fuss-seecontainer-mit-seitenoeffnung-variante-2"],
      ["/container/sanitaercontainer/sanitarcontainer-mini-toilette", "/container/sanitaercontainer/sanitaercontainer-mini-toilette"],
      ["/container/sanitaercontainer/sanitarcontainer-2-00-x-2-00-m-mit-toilette-und-urinar", "/container/sanitaercontainer/sanitaercontainer-2-00-x-2-00-m-mit-toilette-und-urinar"],
      ["/container/buerocontainer/burocontainer-3-50-2-20-ref-2351", "/container/buerocontainer/buerocontainer-3-50-2-20-ref-2351"],
      ["/container/seecontainer/10-fuss-kuhlcontainer-fur-den-inlandsbereich-neu", "/container/seecontainer/10-fuss-kuehlcontainer-fuer-den-inlandsbereich-neu"],
      ["/container/sondercontainer/40-fuss-hc-container-mit-seitenoffnungen", "/container/sondercontainer/40-fuss-hc-container-mit-seitenoeffnungen"],
      ["/container/sondercontainer/20-fuss-hc-container-mit-doppelturen", "/container/sondercontainer/20-fuss-hc-container-mit-doppeltueren"],
    ];

    return [
      ...hostCanonique,
      ...pairs.flatMap(([source, destination]) => [
        { source, destination, permanent: true },
        { source: `/en${source}`, destination: `/en${destination}`, permanent: true },
      ]),
    ];
  },
};

export default withNextIntl(nextConfig);
