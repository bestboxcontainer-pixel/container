import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Boxes,
  Building2,
  Clock,
  Leaf,
  MapPin,
  Package,
  ShieldCheck,
  Ship,
  ShowerHead,
  Sparkles,
  TreePine,
  Truck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PhotoHeroCarousel, type PhotoSlide } from "@/components/PhotoHeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryPages } from "@/server/store";
import type { Product } from "@/types/home";

export const metadata: Metadata = {
  title: "BBC Best Box Containerhandel e.K. | Container kaufen & mieten",
  description:
    "Lager-, Büro-, Wohn- und Sanitärcontainer, neu und gebraucht. Verkauf und Vermietung, Lieferung deutschlandweit.",
};

const STATS = [
  { value: "500+", label: "Container im Bestand" },
  { value: "Bundesweit", label: "Lieferung & Aufstellung" },
  { value: "Kauf & Miete", label: "Flexible Modelle" },
  { value: "Persönlich", label: "Beratung vor Ort" },
] as const;

/** Faits vérifiables sur l'entreprise (voir COMPANY.registeredSince = 2006). */
const TRUST_FACTS = [
  "Seit 2006 am Markt",
  "Inhabergeführtes Unternehmen",
  "500+ Container im Bestand",
  "Neu & geprüft gebraucht",
  "Lieferung deutschlandweit",
  "Persönliche Beratung",
] as const;

/**
 * Echte Fotos (keine KI-Bilder) unter freier Lizenz von Wikimedia Commons,
 * siehe Bildnachweis auf der Impressum-Seite für Quelle/Lizenz je Bild.
 */
const HERO_PHOTOS: readonly PhotoSlide[] = [
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403193/bbc-best-box/site/hero-port-1-8hwmc1.jpg",
    alt: "Stapel von Frachtcontainern im Hafen",
  },
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403201/bbc-best-box/site/hero-rotterdam-2-vnmxx4.jpg",
    alt: "Containerstapel im Hafen Rotterdam",
  },
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403212/bbc-best-box/site/hero-hamburg-3-xgx1wi.jpg",
    alt: "Luftaufnahme des Container-Terminals im Hafen Hamburg",
  },
] as const;

/**
 * Design-Linien: eigene Namen und Texte, keine Übernahme von Konzepten
 * Dritter. Fotos wiederverwendet aus HERO/„Unsere Container“-Bestand (siehe
 * Bildnachweis im Impressum): für jede Linie ein eigenes Foto liegt (noch)
 * nicht vor.
 */
const DESIGN_LINES = [
  {
    id: "mattschwarz",
    icon: Package,
    title: "Mattschwarz",
    text: "Container in mattschwarzer RAL-Lackierung: moderner, zurückhaltender Auftritt für Firmengelände und Baustelle.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403217/bbc-best-box/site/gallery-modulbau-de-1eyg37.jpg",
  },
  {
    id: "naturholz",
    icon: Leaf,
    title: "Naturholz",
    text: "Fassaden- oder Innenverkleidung aus Holz für eine warme, natürliche Optik.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403228/bbc-best-box/site/gallery-wohnwerte-de-dw1h24.jpg",
  },
  {
    id: "premiumholz",
    icon: TreePine,
    title: "Premium-Holz",
    text: "Hochwertige Holzverkleidung mit feinerer Oberfläche und langlebigem Wetterschutz.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403228/bbc-best-box/site/gallery-wohnwerte-de-dw1h24.jpg",
  },
  {
    id: "verglast",
    icon: Sparkles,
    title: "Verglast",
    text: "Großzügige Fensterfronten für lichtdurchflutete Räume, ideal für Empfang, Verkauf oder Büro.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403222/bbc-best-box/site/gallery-office-de-rnnl7b.jpg",
  },
  {
    id: "modular",
    icon: Building2,
    title: "Modular",
    text: "Einzeln oder als mehrgeschossige Anlage kombinierbar, flexibel erweiterbar nach Bedarf.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403217/bbc-best-box/site/gallery-modulbau-de-1eyg37.jpg",
  },
  {
    id: "wc-duschen",
    icon: ShowerHead,
    title: "WC & Duschen",
    text: "Voll ausgestattete Sanitärcontainer mit WC-, Dusch- und Waschbereich.",
    photo: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403228/bbc-best-box/site/gallery-wohnwerte-de-dw1h24.jpg",
  },
] as const;

const CATEGORIES = [
  {
    id: "seecontainer",
    icon: Ship,
    title: "Seecontainer",
    text: "Robuste ISO-Container für Transport und Lagerung, neu und geprüft gebraucht.",
  },
  {
    id: "lagercontainer",
    icon: Boxes,
    title: "Lagercontainer",
    text: "Wetterfeste Container zur sicheren Lagerung von Material, Werkzeug und Waren.",
  },
  {
    id: "buerocontainer",
    icon: Building2,
    title: "Bürocontainer",
    text: "Einzel- und Mehrfachanlagen als mobiles Büro auf der Baustelle oder im Betrieb.",
  },
  {
    id: "sanitaercontainer",
    icon: ShowerHead,
    title: "Sanitärcontainer",
    text: "WC-, Dusch- und Waschcontainer für Baustellen, Events und Betriebsgelände.",
  },
  {
    id: "sondercontainer",
    icon: Truck,
    title: "Sondercontainer",
    text: "Individuelle Umbauten und Sonderanfertigungen nach Ihren Maßen und Anforderungen.",
  },
] as const;

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Geprüfte Qualität",
    text: "Jeder Container wird vor der Auslieferung technisch geprüft, neu wie gebraucht.",
  },
  {
    icon: Clock,
    title: "Schnelle Verfügbarkeit",
    text: "Großer Bestand am Lager: kurze Lieferzeiten statt langer Wartezeit auf Bestellung.",
  },
  {
    icon: MapPin,
    title: "Lieferung deutschlandweit",
    text: "Anlieferung und Aufstellung direkt auf Ihrem Gelände, organisiert aus einer Hand.",
  },
] as const;

