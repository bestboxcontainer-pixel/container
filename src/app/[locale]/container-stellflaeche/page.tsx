import type { Metadata } from "next";
import { ArrowRight, Layers, MapPin, Ruler, Scale, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";

const META_DESCRIPTION =
  "Standort, Untergrund, Ausrichtung und Freiraum: wie Sie die Stellfläche für einen Container vorbereiten, damit er beim ersten Versuch tragfähig und waagerecht steht.";

export const metadata: Metadata = {
  title: "Stellfläche für den Container vorbereiten | BBC Best Box Containerhandel e.K.",
  description: META_DESCRIPTION,
};

/**
 * Schritte zur Vorbereitung der Stellfläche. Quelle zugleich für die Anzeige
 * und das HowTo-Balisage: beide lesen dieselbe Konstante, damit Seiteninhalt
 * und strukturierte Daten nicht auseinanderlaufen.
 */
const SCHRITTE = [
  {
    icon: MapPin,
    titel: "Standort festlegen",
    text: "Wählen Sie eine Fläche mit gerader Lkw-Zufahrt und genügend Arbeitsraum rings um den Container. Das Gelände sollte leicht vom Gebäude weg abfallen, damit Regenwasser abläuft und sich nicht unter dem Container staut.",
  },
  {
    icon: Ruler,
    titel: "Fläche roden und verdichten",
    text: "Bewuchs, Mutterboden und Wurzeln abtragen, bis tragfähiger Untergrund ansteht. Den Boden mit einer Rüttelplatte verdichten und mit rund zwei Prozent Gefälle abziehen.",
  },
  {
    icon: Layers,
    titel: "Tragende Auflage herstellen",
    text: "Unter den vier Eckbeschlägen muss die Last sicher abtragen. Verdichteter Schotter (mindestens etwa 20 cm), Betonplatten oder Streifenfundamente genügen; eine durchgehende Bodenplatte ist nicht nötig.",
  },
  {
    icon: Scale,
    titel: "Waagerecht ausrichten",
    text: "Alle vier Eckbeschläge müssen auf gleicher Höhe aufliegen. Mit Wasserwaage und Richtscheit prüfen: Steht der Container schief, verzieht sich der Rahmen dauerhaft und die Türen klemmen.",
  },
  {
    icon: TriangleAlert,
    titel: "Freiraum prüfen",
    text: "Beim Absetzen per Kran werden rund sechs Meter freie Höhe über der Stellfläche gebraucht, ohne Freileitungen, Vordächer oder Äste im Schwenkbereich. Melden Sie enge Stellen vorab, dann wählen wir das passende Fahrzeug.",
  },
] as const;

// Materialien und Werkzeug, wörtlich aus den Schritten oben.
const MATERIAL = ["Verdichteter Schotter", "Betonplatten", "Streifenfundamente"] as const;
const WERKZEUG = ["Rüttelplatte", "Wasserwaage", "Richtscheit"] as const;

const FRAGEN = [
  {
    frage: "Reicht gewachsener Boden oder Rasen?",
    antwort:
      "In der Regel nicht. Ein Container gibt seine Last punktuell über vier Ecken ab; unbefestigter Boden sackt dort ein, und der Container steht nach dem ersten Regen schief.",
  },
  {
    frage: "Wie viel Fläche muss ich einplanen?",
    antwort:
      "Das Containermaß plus ringsum Arbeitsraum zum Ausrichten, dazu eine gerade Anfahrt in Verlängerung der Stellfläche für das Lieferfahrzeug.",
  },
  {
    frage: "Muss die ganze Fläche befestigt sein?",
    antwort:
      "Nein. Tragfähig und eben unter den vier Eckbeschlägen genügt. Punktfundamente oder Betonplatten an den Ecken erfüllen den Zweck ebenso wie eine durchgehende Platte.",
  },
] as const;

export default function ContainerStellflaechePage() {
  return (
    <>
      {/* Schritte und Materialien werden unverändert aus SCHRITTE / MATERIAL / WERKZEUG übernommen. */}
      <HowToJsonLd
        name="Stellfläche für einen Container vorbereiten"
        description={META_DESCRIPTION}
        path="/container-stellflaeche"
        steps={SCHRITTE.map((s) => ({ name: s.titel, text: s.text }))}
        supply={MATERIAL}
        tool={WERKZEUG}
      />
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Ratgeber</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Die Stellfläche vorbereiten
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Die meisten gescheiterten Anlieferungen liegen nicht am Container, sondern am
              Untergrund. Fünf Schritte, mit denen die Fläche vor dem Liefertag steht.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <ol className="grid gap-6 lg:grid-cols-2">
            {SCHRITTE.map((schritt, index) => (
              <li
                key={schritt.titel}
                className="flex gap-4 rounded-2xl border border-border bg-white p-6"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <schritt.icon className="h-5 w-5 text-primary" aria-hidden />
                    <h2 className="font-black text-foreground">{schritt.titel}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">{schritt.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Material</p>
              <ul className="mt-3 space-y-1.5">
                {MATERIAL.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-muted p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Werkzeug</p>
              <ul className="mt-3 space-y-1.5">
                {WERKZEUG.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Häufig gefragt</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {FRAGEN.map((item) => (
                <div key={item.frage} className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="font-bold text-foreground">{item.frage}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.antwort}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-foreground/70">
              Mehr zum Liefertag selbst:{" "}
              <Link href="/lieferung" className="font-bold text-primary hover:underline">
                Lieferung &amp; Aufstellung
              </Link>
              . Alle Fragen vor dem Kauf:{" "}
              <Link href="/faq" className="font-bold text-primary hover:underline">
                Häufige Fragen
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Unsicher beim Untergrund?</h2>
              <p className="mt-2 text-foreground/70">
                Schildern Sie uns Stellfläche und Zufahrt. Wir sagen Ihnen, was vorzubereiten ist,
                und wählen das passende Absetzverfahren.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Beratung anfragen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
