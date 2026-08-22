import { Link } from "@/i18n/navigation";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/content/legal";
import { ContainerGlyph } from "@/components/ContainerGlyph";

const CONTAINER_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/sortiment#lagercontainer", label: "Lagercontainer" },
  { href: "/sortiment#buerocontainer", label: "Bürocontainer" },
  { href: "/sortiment#seecontainer", label: "Seecontainer" },
] as const;

const COMPANY_LINKS = [
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const LEGAL_LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      {/* Bandeau CTA */}
      <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent">
        <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-lg font-black text-white">Bereit für Ihr Container-Projekt?</p>
            <p className="mt-1 text-sm text-white/60">Persönliche Beratung, faire Konditionen.</p>
          </div>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-[#9a4315] px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:shadow-md"
          >
            Kontakt aufnehmen
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <ContainerGlyph className="h-4.5 w-4.5" />
            </span>
            <div className="leading-none">
              <p className="text-base font-black text-white">
                BBC <span className="text-primary">Best Box</span>
              </p>
              <p className="mt-0.5 text-xs text-white/55">Containerhandel e.K.</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Verkauf und Vermietung von See-, Lager-, Büro- und Sonderfahrzeugcontainern —
            neu und gebraucht, deutschlandweite Lieferung.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                {COMPANY.street}, {COMPANY.city}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`} className="hover:text-white">
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                {COMPANY.email}
              </a>
            </li>
          </ul>
        </div>

        <FooterColumn title="Container" links={CONTAINER_LINKS} />
        <FooterColumn title="Unternehmen" links={COMPANY_LINKS} />
        <FooterColumn title="Rechtliches" links={LEGAL_LINKS} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-4 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}
          </p>
          <p>Inhaber: {COMPANY.owner} · {COMPANY.register}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-white/90">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
