import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  Boxes,
  Building2,
  Home as HomeIcon,
  Layers,
  MapPin,
  Palette,
  Ruler,
  ShowerHead,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";

// Variante B de la page d'accueil : structure plus proche de villex-container.de
// (bandeau de repères sous le hero, grille de finitions, catégories en vignettes,
// bloc dimensions, montage modulaire, types de projets). Texte et code originaux,
// aucun contenu copié depuis le site de référence. Non listée dans le sitemap :
// page de comparaison interne, pas encore un choix définitif.
export const metadata: Metadata = {
  title: "BBC Best Box Containerhandel e.K. — Entwurf B",
  description: "Zweiter Entwurf der Startseite, näher an der Struktur von Referenzseiten aus der Containerbranche.",
  robots: { index: false, follow: false },
};

const TRUST_BADGES = [
  { icon: Award, label: "Seit 2006 am Markt" },
  { icon: Users, label: "Inhabergeführt & persönlich" },
  { icon: Boxes, label: "Neu & geprüft gebraucht" },
  { icon: MapPin, label: "Lieferung deutschlandweit" },
] as const;

const FINISH_LINES = [
  { id: "basic", title: "Basic-Line", text: "Verzinkter Stahlcontainer, funktional und robust — die wirtschaftliche Grundausstattung." },
  { id: "farb", title: "Farb-Line", text: "Außenanstrich in einer RAL-Farbe Ihrer Wahl, passend zu Firmen- oder Baustellendesign." },
  { id: "natur", title: "Natur-Line", text: "Holzverkleidung an Fassade oder Innenraum für eine warme, natürliche Optik." },
  { id: "office", title: "Office-Line", text: "Ausgestattet mit Bodenbelag, Elektrik und Klimatisierung — startklar als Büro." },
  { id: "comfort", title: "Comfort-Line", text: "Gedämmt und möbliert für Wohn- und Pausennutzung über längere Zeiträume." },
  { id: "signature", title: "Signature-Line", text: "Großzügige Fensterfronten und hochwertige Innenausstattung für repräsentative Zwecke." },
] as const;

const HERO_SLIDES: readonly HeroSlide[] = [
  { label: "Lagercontainer", from: "#0a1d30", to: "#1c3a57" },
  { label: "Bürocontainer", from: "#12233a", to: "#b8551f" },
  { label: "Wohncontainer", from: "#0a1d30", to: "#2c4a68" },
  { label: "Sanitärcontainer", from: "#16283f", to: "#8a4319" },
] as const;

const CATEGORIES = [
  { id: "seecontainer", icon: Boxes, title: "Seecontainer" },
  { id: "lagercontainer", icon: Layers, title: "Lagercontainer" },
  { id: "buerocontainer", icon: Building2, title: "Bürocontainer" },
  { id: "wohncontainer", icon: HomeIcon, title: "Wohncontainer" },
  { id: "sanitaercontainer", icon: ShowerHead, title: "Sanitärcontainer" },
  { id: "baucontainer", icon: Wrench, title: "Baucontainer" },
] as const;

const DIMENSIONS = [
  { label: "Länge", value: "3 – 12 m" },
  { label: "Breite", value: "2,4 – 3,0 m" },
  { label: "Höhe", value: "2,6 – 3,0 m" },
] as const;

const PROJECT_TYPES = [
  { title: "Büroerweiterung", text: "Zusätzliche Bürofläche durch aneinandergereihte oder gestapelte Module." },
  { title: "Industrieanlage", text: "Kombinierte Lager- und Werkstattlösung für Produktions- und Logistikbetriebe." },
  { title: "Verkaufskiosk", text: "Umgebauter Container als kompakter Verkaufs- oder Ausgabepunkt." },
  { title: "Logistikterminal", text: "Mehrere Lagercontainer als flexible Zwischenlagerfläche am Terminal." },
] as const;

export default function HomePageV2() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-secondary text-secondary-foreground">
          <HeroCarousel slides={HERO_SLIDES} />
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-secondary via-secondary/70 to-secondary/40" />

          <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-24 text-center sm:px-6 md:py-32">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              BBC Best Box Containerhandel e.K.
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Ihr Partner für Container — Verkauf, Vermietung, Sonderanfertigung
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-white/75">
              Aus eigenem Bestand in Großensee beliefern wir Kunden in ganz Deutschland mit
              Containern für Lager, Büro, Wohnen und Baustelle.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sortiment"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-[#9a4315] px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:shadow-md"
              >
                Sortiment entdecken
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10"
              >
                Angebot anfragen
              </Link>
            </div>
          </div>
        </section>

        {/* Bandeau de repères, juste sous le hero */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className="flex items-center gap-3">
                <badge.icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ausstattungslinien (grille de finitions) */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Ausstattungslinien</h2>
          </div>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Vom funktionalen Basismodell bis zur repräsentativen Ausführung — wählen Sie die
            passende Linie für Ihren Container.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FINISH_LINES.map((line, index) => {
              const isSignature = index === FINISH_LINES.length - 1;
              return (
                <div
                  key={line.id}
                  className={`overflow-hidden rounded-2xl border p-6 shadow-sm ${
                    isSignature ? "border-white/10 bg-secondary text-white" : "border-border bg-white"
                  }`}
                >
                  <span className="block h-1 w-10 rounded-full bg-gradient-to-r from-primary to-gold" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-primary">
                    {line.title}
                  </p>
                  <p className={`mt-2 text-sm leading-relaxed ${isSignature ? "text-white/80" : "text-foreground/70"}`}>
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Catégories en vignettes */}
        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Container-Kategorien</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/sortiment#${category.id === "seecontainer" ? "" : category.id}`}
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

        {/* Maße */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Ruler className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="text-2xl font-black text-foreground sm:text-3xl">Maße nach Bedarf</h2>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/70">
                Ob Einzelmodul oder mehrgeschossige Anlage: Länge, Breite und Höhe passen wir an
                Ihr Vorhaben an.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {DIMENSIONS.map((dim) => (
                <div key={dim.label} className="rounded-2xl border border-border p-5 text-center shadow-sm">
                  <p className="text-xl font-black text-primary">{dim.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    {dim.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Montage modulaire */}
        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-white sm:text-3xl">Ein- und mehrgeschossige Anlagen</h2>
            <p className="mt-3 max-w-xl text-white/70">
              Container lassen sich einzeln, nebeneinander oder gestapelt zu größeren Anlagen
              kombinieren — von 2 bis zu 5 Modulen.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5].map((modules) => (
                <div
                  key={modules}
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-center"
                >
                  <span className="text-xl font-black text-primary">{modules}</span>
                  <span className="text-[11px] text-white/60">Module</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Types de projets */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Typische Projektarten</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROJECT_TYPES.map((project) => (
              <div key={project.title} className="rounded-2xl border border-border p-5 shadow-sm">
                <Truck className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-bold text-foreground">{project.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{project.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              Lassen Sie uns über Ihr Projekt sprechen
            </h2>
            <p className="max-w-md text-foreground/70">
              Unverbindliche Beratung, schnelle Rückmeldung, faire Konditionen.
            </p>
            <Link
              href="/kontakt"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-[#9a4315] px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:shadow-md"
            >
              Jetzt anfragen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
