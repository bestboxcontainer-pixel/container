import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Häufige Fragen | BBC Best Box Containerhandel e.K.",
  description:
    "Genehmigung, Untergrund, Lieferzeit, Kauf oder Miete: die Fragen, die vor dem Containerkauf am häufigsten gestellt werden, sachlich beantwortet.",
};

/**
 * Quelle für die Anzeige UND für das FAQPage-Balisage: beide lesen dieselbe
 * Konstante, damit Seiteninhalt und strukturierte Daten nicht auseinanderlaufen.
 * Google wertet abweichendes Markup als Verstoß, und getrennt gepflegte Listen
 * driften erfahrungsgemäß schon nach der ersten Textänderung auseinander.
 */
interface FaqEintrag {
  frage: string;
  antwort: string;
}

interface FaqGruppe {
  titel: string;
  fragen: readonly FaqEintrag[];
}

const GRUPPEN: readonly FaqGruppe[] = [
  {
    titel: "Vor dem Kauf",
    fragen: [
      {
        frage: "Brauche ich eine Genehmigung, um einen Container aufzustellen?",
        antwort:
          "Das hängt von Bundesland, Dauer und Nutzung ab. Ein Lagercontainer, der vorübergehend auf einem Gewerbegrundstück steht, ist meist verfahrensfrei. Sobald Menschen sich dauerhaft darin aufhalten, etwa im Büro- oder Wohncontainer, oder die Aufstellung dauerhaft ist, wird in der Regel eine Baugenehmigung nötig. Verbindlich ist immer die Auskunft Ihrer örtlichen Bauaufsichtsbehörde. Wir liefern die technischen Unterlagen, die Sie für den Antrag brauchen.",
      },
      {
        frage: "Kaufen oder mieten, was lohnt sich wann?",
        antwort:
          "Als Faustregel gilt: Ab etwa zwölf bis achtzehn Monaten Nutzungsdauer liegt der Kauf günstiger als die Miete, und ein gebrauchter Container behält zudem einen Wiederverkaufswert. Für befristete Projekte, saisonale Spitzen oder wenn Sie Kapital nicht binden wollen, ist die Miete die passendere Wahl.",
      },
      {
        frage: "Was kostet ein Container?",
        antwort:
          "Der Preis hängt an vier Faktoren: Größe, Zustandsklasse, Ausstattung und Lieferentfernung. Zwischen einem gebrauchten wind- und wasserdichten 20-Fuß-Container und einem fabrikneuen ausgebauten Bürocontainer liegt ein Vielfaches. Nennen Sie uns Einsatzzweck und Standort, dann erhalten Sie ein konkretes Angebot statt einer Spanne.",
      },
    ],
  },
  {
    titel: "Lieferung und Aufstellung",
    fragen: [
      {
        frage: "Welcher Untergrund ist nötig?",
        antwort:
          "Der Container muss auf allen vier Eckbeschlägen tragfähig und waagerecht aufliegen. Verdichteter Schotter, Betonplatten oder Streifenfundamente genügen. Wichtig ist die gleichmäßige Lastverteilung: Steht der Container schief, klemmen die Türen und die Rahmenkonstruktion verzieht sich dauerhaft.",
      },
      {
        frage: "Wie viel Platz braucht das Lieferfahrzeug?",
        antwort:
          "Für einen 20-Fuß-Container rechnen Sie mit rund 20 Metern gerader Anfahrt und mindestens 3,5 Metern Durchfahrtsbreite. Beim Absetzen per Kran kommen etwa 6 Meter freie Höhe über der Stellfläche hinzu, ohne Äste, Leitungen oder Vordächer. Schildern Sie uns die Zufahrt vorab, dann wählen wir das passende Fahrzeug.",
      },
      {
        frage: "Wie lange dauert die Lieferung?",
        antwort:
          "Container aus unserem Bestand sind in der Regel innerhalb weniger Werktage bei Ihnen. Bei Sonderausstattung, Lackierung nach RAL oder umfangreichem Ausbau richtet sich der Termin nach dem Umfang der Arbeiten und wird im Angebot verbindlich genannt.",
      },
    ],
  },
  {
    titel: "Nutzung und Unterhalt",
    fragen: [
      {
        frage: "Bildet sich im Container Kondenswasser?",
        antwort:
          "Bei Temperaturunterschieden schlägt sich Feuchtigkeit an der Stahldecke nieder, im Fachjargon Containerregen. Abhilfe schaffen Lüftungsgitter, eine Dämmung der Decke oder Trockenmittel. Wenn Sie feuchtigkeitsempfindliche Ware einlagern, planen Sie das gleich mit ein.",
      },
      {
        frage: "Lässt sich ein Container nachträglich umbauen?",
        antwort:
          "Ja. Türen, Fenster, Trennwände, Elektrik, Dämmung und Beschichtungen lassen sich einbauen. Zu beachten ist, dass jeder Ausschnitt in der Seitenwand die Tragstruktur schwächt und je nach Größe eine Verstärkung braucht, besonders wenn Container gestapelt werden sollen.",
      },
      {
        frage: "Wie pflege ich einen Container?",
        antwort:
          "Stahlcontainer sind wartungsarm. Sinnvoll sind eine jährliche Sichtprüfung auf durchgerostete Stellen, das Fetten der Türverschlüsse und das Freihalten der Dachfläche von stehendem Laub. Kleine Lackschäden sollten Sie ausbessern, bevor sie sich unterrosten.",
      },
    ],
  },
];

const ALLE_FRAGEN = GRUPPEN.flatMap((gruppe) => gruppe.fragen);

const FAQ_SCHEMA: Record<string, JsonLdValue | undefined> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALLE_FRAGEN.map((item) => ({
    "@type": "Question",
    name: item.frage,
    acceptedAnswer: { "@type": "Answer", text: item.antwort },
  })),
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={FAQ_SCHEMA} />
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">FAQ</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Häufige Fragen zum Container
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Die Fragen, die uns am Telefon am häufigsten gestellt werden, sachlich beantwortet.
              Ist Ihre nicht dabei, rufen Sie an.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="max-w-3xl space-y-12">
            {GRUPPEN.map((gruppe) => (
              <div key={gruppe.titel}>
                <h2 className="text-xl font-black text-foreground sm:text-2xl">{gruppe.titel}</h2>
                <div className="mt-6 space-y-3">
                  {gruppe.fragen.map((item) => (
                    <details
                      key={item.frage}
                      className="group rounded-2xl border border-border bg-white p-5 open:bg-muted"
                    >
                      <summary className="cursor-pointer list-none font-bold text-foreground marker:content-none">
                        <span className="flex items-start justify-between gap-4">
                          {item.frage}
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rotate-45 border-r-2 border-b-2 border-primary transition-transform group-open:-rotate-[135deg]"
                            aria-hidden
                          />
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                        {item.antwort}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Frage nicht dabei?</h2>
              <p className="mt-2 text-foreground/70">
                Rufen Sie an oder schreiben Sie uns. Wir antworten auch dann, wenn daraus kein
                Auftrag wird.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
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
