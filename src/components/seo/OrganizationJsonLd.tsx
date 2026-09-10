import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { COMPANY } from "@/content/legal";
import { MERCHANT_COUNTRY, MERCHANT_LANGUAGE, SHOP_NAME, SHOP_PHONE, siteUrl } from "@/server/merchant";

// Balisage Organization + WebSite du site.
//
// Google s'en sert pour rattacher la boutique à une entité connue : c'est l'un des
// signaux qui évitent la mention « Irreführende Informationen » et qui accélèrent la
// validation d'un compte Merchant Center récent.
//
// À placer une seule fois, dans la mise en page racine ou sur la page d'accueil.

// Zone de livraison réelle : Allemagne et Autriche (le siège reste en DE, voir
// MERCHANT_COUNTRY pour l'adresse et le pays d'expédition du flux).
const AREA_SERVED = ["DE", "AT"];

// Horaires réels du service client, cités en prose à plusieurs endroits
// (Kontakt, FAQ, Impressum) : « montags bis freitags von 8 bis 18 Uhr ».
// Reproduits ici sous forme structurée pour le balisage uniquement.
const OPENING_HOURS = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "08:00",
  closes: "18:00",
};

// Coordonnées du siège (Petersweg 11a, 22946 Großensee), géocodées depuis
// l'adresse de l'Impressum via Nominatim/OpenStreetMap. Précision au niveau
// de la rue : à ajuster si un relevé plus précis est disponible.
const SIEGE_GEO = {
  "@type": "GeoCoordinates",
  latitude: 53.6093404,
  longitude: 10.3442712,
};

interface OrganizationJsonLdProps {
  /** Profils officiels de la boutique : renforce l'identification de l'entité. */
  sameAs?: string[];
  /**
   * Adresse postale du siège. Par défaut celle de l'Impressum : Google compare
   * le balisage et la page, et une entité sans adresse est plus difficile à
   * rattacher : c'est l'un des signaux qui accélèrent la validation d'un compte
   * Merchant Center. La renseigner à la main ne servirait qu'à la faire diverger.
   */
  address?: {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
  };
}

const ADRESSE_SIEGE = {
  streetAddress: COMPANY.street,
  postalCode: COMPANY.postalCode,
  addressLocality: COMPANY.locality,
};

export function OrganizationJsonLd({ sameAs, address = ADRESSE_SIEGE }: OrganizationJsonLdProps) {
  const base = siteUrl();

  const organization: Record<string, JsonLdValue | undefined> = {
    // Tableau de types plutôt qu'un second nœud : la boutique en ligne et le
    // dépôt physique sont la même entité juridique, pas deux entités liées.
    // `Store` (sous-type de LocalBusiness) porte les horaires et la géoloc.
    "@type": ["OnlineStore", "Store"],
    "@id": `${base}#organization`,
    name: SHOP_NAME,
    // La raison sociale complète, distincte du nom commercial : c'est elle qui
    // figure dans l'Impressum, et la faire correspondre aide Google à rattacher
    // la boutique à une entité réelle.
    legalName: COMPANY.name,
    url: base,
    logo: `${base}/images/logo-icon.png`,
    image: `${base}/seo/og-image.png`,
    telephone: SHOP_PHONE,
    areaServed: AREA_SERVED,
    openingHoursSpecification: OPENING_HOURS,
    geo: SIEGE_GEO,
    // Fait déjà public sur l'Impressum et /ueber-uns : relier l'inhaber donne
    // un signal d'expertise/responsabilité (E-E-A-T) que l'entité seule ne porte pas.
    founder: { "@id": `${base}#inhaber` },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SHOP_PHONE,
      contactType: "customer service",
      areaServed: AREA_SERVED,
      availableLanguage: [MERCHANT_LANGUAGE, "en"],
    },
    sameAs: sameAs && sameAs.length > 0 ? sameAs : undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address.streetAddress,
          postalCode: address.postalCode,
          addressLocality: address.addressLocality,
          addressCountry: MERCHANT_COUNTRY,
        }
      : undefined,
  };

  // Personne physique responsable, distincte de l'entité juridique : c'est ce
  // que l'Impressum désigne comme le représentant légal (§ 5 TMG), pas une
  // fiche marketing. Un eingetragener Kaufmann répond personnellement et sans
  // limite, c'est un fait, pas une formule.
  const inhaber: Record<string, JsonLdValue | undefined> = {
    "@type": "Person",
    "@id": `${base}#inhaber`,
    name: COMPANY.owner,
    jobTitle: "Inhaber",
    worksFor: { "@id": `${base}#organization` },
  };

  const website: Record<string, JsonLdValue | undefined> = {
    "@type": "WebSite",
    "@id": `${base}#website`,
    name: SHOP_NAME,
    url: base,
    inLanguage: MERCHANT_LANGUAGE,
    publisher: { "@id": `${base}#organization` },
    // Rend la boutique éligible à la sitelinks search box : Google peut alors
    // afficher un champ de recherche sous le résultat de marque. La cible pointe
    // sur /suche?q= de la langue par défaut (l'allemand vit à la racine).
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/suche?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [organization, inhaber, website],
      }}
    />
  );
}
