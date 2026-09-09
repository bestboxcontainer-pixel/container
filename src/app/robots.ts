import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestboxcontainer.de";

// Toute la vitrine est explorable ; seuls le back-office et les routes
// d'API restent exclus. Le flux Merchant (/feed/…) n'est pas listé ici :
// il porte son propre en-tête `X-Robots-Tag: noindex` et n'a pas à être
// bloqué, Merchant Center doit pouvoir le récupérer.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
