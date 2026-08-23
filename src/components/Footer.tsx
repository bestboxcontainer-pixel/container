import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/content/legal";

const CONTAINER_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/sortiment#lagercontainer", label: "Lagercontainer" },
  { href: "/sortiment#buerocontainer", label: "Bürocontainer" },
  { href: "/sortiment#seecontainer", label: "Seecontainer" },
] as const;

/** Pages de conseil : ce sont elles qui captent la recherche organique. */
const RATGEBER_LINKS = [
  { href: "/container-masse", label: "Maße & Typen" },
  { href: "/zustandsklassen", label: "Zustandsklassen" },
  { href: "/lieferung", label: "Lieferung & Aufstellung" },
  { href: "/faq", label: "Häufige Fragen" },
] as const;

/**
 * Pages de service et espace client. Le § 312d BGB impose que les conditions
 * de livraison, de paiement et de rétractation soient joignables depuis chaque
 * page : le pied de page est l'endroit où l'acheteur les cherche.
 */
const SERVICE_LINKS = [
  { href: "/versand", label: "Versand & Lieferung" },
  { href: "/zahlungsarten", label: "Zahlungsarten" },
  { href: "/retoure", label: "Retoure" },
  { href: "/konto", label: "Kundenkonto" },
  { href: "/merkliste", label: "Merkliste" },
] as const;

const COMPANY_LINKS = [
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const LEGAL_LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
  { href: "/widerruf", label: "Widerrufsbelehrung" },
  { href: "/elektroaltgeraete", label: "Elektroaltgeräte" },
] as const;

export function Footer() {
  return (
    <footer className="border-t-4 border-signal bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-badge.png"
              alt="BBC Best Box Containerhandel e.K."
              width={160}
              height={160}
              className="h-9 w-9 shrink-0"
            />
            <div className="leading-none">
              <p className="text-base font-black text-white">
                BBC <span className="text-signal">Best Box</span>
              </p>
              <p className="mt-0.5 text-xs font-bold text-white">Containerhandel e.K.</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Verkauf und Vermietung von See-, Lager-, Büro- und Sonderfahrzeugcontainern —
            neu und gebraucht, deutschlandweite Lieferung.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden />
              <span>
                {COMPANY.street}, {COMPANY.city}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-signal" aria-hidden />
              <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`} className="hover:text-white">
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-signal" aria-hidden />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                {COMPANY.email}
              </a>
            </li>
          </ul>
        </div>

        <FooterColumn title="Container" links={CONTAINER_LINKS} />
        <FooterColumn title="Ratgeber" links={RATGEBER_LINKS} />
        <FooterColumn title="Service" links={SERVICE_LINKS} />
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
