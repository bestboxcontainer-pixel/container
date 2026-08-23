import type { Metadata } from "next";
import { ArrowRight, HandCoins, ShieldCheck, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/content/legal";

export const metadata: Metadata = {
  title: "Über uns | BBC Best Box Containerhandel e.K.",
  description: "BBC Best Box Containerhandel e.K. — Inhabergeführter Containerhandel mit Sitz in Großensee, Schleswig-Holstein.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Verlässlichkeit",
    text: "Was wir zusagen, halten wir — bei Lieferterminen ebenso wie beim Zustand jedes Containers.",
  },
  {
    icon: Users,
    title: "Persönlicher Kontakt",
    text: "Als inhabergeführtes Unternehmen sind die Wege kurz: Sie sprechen mit uns, nicht mit einer Warteschleife.",
  },
  {
    icon: HandCoins,
    title: "Faire Konditionen",
    text: "Transparente Preise für Kauf und Miete, ohne versteckte Kosten bei Lieferung oder Aufstellung.",
  },
] as const;

export default function UeberUnsPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Über uns</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Inhabergeführter Containerhandel aus Schleswig-Holstein
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              {COMPANY.name} handelt seit {COMPANY.registeredSince} mit Containern für Gewerbe,
              Bauwesen und Privatkunden — von {COMPANY.locality} aus, deutschlandweit.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black text-foreground">Wer wir sind</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                {COMPANY.name} ist ein eingetragener Einzelkaufmann (e.K.) mit Sitz in{" "}
                {COMPANY.locality}. Geführt wird das Unternehmen von {COMPANY.owner}, der für
                jede Anfrage persönlich ansprechbar ist.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Unser Schwerpunkt liegt auf Verkauf und Vermietung von See-, Lager-, Büro-,
                Wohn- und Sanitärcontainern — neu und geprüft gebraucht, ergänzt um
                Sonderanfertigungen nach Kundenwunsch.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Was uns wichtig ist</h2>
              <div className="mt-6 flex flex-col gap-6">
                {VALUES.map((value) => (
                  <div key={value.title} className="flex gap-4">
                    <value.icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="font-bold text-foreground">{value.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/70">{value.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Lernen Sie uns kennen</h2>
              <p className="mt-2 text-foreground/70">
                Rufen Sie an oder schreiben Sie uns — wir beraten Sie gerne zu Ihrem Vorhaben.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Zum Kontakt
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
