import type { Metadata } from "next";
import { ArrowRight, Building2, Clock, FileText, Landmark, MapPinned, PackageSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";

const META_DESCRIPTION =
  "Nutzung, Dauer, Landesbauordnung, Grundstück und Bauaufsichtsbehörde: wie Sie Schritt für Schritt klären, ob Ihr Container eine Baugenehmigung braucht.";

export const metadata: Metadata = {
  title: "Baugenehmigung für einen Container: brauche ich eine? | BBC Best Box Containerhandel e.K.",
  description: META_DESCRIPTION,
};

/**
 * Schritte zur Klärung des Genehmigungsbedarfs. Quelle zugleich für die
 * Anzeige und das HowTo-Balisage. Bewusst allgemein gehalten: verbindlich ist
 * nur die örtliche Bauaufsichtsbehörde, das steht auch in jedem Schritt.
 */
const SCHRITTE = [
  {
    icon: Building2,
    titel: "Nutzung einordnen",
    text: "Ein Lagercontainer ohne Aufenthalt von Menschen wird baurechtlich anders behandelt als ein Büro-, Wohn- oder Sanitärcontainer mit Aufenthaltsräumen. Halten Sie fest, wofür der Container genutzt wird.",
  },
  {
    icon: Clock,
    titel: "Aufstelldauer bestimmen",
    text: "Eine vorübergehende Aufstellung über Wochen oder wenige Monate wird oft anders bewertet als eine dauerhafte. Legen Sie fest, wie lange der Container stehen soll.",
  },
  {
    icon: Landmark,
    titel: "Landesbauordnung prüfen",
    text: "Ob ein Vorhaben verfahrensfrei ist, regelt jedes Bundesland in seiner Landesbauordnung. Lagergebäude ohne Aufenthaltsräume sind vielerorts bis zu einem bestimmten Brutto-Rauminhalt verfahrensfrei; Grenze und Ausnahmen, besonders im Außenbereich, unterscheiden sich je Land.",
  },
  {
    icon: MapPinned,
    titel: "Grundstück und Bebauungsplan prüfen",
    text: "Gebietsart (etwa Gewerbe- oder Mischgebiet), Festsetzungen des Bebauungsplans und die Abstandsflächen zur Grundstücksgrenze entscheiden mit. Im Zweifel gilt der Bebauungsplan Ihrer Gemeinde.",
  },
  {
    icon: FileText,
    titel: "Bauaufsichtsbehörde fragen",
    text: "Verbindlich ist allein die Auskunft der unteren Bauaufsichtsbehörde Ihres Kreises oder Ihrer Stadt. Eine formlose Bauvoranfrage klärt den Genehmigungsbedarf, bevor der Container bestellt wird.",
  },
  {
    icon: PackageSearch,
    titel: "Unterlagen zusammenstellen",
    text: "Für Antrag oder Voranfrage werden meist Lageplan, Grundriss und Ansichten sowie Angaben zu Statik und CSC-Plate gebraucht. Die technischen Unterlagen zum Container liefern wir.",
  },
] as const;

const FRAGEN = [
  {
    frage: "Gilt ein Container überhaupt als bauliche Anlage?",
    antwort:
      "Ja, sobald er ortsfest genutzt wird. Ob er auf Rädern steht oder ein Fundament hat, ändert daran nichts; entscheidend ist die dauerhafte Nutzung an einem Ort.",
  },
  {
    frage: "Ändert sich etwas, wenn der Container nur kurz steht?",
    antwort:
      "Oft ja. Eine kurze, vorübergehende Aufstellung auf einem Gewerbegrundstück ist eher verfahrensfrei als eine dauerhafte. Die Grenze zieht die jeweilige Landesbauordnung.",
  },
  {
    frage: "Wer haftet, wenn die Genehmigung fehlt?",
    antwort:
      "Der Grundstückseigentümer beziehungsweise wer den Container aufstellt. Eine fehlende Genehmigung kann zu Nutzungsuntersagung und Rückbau führen, deshalb vorher fragen.",
  },
] as const;

export default function BaugenehmigungContainerPage() {
  return (
    <>
      {/* Schritte werden unverändert aus SCHRITTE übernommen. */}
      <HowToJsonLd
        name="Klären, ob ein Container eine Baugenehmigung braucht"
        description={META_DESCRIPTION}
        path="/baugenehmigung-container"
        steps={SCHRITTE.map((s) => ({ name: s.titel, text: s.text }))}
        speakable
      />
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Ratgeber</p>
            <h1
              className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl"
              data-speakable
            >
              Brauche ich eine Baugenehmigung für einen Container?
            </h1>
            <p className="mt-4 max-w-xl text-white/75" data-speakable>
              Es kommt auf Nutzung, Dauer und Bundesland an. Sechs Schritte, mit denen Sie den
              Genehmigungsbedarf klären, bevor der Container geliefert wird.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-muted p-5 text-sm leading-relaxed text-foreground/70">
            <strong className="font-bold text-foreground">Keine Rechtsberatung.</strong> Diese
            Seite gibt einen Überblick über die üblichen Prüfschritte. Verbindlich ist immer die
            Auskunft Ihrer örtlichen Bauaufsichtsbehörde.
          </div>

          <ol className="mt-10 grid gap-6 lg:grid-cols-2">
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
              Passt die Stellfläche?{" "}
              <Link href="/container-stellflaeche" className="font-bold text-primary hover:underline">
                Stellfläche vorbereiten
              </Link>
              . Weitere Fragen vor dem Kauf:{" "}
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
              <h2 className="text-2xl font-black text-foreground">Unterlagen für den Antrag?</h2>
              <p className="mt-2 text-foreground/70">
                Nennen Sie uns Containertyp und Standort. Wir stellen die technischen Unterlagen
                zusammen, die Ihre Bauaufsichtsbehörde für die Voranfrage braucht.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Unterlagen anfordern
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
