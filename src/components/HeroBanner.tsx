import Image from "next/image";
import Link from "next/link";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="relative mx-auto h-[280px] max-w-screen-xl sm:h-[360px]">
        <Image
          src="/images/hero/kitchen-hero.jpg"
          alt="Moderne Küche mit hochwertigen Einbaugeräten"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/40 to-transparent" />
        <div className="animate-in fade-in slide-in-from-left-8 relative z-10 flex h-full max-w-lg flex-col justify-center gap-4 px-6 duration-700 sm:px-10">
          <span className="inline-block w-fit rounded-sm bg-accent px-2 py-1 text-xs font-black text-accent-foreground">
            SOMMER SALE
          </span>
          <h1 className="text-2xl leading-tight font-black text-white sm:text-4xl">
            Bis zu 30% auf Haushaltsgeräte
          </h1>
          <p className="text-sm text-white/80 sm:text-base">
            Kühlen, Waschen, Kochen &amp; Multimedia — jetzt zu Bestpreisen sichern.
          </p>
          <Link
            href="/angebote"
            className="w-fit rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            Jetzt shoppen
          </Link>
        </div>
      </div>
    </section>
  );
}
