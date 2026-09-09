import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
});

// `NEXT_PUBLIC_SITE_URL` sans schéma (ex. « bestboxcontainer.de » au lieu de
// « https://bestboxcontainer.de », déjà vu sur un panneau d'hébergeur) ferait
// planter `new URL()` ci-dessous et casserait le build entier : le schéma est
// donc rétabli ici plutôt que supposé présent.
const SITE_URL_BRUT = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestboxcontainer.de";
const SITE_URL = (
  /^https?:\/\//.test(SITE_URL_BRUT) ? SITE_URL_BRUT : `https://${SITE_URL_BRUT}`
).replace(/\/+$/, "");

const TITLE = "BBC Best Box Containerhandel e.K.";
const DESCRIPTION = "BBC Best Box Containerhandel e.K., Petersweg 11a, 22946 Großensee.";

export const metadata: Metadata = {
  // Nécessaire pour que les images Open Graph données en chemin relatif
  // (ex. "/seo/og-image.png") se résolvent en URL absolue : Facebook,
  // WhatsApp et consorts n'acceptent que des URL complètes.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Filet de sécurité si une page ne définit pas son propre bloc social ;
  // chaque page publique le fait déjà via generateMetadata.
  openGraph: {
    type: "website",
    siteName: "BBC Best Box Containerhandel e.K.",
    title: TITLE,
    description: DESCRIPTION,
    locale: "de_DE",
    images: [{ url: "/seo/og-image.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/seo/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // La langue vient du routage pour la boutique ; le back-office, hors
  // middleware, retombe sur la langue par défaut (allemand).
  const locale = await getLocale();

  // suppressHydrationWarning ne porte que sur <html> : les extensions de
  // navigateur y posent leurs propres attributs (data-qb-installed, thèmes
  // sombres, gestionnaires de mots de passe…) avant que React ne s'hydrate.
  // L'écart est alors inévitable et sans conséquence ; la vérification reste
  // entière pour tout le contenu de la page.
  return (
    <html
      lang={locale}
      className={`${lato.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
