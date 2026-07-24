import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingCart, User } from "lucide-react";
import { CategoryMenu } from "@/components/CategoryMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-3 px-3 py-3">
          <CategoryMenu />

          <Link
            href="/"
            aria-label="Hausgeräte Pfeffer – Startseite"
            className="flex items-center rounded-sm bg-white px-2 py-1.5"
          >
            <Image
              src="/images/logo-full.png"
              alt="Hausgeräte Pfeffer"
              width={1242}
              height={406}
              priority
              className="h-8 w-auto sm:h-9"
            />
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
    </header>
  );
}
