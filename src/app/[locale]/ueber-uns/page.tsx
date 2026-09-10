import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Building2, HandCoins, Mail, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/content/legal";
import { WebPageJsonLd } from "@/components/seo/WebPageJsonLd";

export const metadata: Metadata = {
  title: "Über uns | BBC Best Box Containerhandel e.K.",
  description:
    "BBC Best Box Containerhandel e.K.: seit 2006 inhabergeführter Handel mit See-, Lager-, Büro- und Sanitärcontainern, Sitz in Großensee, Schleswig-Holstein. Kauf, Vermietung und Sonderanfertigung, Lieferung in Deutschland und Österreich.",
  openGraph: {
    images: [{ url: "/images/ueber-uns-hero.jpg", width: 1536, height: 1024, alt: "Containerplatz von BBC Best Box Containerhandel e.K." }],
  },
};

// Dernière réécriture substantielle du texte ci-dessous : à bumper à la main
// en même temps que le contenu, jamais automatiquement (voir WebPageJsonLd).
const DATE_PUBLICATION = "2026-07-28";
const DATE_MODIFICATION = "2026-09-09";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Verlässlichkeit",
    text: "Was wir zusagen, halten wir, bei Lieferterminen ebenso wie beim Zustand jedes Containers.",
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

const MEILENSTEINE = [
  {
    jahr: "2006",
    text: `Eintragung im Handelsregister am ${COMPANY.registeredSince}. Der Handel startet mit gebrauchten See- und Lagercontainern für Betriebe aus der Region.`,
  },
  {
    jahr: "2010–2018",
    text: "Das Sortiment wächst um ausgebaute Büro- und Sanitärcontainer. Feste Speditionspartner mit Absetzkipper und Kranfahrzeug sichern die deutschlandweite Zustellung.",
  },
  {
    jahr: "Heute",
    text: "Vom Standort Großensee aus beliefern wir Gewerbe, Bauwesen und Privatkunden in Deutschland und Österreich, mit eigenem Bestand, geprüfter Gebrauchtware und Sonderanfertigungen nach Maß.",
  },
] as const;

export default function UeberUnsPage() {
  return (
    <>
      <WebPageJsonLd
        path="/ueber-uns"
        name="Seit 2006 inhabergeführter Containerhandel aus Schleswig-Holstein"
        datePublished={DATE_PUBLICATION}
        dateModified={DATE_MODIFICATION}
      />
      <Header variant="overlay" />
      <main className="flex-1">
        {/* Hero mit Titelbild */}
        <section className="relative isolate overflow-hidden bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <Image
            src="/images/ueber-uns-hero.jpg"
            alt="Containerplatz mit Reachstacker und Speditionsfahrzeug am Tor von BBC Best Box Containerhandel e.K."
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
          <div className="mx-auto max-w-screen-xl px-4 py-20 sm:px-6 md:py-28">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Über uns</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl md:text-5xl">
              Seit 2006 inhabergeführter Containerhandel aus Schleswig-Holstein
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              {COMPANY.name} handelt seit dem {COMPANY.registeredSince} mit Containern für Gewerbe,
              Bauwesen und Privatkunden: von {COMPANY.locality} aus, in Deutschland und Österreich.
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
                jede Anfrage persönlich ansprechbar ist. Als eingetragener Kaufmann haftet der
                Inhaber persönlich und unbeschränkt, das ist gelebte Verantwortung, kein Kleingedrucktes.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Unser Schwerpunkt liegt auf Verkauf und Vermietung von See-, Lager-, Büro-,
                Wohn- und Sanitärcontainern: neu und geprüft gebraucht, ergänzt um
                Sonderanfertigungen nach Kundenwunsch. Jeder gebrauchte Container wird vor dem
                Verkauf auf Dichtigkeit, Boden und Statik geprüft und, wo nötig, instand gesetzt.
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

        {/* Geschichte / Meilensteine */}
        <section className="border-t border-border bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-black text-foreground">Unsere Geschichte</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
              Aus einem regionalen Handel mit gebrauchten Containern ist ein Fachbetrieb für
              Kauf, Miete und Umbau geworden, der Kundschaft in ganz Deutschland und Österreich
              betreut. Was gleich geblieben ist: ehrliche Beratung, feste Ansprechpartner und
              Container, deren Zustand wir kennen, weil sie durch unsere Hände gehen.
            </p>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {MEILENSTEINE.map((m) => (
                <li key={m.jahr} className="rounded-sm border border-border bg-white p-5">
                  <p className="text-sm font-black text-primary">{m.jahr}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Unternehmensangaben */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-black text-foreground">
            {COMPANY.name} auf einen Blick
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <dl className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-bold text-foreground">Anschrift</dt>
                  <dd className="mt-1 text-foreground/70">
                    {COMPANY.name}
                    <br />
                    {COMPANY.street}
                    <br />
                    {COMPANY.city}
                    <br />
                    {COMPANY.country}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-bold text-foreground">Telefon</dt>
                  <dd className="mt-1 text-foreground/70">
                    <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`} className="hover:text-primary">
                      {COMPANY.phone}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-bold text-foreground">E-Mail</dt>
                  <dd className="mt-1 text-foreground/70">
                    <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                      {COMPANY.email}
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
            <dl className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-bold text-foreground">Handelsregister</dt>
                  <dd className="mt-1 text-foreground/70">
                    Eintragung im Handelsregister seit dem {COMPANY.registeredSince}
                    <br />
                    Registergericht und Registernummer: {COMPANY.register}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-bold text-foreground">Rechtsform</dt>
                  <dd className="mt-1 text-foreground/70">
                    Eingetragener Kaufmann (e.K.), Inhaber {COMPANY.owner}, persönlich und
                    unbeschränkt haftend.
                  </dd>
                </div>
              </div>
              <p className="text-xs text-foreground/60">
                Vollständige Pflichtangaben nach § 5 DDG finden Sie im{" "}
                <Link href="/impressum" className="text-primary hover:underline">
                  Impressum
                </Link>
                .
              </p>
            </dl>
          </div>
        </section>

        <section className="bg-accent">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Lernen Sie uns kennen</h2>
              <p className="mt-2 text-foreground/70">
                Rufen Sie an oder schreiben Sie uns: wir beraten Sie gerne zu Ihrem Vorhaben.
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
