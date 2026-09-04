import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { ContactMap } from "@/components/ContactMap";
import { COMPANY } from "@/content/legal";

export const metadata: Metadata = {
  title: "Kontakt | BBC Best Box Containerhandel e.K.",
  description: "Kontaktieren Sie BBC Best Box Containerhandel e.K. für Ihre Anfrage zu Containerkauf oder -miete.",
};

export default function KontaktPage() {
  return (
    <>
      <Header variant="overlay" />
      <main className="flex-1">
        <section className="bg-secondary pt-[var(--header-height)] text-secondary-foreground">
          <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-wide text-signal">Kontakt</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
              Sprechen Sie mit uns
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Ob Kauf, Miete oder Sonderanfertigung: Schildern Sie uns Ihr Vorhaben, wir melden
              uns zeitnah mit einem passenden Angebot.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-xl font-black text-foreground">Kontaktdaten</h2>
              <ul className="mt-6 flex flex-col gap-5 text-sm text-foreground/80">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    {COMPANY.name}
                    <br />
                    {COMPANY.street}
                    <br />
                    {COMPANY.city}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`} className="hover:text-primary">
                    {COMPANY.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                    {COMPANY.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>Montag bis Freitag, 8 bis 18 Uhr</span>
                </li>
              </ul>
            </div>

            <ContactForm />
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 text-xl font-black text-foreground">Anfahrt</h2>
          <ContactMap />
        </section>
      </main>
      <Footer />
    </>
  );
}
