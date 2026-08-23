import type { Metadata } from "next";

// Bloc Open Graph / Twitter Card partagé par les pages publiques. Sans lui,
// un lien partagé sur WhatsApp, Facebook ou X n'affiche ni image ni titre
// juste l'URL brute.

const SITE_NAME = "BBC Best Box Containerhandel e.K.";
const DEFAULT_OG_IMAGE = "/images/logo-full.png";

function ogLocale(locale: string): string {
  return locale === "en" ? "en_US" : "de_DE";
}

export function buildSocialMetadata(params: {
  title: string;
  description: string;
  url: string;
  locale: string;
  image?: string;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = params.image ?? DEFAULT_OG_IMAGE;
  const imageAlt = params.imageAlt ?? params.title;

  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: params.title,
      description: params.description,
      url: params.url,
      locale: ogLocale(params.locale),
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images: [image],
    },
  };
}
