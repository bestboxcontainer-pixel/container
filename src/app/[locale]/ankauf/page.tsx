import type { Metadata } from "next";
import { ArrowRight, Camera, ClipboardList, HandCoins, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/content/legal";

export const metadata: Metadata = {
  title: "Container-Ankauf | BBC Best Box Containerhandel e.K.",
  description:
    "Wir kaufen gebrauchte See-, Lager-, Büro- und Sanitärcontainer an. Bewertung anhand von Fotos, Abholung deutschlandweit.",
};

const ABLAUF = [
  {
    schritt: "1",
    icon: Camera,
    titel: "Fotos schicken",
    text: "Vier Aufnahmen genügen für eine erste Einschätzung: beide Längsseiten, die Türseite und der Innenraum. Wichtig sind Roststellen, Dellen und der Zustand des Bodens.",
  },
  {
    schritt: "2",
    icon: ClipboardList,
    titel: "Bewertung erhalten",
    text: "Wir stufen den Container in eine Zustandsklasse ein und nennen Ihnen eine Preisspanne. Ist der Container weit entfernt, fließt die Abholung in die Rechnung ein.",
  },
  {
    schritt: "3",
    icon: Truck,
    titel: "Abholung und Auszahlung",
    text: "Nach Ihrer Zusage holen wir ab. Die Auszahlung erfolgt nach der Sichtprüfung vor Ort, per Überweisung.",
  },
] as const;

const ANGABEN = [
  "Typ und Größe (10, 20, 40 Fuß, High Cube)",
  "Baujahr, soweit auf dem CSC-Schild ablesbar",
  "Zustand: Rost, Dellen, Dichtheit, Boden",
  "Standort und Zufahrt für den Lkw",
  "Gewünschter Abholzeitraum",
] as const;

const WAS_WIR_KAUFEN = [
  { titel: "See- und Lagercontainer", text: "10, 20 und 40 Fuß, Standard und High Cube, jede Zustandsklasse." },
  { titel: "Büro- und Wohncontainer", text: "Einzelmodule und Anlagen, auch mit Ausbaubedarf." },
  { titel: "Sanitärcontainer", text: "WC- und Duschcontainer, sofern die Technik vollständig ist." },
  { titel: "Sonderbauten", text: "Umgebaute Container, nach Einzelfallprüfung." },
] as const;

export default function AnkaufPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Ankauf</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Wir kaufen Ihren Container
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Steht bei Ihnen ein Container, den Sie nicht mehr brauchen? Wir kaufen an, holen
              deutschlandweit ab und zahlen nach der Sichtprüfung aus.
            </p>
            <a
              href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-bold text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
            >
              Direkt anrufen: {COMPANY.phone}
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">So läuft der Ankauf ab</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ABLAUF.map((item) => (
              <article key={item.schritt} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                    {item.schritt}
                  </span>
                  <item.icon className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 font-bold text-foreground">{item.titel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-muted">
          <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">Was wir ankaufen</h2>
              <div className="mt-8 space-y-4">
                {WAS_WIR_KAUFEN.map((item) => (
                  <div key={item.titel} className="rounded-2xl border border-border bg-white p-5">
                    <h3 className="font-bold text-foreground">{item.titel}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                Diese Angaben brauchen wir
              </h2>
              <p className="mt-3 text-foreground/70">
                Je vollständiger die Angaben, desto belastbarer die erste Einschätzung. Eine
                Bewertung ohne Fotos ist erfahrungsgemäß wertlos.
              </p>
              <ul className="mt-8 space-y-3">
                {ANGABEN.map((angabe) => (
                  <li
                    key={angabe}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4"
                  >
                    <HandCoins className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm text-foreground/80">{angabe}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Container anbieten</h2>
              <p className="mt-2 max-w-xl text-foreground/70">
                Schicken Sie uns Fotos und Standort per E-Mail an{" "}
                <a href={`mailto:${COMPANY.email}`} className="font-semibold text-primary hover:underline">
                  {COMPANY.email}
                </a>{" "}
                oder über das Kontaktformular. Wir melden uns mit einer Einschätzung zurück.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Zum Kontaktformular
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
