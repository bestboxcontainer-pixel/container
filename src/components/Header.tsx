import Link from "next/link";
import { Heart, Menu, Search, ShoppingCart, User } from "lucide-react";
import { BrandLogo } from "@/components/icons";
import type { NavLink } from "@/types/home";

const mainNavLinks: NavLink[] = [
  { label: "Küche", href: "/kueche" },
  { label: "Kühlen & Gefrieren", href: "/kuehlen-gefrieren" },
  { label: "Waschen & Trocknen", href: "/waschen-trocknen" },
  { label: "Kleingeräte", href: "/kleingeraete" },
  { label: "TV & Audio", href: "/tv-audio" },
  { label: "Reinigung", href: "/reinigung" },
  { label: "Klimageräte", href: "/klimageraete" },
  { label: "Smart Home", href: "/smart-home" },
  { label: "Angebote", href: "/angebote" },
];

export function Header() {
  return (
    <header className="w-full">
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-3 px-3 py-3">
          <button
            type="button"
            aria-label="Alle Kategorien"
            className="flex items-center gap-2 rounded-sm bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
            <span className="hidden sm:inline">Kategorien</span>
          </button>

          <Link href="/" aria-label="Startseite" className="flex items-center gap-2 text-primary">
            <BrandLogo className="h-8 w-8" />
            <span className="hidden text-lg font-black tracking-tight text-white sm:inline">
              ELEKTROSTORE
            </span>
          </Link>

          <div className="order-3 w-full sm:order-2 sm:flex-1">
            <div className="flex h-10 items-stretch overflow-hidden rounded-sm">
              <input
                type="search"
                placeholder="Wonach suchen Sie?"
                aria-label="Suchen"
                className="w-full flex-1 border-0 bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Suchen"
                className="flex items-center justify-center bg-primary px-4 text-primary-foreground hover:brightness-110"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="order-2 ml-auto flex items-center gap-4 text-xs sm:order-3 sm:ml-0">
            <Link href="/konto" className="flex flex-col items-center gap-1 hover:text-primary">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Konto</span>
            </Link>
            <Link href="/merkliste" className="flex flex-col items-center gap-1 hover:text-primary">
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Merkliste</span>
            </Link>
            <Link href="/warenkorb" className="flex flex-col items-center gap-1 hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Warenkorb</span>
            </Link>
          </nav>
        </div>
      </div>

      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-screen-xl flex-wrap justify-center gap-x-5 gap-y-1 px-3 py-2 text-sm font-semibold">
          {mainNavLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-foreground hover:text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
