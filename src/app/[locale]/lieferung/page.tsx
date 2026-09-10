import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpFromLine,
  ClipboardCheck,
  Layers,
  Ruler,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Lieferung & Aufstellung | BBC Best Box Containerhandel e.K.",
  description:
    "Zufahrt, Untergrund, Fahrzeugtyp und Ablauf am Liefertag: was vor der Anlieferung eines Containers geklärt sein muss.",
};

/**
 * Die drei Absetzverfahren. Die Maßangaben sind Planungsrichtwerte für die
 * Vorbereitung des Kunden, keine Zusicherung: das konkrete Fahrzeug wird nach
 * Besichtigung der Zufahrt festgelegt.
 */
const VERFAHREN = [
  {
    icon: ArrowUpFromLine,
    name: "Lkw mit Ladekran",
    text: "Das gängigste Verfahren. Der Kran hebt den Container über Hindernisse hinweg und setzt ihn punktgenau ab, auch seitlich versetzt zur Fahrzeugposition.",
    braucht: ["Standfläche für den Lkw in Reichweite", "Rund 6 m freie Höhe über der Stellfläche", "Keine Freileitungen im Schwenkbereich"],
  },
  {
    icon: Truck,
    name: "Abrollkipper / Hakenlift",
    text: "Der Container wird nach hinten abgerollt. Günstiger als der Kran, verlangt aber eine gerade Anfahrt direkt an die Stellfläche.",
    braucht: ["Gerade Anfahrt in Verlängerung der Stellfläche", "Etwa 20 m Rangierlänge", "Befestigter, tragfähiger Untergrund"],
  },
  {
    icon: Layers,
    name: "Tieflader mit Stapler",
    text: "Für große Stückzahlen, mehrgeschossige Anlagen oder wenn vor Ort ohnehin Hebetechnik steht. Wir stimmen das Verfahren mit Ihrer Bauleitung ab.",
    braucht: ["Hebetechnik vor Ort oder von uns gestellt", "Ausreichend Rangierfläche", "Eingewiesenes Personal auf der Baustelle"],
  },
] as const;

const VORBEREITUNG = [
  {
    icon: Ruler,
    titel: "Zufahrt vermessen",
    text: "Mindestens 3,5 m Durchfahrtsbreite und rund 20 m gerade Anfahrt für einen 20-Fuß-Container. Enge Tore, Poller und überhängende Äste bitte vorab melden.",
  },
  {
    icon: Layers,
    titel: "Untergrund herrichten",
    text: "Der Container muss auf allen vier Eckbeschlägen waagerecht aufliegen. Verdichteter Schotter, Betonplatten oder Streifenfundamente genügen. Ein schief stehender Container verzieht sich und die Türen klemmen.",
  },
  {
    icon: TriangleAlert,
    titel: "Hindernisse prüfen",
    text: "Freileitungen, Vordächer, Balkone und Tiefgaragendecken sind die häufigsten Gründe, warum eine Anlieferung am Liefertag scheitert. Ein Foto der Stellfläche vorab erspart beiden Seiten die Fehlfahrt.",
  },
  {
    icon: ClipboardCheck,
    titel: "Ansprechpartner benennen",
    text: "Am Liefertag muss jemand vor Ort sein, der die genaue Position freigibt und die Übergabe quittiert. Ohne Freigabe setzt der Fahrer nicht ab.",
  },
] as const;

const ABLAUF = [
  { schritt: "1", titel: "Zufahrt klären", text: "Sie schildern Stellfläche und Anfahrt, wir wählen das passende Fahrzeug und nennen den Termin." },
  { schritt: "2", titel: "Anlieferung", text: "Der Fahrer meldet sich vorab an. Vor Ort weisen Sie die genaue Position ein." },
  { schritt: "3", titel: "Absetzen und Ausrichten", text: "Der Container wird waagerecht abgesetzt und auf sauberen Türschluss geprüft." },
  { schritt: "4", titel: "Übergabe", text: "Gemeinsame Sichtprüfung, Schlüsselübergabe, Lieferschein. Bei Miete vereinbaren wir zugleich die spätere Abholung." },
] as const;

export default function LieferungPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">
              Lieferung & Aufstellung
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Damit der Container beim ersten Versuch steht
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Die meisten gescheiterten Anlieferungen liegen nicht am Container, sondern an
              Zufahrt oder Untergrund. Hier steht, was vorher geklärt sein muss.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Wie wir absetzen</h2>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Welches Verfahren infrage kommt, entscheidet die Zufahrt, nicht der Container.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {VERFAHREN.map((v) => (
              <article key={v.name} className="rounded-2xl border border-border bg-white p-6">
                <v.icon className="h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-black text-foreground">{v.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">{v.text}</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-foreground/60">
                  Voraussetzungen
                </p>
                <ul className="mt-2 space-y-1.5">
                  {v.braucht.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              Was Sie vorbereiten sollten
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {VORBEREITUNG.map((item) => (
                <div key={item.titel} className="rounded-2xl border border-border bg-white p-5">
                  <item.icon className="h-7 w-7 text-primary" aria-hidden />
                  <h3 className="mt-4 font-bold text-foreground">{item.titel}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Ablauf am Liefertag</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ABLAUF.map((item) => (
              <div key={item.schritt}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                  {item.schritt}
                </span>
                <h3 className="mt-4 font-bold text-foreground">{item.titel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Unsicher, ob die Zufahrt reicht?</h2>
              <p className="mt-2 text-foreground/70">
                Schicken Sie uns ein Foto der Stellfläche und der Einfahrt. Wir sagen Ihnen vorab,
                mit welchem Fahrzeug es geht.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Zufahrt prüfen lassen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
