import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Droplets, Ship, Wrench } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Zustandsklassen | BBC Best Box Containerhandel e.K.",
  description:
    "Neu, One-Trip, cargo-worthy oder wind- und wasserdicht: was die Zustandsklassen im Containerhandel bedeuten und welche für welchen Einsatz taugt.",
};

/**
 * Die vier im Handel gebräuchlichen Klassen, absteigend nach Zustand.
 * `signal` markiert die Klasse, die wir am häufigsten empfehlen.
 */
const KLASSEN = [
  {
    id: "neu",
    icon: BadgeCheck,
    name: "Neu / One-Trip",
    lead: "Fabrikneu, höchstens eine Transportfahrt.",
    text: "Ein One-Trip-Container wurde nach der Produktion in Asien einmal beladen nach Europa gefahren. Technisch neuwertig, Lackierung ohne Vorschäden, Böden unbenutzt. Wer den Container sichtbar aufstellt oder ausbauen lässt, fährt hiermit am besten.",
    eignung: ["Ausbau zu Büro, Wohnraum oder Verkaufsfläche", "Repräsentative Aufstellung auf dem Firmengelände", "Langfristige Nutzung ohne Renovierungsbedarf"],
    empfohlen: true,
  },
  {
    id: "cargo-worthy",
    icon: Ship,
    name: "Cargo-Worthy (CW)",
    lead: "Seetüchtig, mit gültiger CSC-Plakette.",
    text: "Gebraucht, aber von einem Sachverständigen als seetauglich eingestuft. Gebrauchsspuren und Roststellen sind normal, die Struktur ist geprüft. Nur diese Klasse darf noch für den internationalen Seetransport eingesetzt werden.",
    eignung: ["Internationaler Transport per Schiff", "Lagerung mit hohem Anspruch an die Dichtheit", "Weiterverkauf im Transportgewerbe"],
    empfohlen: false,
  },
  {
    id: "wwt",
    icon: Droplets,
    name: "Wind- und wasserdicht (WWT)",
    lead: "Dicht, aber nicht mehr seezertifiziert.",
    text: "Der Container hält Wind und Regen ab, die CSC-Plakette ist jedoch abgelaufen oder wurde nicht erneuert. Für die stationäre Lagerung an Land ist das ohne Belang und macht den Preisunterschied aus. Rost und Dellen an der Außenhaut gehören dazu.",
    eignung: ["Stationäre Lagerung auf dem eigenen Gelände", "Baustellenlager und Werkzeugcontainer", "Preisbewusste Dauerlösungen an Land"],
    empfohlen: false,
  },
  {
    id: "as-is",
    icon: Wrench,
    name: "Gebraucht / As-is",
    lead: "Verkauf im vorgefundenen Zustand.",
    text: "Sichtbare Schäden, undichte Stellen oder Reparaturbedarf sind möglich und im Preis berücksichtigt. Sinnvoll, wenn Sie ohnehin umbauen, zerlegen oder als Materialspender nutzen wollen. Wir benennen die Mängel vor dem Kauf.",
    eignung: ["Umbauprojekte mit eigener Werkstatt", "Materialgewinnung und Zerlegung", "Untergeordnete Lagerzwecke"],
    empfohlen: false,
  },
] as const;

const FRAGEN = [
  {
    frage: "Brauche ich zwingend cargo-worthy?",
    antwort: "Nur, wenn der Container noch auf ein Schiff soll. Steht er dauerhaft an Land, bringt die CSC-Plakette keinen praktischen Vorteil, kostet aber Aufpreis.",
  },
  {
    frage: "Ist Rost ein Mangel?",
    antwort: "Oberflächenrost gehört bei jedem gebrauchten Container dazu und beeinträchtigt die Funktion nicht. Entscheidend ist, ob die Substanz durchgerostet ist. Genau das prüfen wir vor der Auslieferung.",
  },
  {
    frage: "Warum riecht ein gebrauchter Container manchmal?",
    antwort: "Restgerüche stammen aus früheren Ladungen oder von der Holzbodenbehandlung. Bei One-Trip-Containern tritt das praktisch nicht auf, bei älteren lässt es sich durch Lüften und einen neuen Bodenanstrich beheben.",
  },
] as const;

export default function ZustandsklassenPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Zustandsklassen</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Neu, cargo-worthy oder wind- und wasserdicht?
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Im Containerhandel entscheidet die Zustandsklasse über Preis und Eignung. Hier
              steht, was die Begriffe bedeuten und wofür jede Klasse taugt, damit Sie Angebote
              überhaupt vergleichen können.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {KLASSEN.map((klasse) => (
              <article
                key={klasse.id}
                className={`rounded-2xl border p-6 ${
                  klasse.empfohlen ? "border-primary bg-muted" : "border-border bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <klasse.icon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
                  {klasse.empfohlen ? (
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                      Meist empfohlen
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-lg font-black text-foreground">{klasse.name}</h2>
                <p className="mt-1 text-sm font-semibold text-primary">{klasse.lead}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{klasse.text}</p>

                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-foreground/60">
                  Passt für
                </p>
                <ul className="mt-2 space-y-1.5">
                  {klasse.eignung.map((zweck) => (
                    <li key={zweck} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {zweck}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
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
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Welche Klasse brauchen Sie?</h2>
              <p className="mt-2 text-foreground/70">
                Sagen Sie uns den Einsatzzweck. Wir empfehlen die günstigste Klasse, die dafür
                ausreicht, und nicht die teuerste.
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
