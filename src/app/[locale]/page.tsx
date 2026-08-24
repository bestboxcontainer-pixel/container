import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PhotoHeroCarousel, type PhotoSlide } from "@/components/PhotoHeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { SizeItem } from "@/components/SizeItem";
import { HOME_CATEGORY_CARDS } from "@/lib/homeCategoryCards";
import { HOME_SIZE_SECTION_TOKENS } from "@/lib/homeLayoutTokens";
import { HOME_FAQS, HOME_SIZE_GROUPS } from "@/lib/homeSections";
import { getCategoryPages } from "@/server/store";
import type { Product } from "@/types/home";

export const metadata: Metadata = {
  title: "BBC Best Box Containerhandel e.K. | Container kaufen & mieten",
  description:
    "Lager-, Büro-, Wohn- und Sanitärcontainer, neu und gebraucht. Verkauf und Vermietung, Lieferung deutschlandweit.",
};

const STATS = [
  { value: "500+", label: "Container im Bestand" },
  { value: "Bundesweit", label: "Lieferung & Aufstellung" },
  { value: "Kauf & Miete", label: "Flexible Modelle" },
  { value: "Persönlich", label: "Beratung vor Ort" },
] as const;

/** Faits vérifiables sur l'entreprise (voir COMPANY.registeredSince = 2006). */
const TRUST_FACTS = [
  "Seit 2006 am Markt",
  "Inhabergeführtes Unternehmen",
  "500+ Container im Bestand",
  "Neu & geprüft gebraucht",
  "Lieferung deutschlandweit",
  "Persönliche Beratung",
] as const;

/**
 * Echte Fotos (keine KI-Bilder) unter freier Lizenz von Wikimedia Commons,
 * siehe Bildnachweis auf der Impressum-Seite für Quelle/Lizenz je Bild.
 */
const HERO_PHOTOS: readonly PhotoSlide[] = [
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403193/bbc-best-box/site/hero-port-1-8hwmc1.jpg",
    alt: "Stapel von Frachtcontainern im Hafen",
  },
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403201/bbc-best-box/site/hero-rotterdam-2-vnmxx4.jpg",
    alt: "Containerstapel im Hafen Rotterdam",
  },
  {
    src: "https://res.cloudinary.com/syxnblqk/image/upload/f_auto,q_auto/v1787403212/bbc-best-box/site/hero-hamburg-3-xgx1wi.jpg",
    alt: "Luftaufnahme des Container-Terminals im Hafen Hamburg",
  },
] as const;

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Geprüfte Qualität",
    text: "Jeder Container wird vor der Auslieferung technisch geprüft, neu wie gebraucht.",
  },
  {
    icon: Clock,
    title: "Schnelle Verfügbarkeit",
    text: "Großer Bestand am Lager: kurze Lieferzeiten statt langer Wartezeit auf Bestellung.",
  },
  {
    icon: MapPin,
    title: "Lieferung deutschlandweit",
    text: "Anlieferung und Aufstellung direkt auf Ihrem Gelände, organisiert aus einer Hand.",
  },
] as const;

const STEPS = [
  { step: "1", title: "Anfrage stellen", text: "Container-Typ, Maße und Einsatzort schildern: per Telefon, E-Mail oder Formular." },
  { step: "2", title: "Angebot erhalten", text: "Wir prüfen Verfügbarkeit und Zustand und melden uns mit einem passenden Angebot." },
  { step: "3", title: "Liefern lassen", text: "Nach Zusage liefern wir termingerecht und stellen den Container bei Ihnen auf." },
] as const;

/**
 * Extrait du catalogue pour la page d'accueil.
 *
 * Prélèvement à tour de rôle plutôt que les huit premiers : le catalogue est
 * trié par catégorie, et une simple troncature ne montrerait que des
 * Lagercontainer. On fait donc un tour par catégorie avant d'en reprendre une.
 */
async function extraitDuCatalogue(maximum = 8): Promise<Product[]> {
  // Le reste de la page est statique : une base injoignable doit faire
  // disparaître la seule section qui en dépend, pas toute la page d'accueil.
  let pages: Awaited<ReturnType<typeof getCategoryPages>>;
  try {
    pages = await getCategoryPages();
  } catch (error) {
    console.error("[accueil] catalogue illisible, section produits masquée", error);
    return [];
  }

  const files = pages.map((page) => [...page.products]).filter((file) => file.length > 0);

  const extrait: Product[] = [];
  for (let rang = 0; extrait.length < maximum; rang += 1) {
    const restantes = files.filter((file) => file.length > rang);
    if (restantes.length === 0) break;
    for (const file of restantes) {
      if (extrait.length >= maximum) break;
      extrait.push(file[rang]);
    }
  }

  return extrait;
}

