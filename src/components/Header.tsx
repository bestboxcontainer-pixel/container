import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Phone } from "lucide-react";
import { COMPANY } from "@/content/legal";

const NAV_LINKS = [
  { href: "/sortiment", label: "Sortiment" },
  { href: "/vermietung", label: "Vermietung" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/**
 * En-tête du site vitrine (marketing), distinct du back-office.
 * Marque en texte + pictogramme : pas de logo image dédié pour l'instant.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-secondary/95 text-secondary-foreground backdrop-blur supports-[backdrop-filter]:bg-secondary/80">
      <div className="mx-auto flex max-w-screen-xl items-center gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
          <Image
            src="/images/logo-badge.png"
            alt="BBC Best Box Containerhandel e.K."
            width={160}
            height={160}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-tight text-white">
              BBC <span className="text-gold">Best Box</span>
            </span>
            <span className="hidden text-[11px] font-bold tracking-wide text-white sm:inline">
              Containerhandel e.K.
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 text-[13px] font-semibold uppercase tracking-wide md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`}
          className="ml-auto hidden items-center gap-2 text-sm font-semibold text-white/85 hover:text-white sm:flex md:ml-0"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {COMPANY.phone}
        </a>

        <Link
          href="/kontakt"
          className="ml-auto rounded-full bg-gradient-to-b from-[#5B82CE] to-[#33509E] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(59,124,245,0.25)] transition-transform hover:scale-[1.02] hover:shadow-[0_2px_14px_rgba(59,124,245,0.35)] md:ml-0"
        >
          Anfrage stellen
        </Link>
      </div>

      <nav className="flex items-center gap-5 overflow-x-auto border-t border-white/10 px-4 py-2 text-sm font-medium md:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-white/80">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
