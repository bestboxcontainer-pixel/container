import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Nombre de processus qui composent les pages à la construction du site.
     *
     * Next en ouvre autant que la machine a de cœurs — soixante-trois sur le
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
    // Anciennes adresses citées dans le pied de page et le tunnel d'achat :
    // on les conserve en redirection permanente vers les pages réelles.
    const pairs = [
      ["/widerrufsrecht", "/widerruf"],
      ["/ruecksendung", "/retoure"],
      ["/jobs", "/ueber-uns"],
      ["/presse", "/ueber-uns"],
      ["/partnerprogramm", "/ueber-uns"],
    ];

    return pairs.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `/en${source}`, destination: `/en${destination}`, permanent: true },
    ]);
  },
};

export default withNextIntl(nextConfig);
