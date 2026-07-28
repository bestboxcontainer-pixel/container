import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Search, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CategoryMenu } from "@/components/CategoryMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CartIndicator } from "@/components/cart/CartIndicator";
import { WishlistIndicator } from "@/components/wishlist/WishlistIndicator";

export async function Header() {
  const t = await getTranslations("header");
  const common = await getTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-3 px-3 py-3">
          <CategoryMenu />

          <Link
            href="/"
            aria-label={t("homeAriaLabel")}
            className="flex items-center rounded-sm bg-white px-2 py-1.5"
          >
            <Image
              src="/images/logo-full.png"
              alt={t("logoAlt")}
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
                placeholder={common("searchPlaceholder")}
                aria-label={t("search")}
                className="w-full flex-1 border-0 bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label={t("search")}
                className="flex items-center justify-center bg-primary px-4 text-primary-foreground hover:brightness-110"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="order-2 ml-auto flex items-center gap-3 text-xs sm:order-3 sm:ml-0 sm:gap-4">
            {/* Espace client. La cible est toujours « /konto » : cette page rend
                le tableau de bord au client connecté et renvoie les autres vers
                « /konto/anmelden » (requireCustomer). Lire le cookie de session
                ici forcerait le rendu dynamique de tout le catalogue, qui est
                prérendu — le lien resterait juste, mais les fiches produits
                perdraient leur rendu statique. */}
            <Link
              href="/konto"
              prefetch={false}
              className="flex flex-col items-center gap-1 hover:text-primary"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">{common("account")}</span>
            </Link>
            {/* Comme le panier, la liste de souhaits vit dans le navigateur */}
            <WishlistIndicator />
            {/* Le compteur d'articles vit côté client : le panier est en localStorage */}
            <CartIndicator className="relative flex flex-col items-center gap-1 hover:text-primary" />
            {/* Choix de la langue : reste visible et lisible dès le format mobile */}
            <LanguageSwitcher className="shrink-0 border-l border-white/15 pl-3" />
          </nav>
        </div>
      </div>
    </header>
  );
}