const STEPS = [
  { step: "1", title: "Anfrage stellen", text: "Container-Typ, Maße und Einsatzort schildern: per Telefon, E-Mail oder Formular." },
  { step: "2", title: "Angebot erhalten", text: "Wir prüfen Verfügbarkeit und Zustand und melden uns mit einem passenden Angebot." },
  { step: "3", title: "Liefern lassen", text: "Nach Zusage liefern wir termingerecht und stellen den Container bei Ihnen auf." },
] as const;

/**
 * Extrait du catalogue pour la page d'accueil.
 *
 * Prélèvement à tour de rôle plutôt que les huit premiers : le catalogue est
 * trié par catégorie, et une simple troncature ne montrerait que des
 * Lagercontainer. On fait donc un tour par catégorie avant d'en reprendre une.
 */
async function extraitDuCatalogue(maximum = 8): Promise<Product[]> {
  const pages = await getCategoryPages();
  const files = pages.map((page) => [...page.products]).filter((file) => file.length > 0);

  const extrait: Product[] = [];
  for (let rang = 0; extrait.length < maximum; rang += 1) {
    const restantes = files.filter((file) => file.length > rang);
    if (restantes.length === 0) break;
    for (const file of restantes) {
      if (extrait.length >= maximum) break;
      extrait.push(file[rang]);
    }
  }

  return extrait;
}

export default async function HomePage() {
  const produits = await extraitDuCatalogue();

  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <PhotoHeroCarousel slides={HERO_PHOTOS} />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />

          <div className="relative z-10 mx-auto grid max-w-screen-xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
                Container kaufen und mieten: schnell, zuverlässig, deutschlandweit
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
                BBC Best Box Containerhandel beliefert Gewerbe, Baustellen und Privatkunden mit
                Lager-, Büro-, Wohn- und Sanitärcontainern: neu und gebraucht, aus eigenem
                Bestand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sortiment"
                  className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-bold text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
                >
                  Sortiment ansehen
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10"
                >
                  Unverbindlich anfragen
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-lg backdrop-blur-md">
              <div className="grid grid-cols-2 gap-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sortiment */}
        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Container-Kategorien</h2>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/sortiment#${category.id}`}
                  className="flex w-36 shrink-0 flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md sm:w-40"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-secondary">
                    <category.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{category.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bandeau de confiance défilant : faits vérifiables sur l'entreprise */}
        <section className="overflow-hidden border-y border-white/10 bg-secondary py-4">
          <div className="flex w-max animate-[defilement_28s_linear_infinite]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-10 pr-10">
                {TRUST_FACTS.map((fact) => (
                  <span
                    key={`${copy}-${fact}`}
                    className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-white/85"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
                    {fact}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Unsere Container */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Unsere Container</h2>
          <p className="mt-3 max-w-xl text-foreground/70">
            Entdecken Sie unsere hochwertigen Design-Linien für jeden Bedarf, alle Varianten auf
            einen Blick.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DESIGN_LINES.map((line) => (
              <div
                key={line.id}
                className="overflow-hidden rounded-2xl bg-secondary text-secondary-foreground shadow-sm"
              >
                <div className="relative aspect-video">
                  <Image
                    src={line.photo}
                    alt={`${line.title}, Beispielcontainer`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    {line.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{line.text}</p>
                  <Link
                    href="/sortiment"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-signal px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
                  >
                    Produkte ansehen
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verfügbare Container : lecture réelle du catalogue, pas une liste
            écrite en dur. La section disparaît si le catalogue est vide, plutôt
            que d'afficher une grille creuse. */}
        {produits.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                    Verfügbare Container
                  </h2>
                  <p className="mt-3 max-w-xl text-foreground/70">
                    Ein Auszug aus dem Bestand, quer durch alle Kategorien. Maße, Zustandsklasse
                    und Preis stehen auf der jeweiligen Detailseite.
                  </p>
                </div>
                <Link
                  href="/sortiment"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Ganzes Sortiment
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {produits.map((produit) => (
                  <ProductCard key={produit.slug ?? produit.name} product={produit} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Ablauf */}
        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Wie läuft die Lieferung ab?</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-y border-white/10 bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Bereit für Ihren Container?
              </h2>
              <p className="mt-2 text-white/75">
                Sprechen Sie mit uns: wir finden die passende Lösung für Ihr Projekt.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
            >
              Jetzt Kontakt aufnehmen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Warum wir */}
        <section className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Warum BBC Best Box</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-border bg-muted p-5">
                <benefit.icon className="h-7 w-7 text-primary" aria-hidden />
                <h3 className="mt-4 font-bold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
