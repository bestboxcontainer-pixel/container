import type { Metadata } from "next";
import { ArrowRight, Ruler, Scale, Warehouse } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { SizeSection } from "@/components/SizeSection";
import { Footer } from "@/components/Footer";
import { CONTAINER_TYPEN } from "@/lib/containerMasse";

export const metadata: Metadata = {
  title: "Container Maße & Typen | BBC Best Box Containerhandel e.K.",
  description:
    "Alle Maße auf einen Blick: 10, 20, 40 Fuß und High Cube. Außen- und Innenmaße, Türöffnung, Leergewicht, Nutzlast und Volumen im Vergleich.",
};


const HINWEISE = [
  {
    icon: Ruler,
    title: "Außen oder innen messen",
    text: "Für die Stellfläche zählt das Außenmaß, für die Ladung das Innenmaß. Zwischen beiden liegen rund 8 cm Wandaufbau in der Breite.",
  },
  {
    icon: Scale,
    title: "Nutzlast ist nicht Tragfähigkeit",
    text: "Die angegebene Nutzlast gilt für den Seetransport. Was Sie tatsächlich einlagern dürfen, hängt zusätzlich vom Untergrund ab.",
  },
  {
    icon: Warehouse,
    title: "High Cube heißt 30 cm mehr",
    text: "Ein High Cube ist genauso lang und breit wie die Standardversion, aber rund 30 cm höher. Bei Ausbauten ist das der entscheidende Unterschied.",
  },
] as const;

export default function ContainerMassePage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Maße & Typen</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Container-Maße auf einen Blick
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Von 10 bis 45 Fuß: Außen- und Innenmaße, Türöffnung, Gewichte und Volumen im
              direkten Vergleich, damit Sie vor der Anfrage wissen, was auf Ihr Grundstück passt.
            </p>
          </div>
        </section>

        {/* Vergleichstabelle, auf schmalen Displays horizontal scrollbar */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Alle Typen im Vergleich</h2>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Alle Angaben in Millimetern, in der Reihenfolge Länge × Breite × Höhe.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-3 pr-4 font-bold text-foreground">Typ</th>
                  <th className="py-3 pr-4 font-bold text-foreground">Außenmaß</th>
                  <th className="py-3 pr-4 font-bold text-foreground">Innenmaß</th>
                  <th className="py-3 pr-4 font-bold text-foreground">Türöffnung</th>
                  <th className="py-3 pr-4 font-bold text-foreground">Leergewicht</th>
                  <th className="py-3 pr-4 font-bold text-foreground">Nutzlast</th>
                  <th className="py-3 font-bold text-foreground">Volumen</th>
                </tr>
              </thead>
              <tbody>
                {CONTAINER_TYPEN.map((typ) => (
                  <tr key={typ.id} className="border-b border-border align-top">
                    <td className="py-4 pr-4">
                      <span className="block font-bold text-foreground">{typ.name}</span>
                      <span className="mt-0.5 block text-xs text-foreground/60">{typ.kurz}</span>
                    </td>
                    <td className="py-4 pr-4 text-foreground/80 tabular-nums">{typ.aussen}</td>
                    <td className="py-4 pr-4 text-foreground/80 tabular-nums">{typ.innen}</td>
                    <td className="py-4 pr-4 text-foreground/80 tabular-nums">{typ.tuer}</td>
                    <td className="py-4 pr-4 text-foreground/80 tabular-nums">{typ.leer}</td>
                    <td className="py-4 pr-4 text-foreground/80 tabular-nums">{typ.nutzlast}</td>
                    <td className="py-4 font-semibold text-primary tabular-nums">{typ.volumen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-foreground/60">
            Normmaße nach ISO 668. Es handelt sich um Nennwerte: Wandaufbau, Bodenkonstruktion
            und Fertigungstoleranzen führen je nach Hersteller und Baujahr zu Abweichungen von
            wenigen Millimetern. Verbindlich sind die Maße im konkreten Angebot.
          </p>
        </section>

        <SizeSection />

        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              Worauf es beim Messen ankommt
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {HINWEISE.map((hinweis) => (
                <div key={hinweis.title} className="rounded-2xl border border-border bg-white p-5">
                  <hinweis.icon className="h-7 w-7 text-primary" aria-hidden />
                  <h3 className="mt-4 font-bold text-foreground">{hinweis.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{hinweis.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Unsicher, welche Größe passt?</h2>
              <p className="mt-2 text-foreground/70">
                Schildern Sie uns, was hinein soll und wie viel Platz Sie haben. Wir sagen Ihnen,
                welcher Typ dafür der richtige ist.
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