export default async function HomePage() {
  const produits = await extraitDuCatalogue();
  const [lengthGroup, widthGroup, heightGroup] = HOME_SIZE_GROUPS;

  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <PhotoHeroCarousel slides={HERO_PHOTOS} />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />

          <div className="relative z-10 mx-auto grid max-w-screen-xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
                Container kaufen und mieten: schnell, zuverlässig, deutschlandweit
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
                BBC Best Box Containerhandel beliefert Gewerbe, Baustellen und Privatkunden mit
                Lager-, Büro-, Wohn- und Sanitärcontainern: neu und gebraucht, aus eigenem
                Bestand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sortiment"
                  className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-bold text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
                >
                  Sortiment ansehen
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10"
                >
                  Unverbindlich anfragen
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-lg backdrop-blur-md">
              <div className="grid grid-cols-2 gap-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau de confiance défilant : faits vérifiables sur l'entreprise */}
        <section className="overflow-hidden border-y border-white/10 bg-secondary py-4">
          <div className="flex w-max animate-[defilement_28s_linear_infinite]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-10 pr-10">
                {TRUST_FACTS.map((fact) => (
                  <span
                    key={`${copy}-${fact}`}
                    className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-white/85"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
                    {fact}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Unsere Container */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                Unsere Container
              </p>
              <h2 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
                Fünf gefragte Kategorien, direkt im Überblick
              </h2>
            </div>
            <Link
              href="/sortiment"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              Ganzes Sortiment
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <p className="mt-4 max-w-2xl text-foreground/70">
            Von Seecontainer bis Sondercontainer: diese fünf Bereiche bilden die stärksten
            Anfragen im Tagesgeschäft ab und führen direkt zu den passenden Abschnitten im
            Sortiment.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {HOME_CATEGORY_CARDS.map((card) => (
              <Link
                key={card.id}
                href={`/sortiment#${card.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-[#d8e1f0] bg-white shadow-[0_24px_80px_-48px_rgba(22,43,95,0.45)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f8fd]">
                  <Image
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{card.text}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Kategorie ansehen
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Größen : bandeau sombre, containers posés sur une ligne de sol.
            Les visuels sont blancs sur fond transparent : sur le navy ils
            ressortent, et sans cadre autour c'est bien le container qu'on
            regarde. */}
        <section className={HOME_SIZE_SECTION_TOKENS.section}>
          <span className={HOME_SIZE_SECTION_TOKENS.glow} aria-hidden />
          <span className={HOME_SIZE_SECTION_TOKENS.glowSoft} aria-hidden />

          <div className={HOME_SIZE_SECTION_TOKENS.container}>
            <header className={HOME_SIZE_SECTION_TOKENS.header}>
              <div className="max-w-2xl">
                <p className={HOME_SIZE_SECTION_TOKENS.eyebrow}>Größenvielfalt</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] sm:text-3xl">
                  Verschiedene Größen – flexibel kombinierbar
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
                  Längen, Breiten und Höhen modular kombinieren – für jedes Projekt die passende
                  Dimension.
                </p>
              </div>

              <dl className={HOME_SIZE_SECTION_TOKENS.counterRow}>
                {HOME_SIZE_GROUPS.map((group) => (
                  <div key={group.id}>
                    <dt className="sr-only">{group.title}</dt>
                    <dd>
                      <span className={HOME_SIZE_SECTION_TOKENS.counterValue}>
                        {group.options.length}
                      </span>
                      <span className={HOME_SIZE_SECTION_TOKENS.counterLabel}>{group.title}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </header>

            <div className="mt-10">
              <div className={HOME_SIZE_SECTION_TOKENS.groupHead}>
                <h3 className={HOME_SIZE_SECTION_TOKENS.groupTitle}>{lengthGroup.title}</h3>
                <span className={HOME_SIZE_SECTION_TOKENS.groupRange}>{lengthGroup.subtitle}</span>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                {lengthGroup.options.map((option) => (
                  <SizeItem key={`laengen-${option.label}`} option={option} />
                ))}
              </ul>
            </div>

            <div className={HOME_SIZE_SECTION_TOKENS.specRow}>
              {[widthGroup, heightGroup].map((group) => (
                <div key={group.id}>
                  <div className={HOME_SIZE_SECTION_TOKENS.groupHead}>
                    <h3 className={HOME_SIZE_SECTION_TOKENS.groupTitle}>{group.title}</h3>
                    <span className={HOME_SIZE_SECTION_TOKENS.groupRange}>{group.subtitle}</span>
                  </div>

                  <ul
                    className={`mt-6 grid gap-x-5 gap-y-8 ${
                      group.options.length === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    {group.options.map((option) => (
                      <SizeItem key={`${group.id}-${option.label}`} option={option} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verfügbare Container : lecture réelle du catalogue, pas une liste
            écrite en dur. La section disparaît si le catalogue est vide, plutôt
            que d'afficher une grille creuse. */}
        {produits.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                    Verfügbare Container
                  </h2>
                  <p className="mt-3 max-w-xl text-foreground/70">
                    Ein Auszug aus dem Bestand, quer durch alle Kategorien. Maße, Zustandsklasse
                    und Preis stehen auf der jeweiligen Detailseite.
                  </p>
                </div>
                <Link
                  href="/sortiment"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Ganzes Sortiment
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {produits.map((produit) => (
                  <ProductCard key={produit.slug ?? produit.name} product={produit} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">FAQ</p>
            <h2 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
              Häufige Fragen zu unseren Containern
            </h2>
            <p className="mt-3 text-foreground/70">
              Die wichtigsten Punkte zu Verfügbarkeit, Größen, Lieferung und Sonderausbau auf
              einen Blick.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {HOME_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-[1.5rem] border border-[#d8e1f0] bg-white shadow-[0_20px_70px_-52px_rgba(22,43,95,0.42)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-black text-foreground sm:px-6 sm:py-5 sm:text-lg">
                  <span>{item.question}</span>
                  <span className="text-2xl leading-none text-primary transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/70 sm:px-6 sm:pb-6 sm:text-base">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Ablauf */}
        <section className="bg-muted">
          <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">Wie läuft die Lieferung ab?</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-y border-white/10 bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Bereit für Ihren Container?
              </h2>
              <p className="mt-2 text-white/75">
                Sprechen Sie mit uns: wir finden die passende Lösung für Ihr Projekt.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-bold uppercase tracking-wide text-signal-foreground shadow-sm transition-colors hover:bg-signal/90"
            >
              Jetzt Kontakt aufnehmen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Warum wir */}
        <section className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Warum BBC Best Box</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-border bg-muted p-5">
                <benefit.icon className="h-7 w-7 text-primary" aria-hidden />
                <h3 className="mt-4 font-bold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
