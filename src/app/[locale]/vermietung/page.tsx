import type { Metadata } from "next";
import { ArrowRight, CalendarClock, PackageCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vermietung | BBC Best Box Containerhandel e.K.",
  description: "Container flexibel mieten — Lager-, Büro-, Wohn- und Sanitärcontainer für Baustellen, Events und Übergangslösungen.",
};

const ADVANTAGES = [
  {
    icon: CalendarClock,
    title: "Flexible Mietdauer",
    text: "Von wenigen Wochen bis zu mehreren Jahren — die Laufzeit richtet sich nach Ihrem Projekt, nicht umgekehrt.",
  },
  {
    icon: PackageCheck,
    title: "Sofort einsatzbereit",
    text: "Gewartete Container aus eigenem Bestand, ausgestattet nach Ihrem Bedarf und kurzfristig verfügbar.",
  },
  {
    icon: Truck,
    title: "Lieferung inklusive",
    text: "Anlieferung, Aufstellung und auf Wunsch spätere Abholung organisieren wir für Sie.",
  },
] as const;

const USE_CASES = [
  "Baustellen-Erstausstattung (Büro, Lager, Sanitär)",
  "Personalunterkünfte für die Projektlaufzeit",
  "Zusätzliche Lagerfläche bei saisonalen Spitzen",
  "Provisorium bei Umbau, Sanierung oder Umzug",
  "Infrastruktur für Veranstaltungen und Messen",
] as const;

export default function VermietungPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Vermietung</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Container mieten statt kaufen
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Für Projekte mit begrenzter Laufzeit: Wir vermieten Lager-, Büro-, Wohn- und
              Sanitärcontainer zu flexiblen Konditionen, ohne lange Kapitalbindung.
            </p>
            <Link
              href="/kontakt"
              className="mt-7 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Mietangebot anfragen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {ADVANTAGES.map((item) => (
              <div key={item.title}>
                <item.icon className="h-7 w-7 text-primary" aria-hidden />
                <h2 className="mt-4 font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Typische Einsatzbereiche</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {USE_CASES.map((useCase) => (
                <li key={useCase} className="flex items-start gap-3 rounded-sm bg-white p-4">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="text-sm text-foreground/80">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Welchen Container brauchen Sie?</h2>
              <p className="mt-2 text-foreground/70">
                Schildern Sie uns Einsatzzweck und Zeitraum — wir schlagen die passende Lösung vor.
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
