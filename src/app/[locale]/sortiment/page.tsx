import type { Metadata } from "next";
import { ArrowRight, Boxes, Building2, Ship, ShowerHead, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sortiment | BBC Best Box Containerhandel e.K.",
  description: "Lager-, Büro-, See-, Sanitär- und Sondercontainer, neu und gebraucht, kaufen oder mieten.",
};

const CATEGORIES = [
  {
    id: "lagercontainer",
    icon: Boxes,
    title: "Lagercontainer",
    text: "Wetterfeste Stahlcontainer für die sichere Lagerung von Material, Werkzeug, Ersatzteilen und Waren. Abschließbar, isoliert oder unisoliert, in Standardgrößen von 6 bis 12 Metern.",
    points: ["Diebstahl- und wettergeschützt", "Standardlängen 6-12 m", "Regalsysteme auf Wunsch"],
  },
  {
    id: "buerocontainer",
    icon: Building2,
    title: "Bürocontainer",
    text: "Mobile Büroeinheiten für Baustelle, Werksgelände oder Übergangslösung, einzeln oder als mehrgeschossige Anlage mit mehreren Modulen kombinierbar.",
    points: ["Heizung, Strom, Fenster", "Einzel- oder Mehrfachanlage", "Zwei-Etagen-Kombinationen möglich"],
  },
  {
    id: "seecontainer",
    icon: Ship,
    title: "Seecontainer",
    text: "Robuste ISO-Container für Transport, Umschlag und Lagerung, neu oder geprüft gebraucht, in Standardgrößen.",
    points: ["ISO-Normmaße 20' und 40'", "Wetter- und diebstahlsicher", "Neu und geprüft gebraucht"],
  },
  {
    id: "sanitaercontainer",
    icon: ShowerHead,
    title: "Sanitärcontainer",
    text: "WC-, Dusch- und Waschcontainer für Baustellen, Veranstaltungen und Betriebsgelände, inklusive Frisch- und Abwassertechnik.",
    points: ["WC-, Dusch- und Waschmodule", "Frisch-/Abwassertechnik integriert", "Für Baustellen und Events"],
  },
  {
    id: "sondercontainer",
    icon: Truck,
    title: "Sondercontainer",
    text: "Individuelle Umbauten nach Ihren Maßen, Werkstattcontainer, Verkaufsstände, Technikräume oder projektspezifische Sonderanfertigungen.",
    points: ["Maßgeschneiderte Umbauten", "Beratung zu Ihrem Einsatzzweck", "Angebot nach Aufmaß"],
  },
] as const;

export default function SortimentPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Sortiment</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Fünf Container-Kategorien, neu und gebraucht
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Alle Container sind in verschiedenen Längen, Breiten und Höhen erhältlich und
              können einzeln oder als mehrgeschossige Anlage kombiniert werden.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-14">
            {CATEGORIES.map((category, index) => (
              <div
                key={category.id}
                id={category.id}
                className="scroll-mt-20 grid gap-8 border-b border-border pb-14 last:border-0 last:pb-0 md:grid-cols-[auto_1fr] md:items-start"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-sm ${
                    index % 2 === 0 ? "bg-accent text-secondary" : "bg-secondary text-white"
                  }`}
                >
                  <category.icon className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground sm:text-2xl">{category.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
                    {category.text}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
                    {category.points.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/kontakt"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary"
                  >
                    Verfügbarkeit anfragen
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Nicht das Richtige dabei?</h2>
              <p className="mt-2 text-foreground/70">
                Wir realisieren auch individuelle Sonderanfertigungen. Sprechen Sie uns an.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Kontakt aufnehmen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
