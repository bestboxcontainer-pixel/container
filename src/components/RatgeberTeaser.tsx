import { ArrowRight, ClipboardList, Ruler, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Renvoie vers des pages qui existent déjà, jusque-là seulement listées au pied de page. */
const GUIDES = [
  {
    icon: Ruler,
    title: "Maße & Typen",
    text: "Außen- und Innenmaße, Türöffnung, Gewicht und Volumen aller Container im Vergleich.",
    href: "/container-masse",
  },
  {
    icon: Truck,
    title: "Lieferung & Aufstellung",
    text: "Wie die Anlieferung abläuft, welcher Untergrund nötig ist und was der Aufbauservice kostet.",
    href: "/lieferung",
  },
  {
    icon: ShieldCheck,
    title: "Zustandsklassen",
    text: "Was „neu“, „geprüft gebraucht“ und die anderen Klassen konkret bedeuten.",
    href: "/zustandsklassen",
  },
  {
    icon: ClipboardList,
    title: "Häufige Fragen",
    text: "Genehmigung, Untergrund, Lieferzeit: die Antworten auf die häufigsten Fragen vor dem Kauf.",
    href: "/faq",
  },
] as const;

export function RatgeberTeaser() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Ratgeber</p>
      <h2 className="mt-3 max-w-xl text-2xl font-black text-foreground sm:text-3xl">
        Bevor Sie anfragen: die wichtigsten Antworten
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <guide.icon className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 font-bold text-foreground">{guide.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{guide.text}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Mehr erfahren
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
