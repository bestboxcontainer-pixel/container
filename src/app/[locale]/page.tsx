import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Boxes,
  Building2,
  Clock,
  Home as HomeIcon,
  Leaf,
  MapPin,
  Package,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  TreePine,
  Truck,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PhotoHeroCarousel, type PhotoSlide } from "@/components/PhotoHeroCarousel";

export const metadata: Metadata = {
  title: "BBC Best Box Containerhandel e.K. — Container kaufen & mieten",
  description:
    "Lager-, Büro-, Wohn- und Sanitärcontainer, neu und gebraucht — Verkauf und Vermietung, Lieferung deutschlandweit.",
};

const STATS = [
  { value: "500+", label: "Container im Bestand" },
  { value: "Bundesweit", label: "Lieferung & Aufstellung" },
  { value: "Kauf & Miete", label: "Flexible Modelle" },
  { value: "Persönlich", label: "Beratung vor Ort" },
] as const;

/**
 * Echte Fotos (keine KI-Bilder) unter freier Lizenz von Wikimedia Commons —
 * siehe Bildnachweis auf der Impressum-Seite für Quelle/Lizenz je Bild.
 */
const HERO_PHOTOS: readonly PhotoSlide[] = [
  { src: "/images/container/hero-port-1.jpg", alt: "Stapel von Frachtcontainern im Hafen" },
  { src: "/images/container/hero-rotterdam-2.jpg", alt: "Containerstapel im Hafen Rotterdam" },
  { src: "/images/container/hero-hamburg-3.jpg", alt: "Luftaufnahme des Container-Terminals im Hafen Hamburg" },
] as const;

/**
 * Design-Linien: eigene Namen und Texte, keine Übernahme von Konzepten
 * Dritter. Fotos wiederverwendet aus HERO/„Unsere Container“-Bestand (siehe
 * Bildnachweis im Impressum) — für jede Linie ein eigenes Foto liegt (noch)
 * nicht vor.
 */
const DESIGN_LINES = [
  {
    id: "mattschwarz",
    icon: Package,
    title: "Mattschwarz",
    text: "Container in mattschwarzer RAL-Lackierung — moderner, zurückhaltender Auftritt für Firmengelände und Baustelle.",
    photo: "/images/container/gallery-modulbau-de.jpg",
  },
  {
    id: "naturholz",
    icon: Leaf,
    title: "Naturholz",
    text: "Fassaden- oder Innenverkleidung aus Holz für eine warme, natürliche Optik.",
    photo: "/images/container/gallery-office-de.jpg",
  },
  {
    id: "premiumholz",
    icon: TreePine,
    title: "Premium-Holz",
    text: "Hochwertige Holzverkleidung mit feinerer Oberfläche und langlebigem Wetterschutz.",
    photo: "/images/container/gallery-wohnwerte-de.jpg",
  },
  {
    id: "verglast",
    icon: Sparkles,
    title: "Verglast",
    text: "Großzügige Fensterfronten für lichtdurchflutete Räume — ideal für Empfang, Verkauf oder Büro.",
    photo: "/images/container/gallery-modulbau-de.jpg",
  },
  {
    id: "modular",
    icon: Building2,
    title: "Modular",
    text: "Einzeln oder als mehrgeschossige Anlage kombinierbar — flexibel erweiterbar nach Bedarf.",
    photo: "/images/container/gallery-office-de.jpg",
  },
  {
    id: "wc-duschen",
    icon: ShowerHead,
    title: "WC & Duschen",
    text: "Voll ausgestattete Sanitärcontainer mit WC-, Dusch- und Waschbereich.",
    photo: "/images/container/gallery-wohnwerte-de.jpg",
  },
] as const;

const CATEGORIES = [
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
    id: "wohncontainer",
    icon: HomeIcon,
    title: "Wohncontainer",
    text: "Voll ausgestattete Raumzellen für Unterkunft, Pause und temporäres Wohnen.",
  },
  {
    id: "sanitaercontainer",
    icon: ShowerHead,
    title: "Sanitärcontainer",
    text: "WC-, Dusch- und Waschcontainer für Baustellen, Events und Betriebsgelände.",
  },
  {
    id: "baucontainer",
    icon: Wrench,
    title: "Baucontainer",
    text: "Robuste Container für den Baustelleneinsatz, einzeln oder als Kombination.",
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
    text: "Jeder Container wird vor der Auslieferung technisch geprüft — neu wie gebraucht.",
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
  { step: "1", title: "Anfrage stellen", text: "Container-Typ, Maße und Einsatzort schildern — per Telefon, E-Mail oder Formular." },
  { step: "2", title: "Angebot erhalten", text: "Wir prüfen Verfügbarkeit und Zustand und melden uns mit einem passenden Angebot." },
  { step: "3", title: "Liefern lassen", text: "Nach Zusage liefern wir termingerecht und stellen den Container bei Ihnen auf." },
] as const;

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-secondary text-secondary-foreground">
          <PhotoHeroCarousel slides={HERO_PHOTOS} />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />

          <div className="relative z-10 mx-auto grid max-w-screen-xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                Containerhandel e.K.
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
                Container kaufen und mieten — schnell, zuverlässig, deutschlandweit
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
                BBC Best Box Containerhandel beliefert Gewerbe, Baustellen und Privatkunden mit
                Lager-, Büro-, Wohn- und Sanitärcontainern — neu und gebraucht, aus eigenem
                Bestand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sortiment"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-[#9a4315] px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:shadow-md"
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

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/sortiment#${category.id}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
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

        {/* Kauf oder Miete */}
        <section className="bg-accent">
          <div className="mx-auto grid max-w-screen-xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-2">
            <div className="rounded-sm bg-white p-8">
              <h3 className="text-xl font-black text-foreground">Container kaufen</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                Neu oder geprüft gebraucht, direkt aus unserem Bestand — inklusive Lieferung und
                Aufstellung nach Absprache.
              </p>
              <Link
                href="/sortiment"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                Zum Sortiment
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="rounded-sm bg-secondary p-8 text-secondary-foreground">
              <h3 className="text-xl font-black text-white">Container mieten</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Flexible Mietdauer für Baustellen, Events oder Übergangslösungen — ohne lange
                Kapitalbindung.
              </p>
              <Link
                href="/vermietung"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                Zur Vermietung
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* Unsere Container */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Unsere Container</h2>
          <p className="mt-3 max-w-xl text-foreground/70">
            Entdecken Sie unsere hochwertigen Design-Linien für jeden Bedarf – alle Varianten auf
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
                    alt={`${line.title} — Beispielcontainer`}
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
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10"
                  >
                    Produkte ansehen
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Warum wir */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Warum BBC Best Box</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title}>
                <benefit.icon className="h-7 w-7 text-primary" aria-hidden />
                <h3 className="mt-4 font-bold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ablauf */}
        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">So einfach geht&apos;s</h2>
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
        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Bereit für Ihren Container?
              </h2>
              <p className="mt-2 text-white/75">
                Sprechen Sie mit uns — wir finden die passende Lösung für Ihr Projekt.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Jetzt Kontakt aufnehmen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
