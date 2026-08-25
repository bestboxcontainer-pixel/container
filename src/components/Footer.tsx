import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/content/legal";

/**
 * Pied de page.
 *
 * Il portait six colonnes et vingt-trois liens sur une seule rangée, dont deux
 * colonnes de deux et quatre entrées : à l'écran, une grille irrégulière que
 * l'oeil ne pouvait pas parcourir. Trois colonnes de taille comparable la
 * remplacent, et les mentions légales descendent dans la barre du bas, qui est
 * l'endroit où on les cherche.
 *
 * Aucun lien n'est perdu au passage : le § 312d BGB impose que les conditions
 * de livraison, de paiement et de rétractation soient joignables depuis chaque
 * page, et les pages de conseil captent la recherche organique. Elles sont donc
 * redistribuées, pas supprimées.
 */

const CONTAINER_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/ankauf", label: "Container-Ankauf" },
  { href: "/sortiment#lagercontainer", label: "Lagercontainer" },
  { href: "/sortiment#buerocontainer", label: "Bürocontainer" },
  { href: "/sortiment#seecontainer", label: "Seecontainer" },
  { href: "/container-masse", label: "Maße & Typen" },
] as const;

const SERVICE_LINKS = [
  { href: "/zustandsklassen", label: "Zustandsklassen" },
  { href: "/lieferung", label: "Lieferung & Aufstellung" },
  { href: "/versand", label: "Versand & Lieferung" },
  { href: "/zahlungsarten", label: "Zahlungsarten" },
  { href: "/retoure", label: "Retoure" },
  { href: "/faq", label: "Häufige Fragen" },
] as const;

const COMPANY_LINKS = [
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/konto", label: "Kundenkonto" },
  { href: "/merkliste", label: "Merkliste" },
  { href: "/suche", label: "Suche" },
] as const;

/** Descendues dans la barre du bas : ce sont des mentions, pas de la navigation. */
const LEGAL_LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
  { href: "/widerruf", label: "Widerrufsbelehrung" },
  { href: "/elektroaltgeraete", label: "Elektroaltgeräte" },
] as const;

export function Footer() {
  const telephone = COMPANY.phone.replace(/\s+/g, "");

  return (
    // Un filet orange de deux pixels au lieu de quatre : il signe le pied de
    // page sans le surmonter d'une barre pleine.
    <footer className="border-t-2 border-signal bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
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
            Verkauf und Vermietung von See-, Lager-, Büro- und Sonderfahrzeugcontainern
            neu und gebraucht, deutschlandweite Lieferung.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden />
              <span>
                {COMPANY.street}, {COMPANY.city}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-signal" aria-hidden />
              <a href={`tel:${telephone}`} className="transition-colors hover:text-white">
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-signal" aria-hidden />
              <a href={`mailto:${COMPANY.email}`} className="transition-colors hover:text-white">
                {COMPANY.email}
              </a>
            </li>
          </ul>
        </div>

        <FooterColumn title="Container" links={CONTAINER_LINKS} />
        <FooterColumn title="Service & Ratgeber" links={SERVICE_LINKS} />
        <FooterColumn title="Unternehmen" links={COMPANY_LINKS} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Raison sociale, gérant et registre sur une seule ligne : ce sont
              des mentions d'identité, elles se lisent d'un bloc. */}
          <p className="text-xs leading-relaxed text-white/45">
            © {new Date().getFullYear()} {COMPANY.name} · Inhaber: {COMPANY.owner} ·{" "}
            {COMPANY.register}
          </p>
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
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/65 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
