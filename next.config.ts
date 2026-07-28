import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
