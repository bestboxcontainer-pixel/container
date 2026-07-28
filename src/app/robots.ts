import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hausgeratepfeffer.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Back-office, API et tunnel d'achat n'ont rien à faire dans l'index
        disallow: ["/admin", "/api", "/warenkorb", "/kasse", "/bestellung", "/en/warenkorb", "/en/kasse", "/en/bestellung"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
