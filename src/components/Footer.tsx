import Link from "next/link";
import { CreditCard, Mail, Phone, ShieldCheck, Truck } from "lucide-react";
import type { NavLink } from "@/types/home";

const serviceLinks: NavLink[] = [
  { label: "Bestellstatus", href: "/bestellung" },
  { label: "Retoure & Reklamation", href: "/ruecksendung" },
  { label: "Widerrufsrecht", href: "/widerrufsrecht" },
  { label: "Kontakt", href: "/kontakt" },
];

const aboutLinks: NavLink[] = [
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Jobs & Karriere", href: "/jobs" },
  { label: "Presse", href: "/presse" },
  { label: "Partnerprogramm", href: "/partnerprogramm" },
];

const legalLinks: NavLink[] = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
  { label: "Cookie-Einstellungen", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 border-b border-white/10 pb-8 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">Schnelle Lieferung</p>
              <p className="text-xs text-white/60">In 1-3 Werktagen bei Ihnen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">2 Jahre Garantie</p>
              <p className="text-xs text-white/60">Auf alle Geräte</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">Sichere Zahlung</p>
              <p className="text-xs text-white/60">Rechnung, Kreditkarte, PayPal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 font-bold">Kontakt</h3>
            <p className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Link href="/kontakt" className="hover:underline">
                service@elektrostore.de
              </Link>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <Link href="tel:080012345" className="hover:underline">
                0800 123 45
              </Link>
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Service</h3>
            <ul className="space-y-1">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Über uns</h3>
            <ul className="space-y-1">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Rechtliches</h3>
            <ul className="space-y-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          <p>© {new Date().getFullYear()} ElektroStore. Alle Preise inkl. gesetzl. MwSt.</p>
        </div>
      </div>
    </footer>
  );
}
