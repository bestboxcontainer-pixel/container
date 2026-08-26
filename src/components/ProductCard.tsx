import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { formatRating } from "@/lib/formatRating";
import type { Product } from "@/types/home";

/** Au-delà de trois arguments, les vignettes d'une même ligne se désalignent. */
const BULLETS_AFFICHES = 3;

// Composant partagé : il est rendu côté serveur (grilles de la page d'accueil)
// comme côté client (navigateur de catégorie filtrable). D'où les hooks
// "useTranslations"/"useLocale", qui fonctionnent dans les deux contextes.
export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("product");
  const locale = useLocale();

  return (
    <div className="group relative h-full">
      {product.id && (
        <WishlistButton
          className="absolute top-3 right-3 z-20"
          item={{
            productId: product.id,
            slug: product.slug ?? "",
            brand: product.brand,
            name: product.name,
            image: product.image,
            path: product.href,
            priceCents: product.priceCents ?? 0,
          }}
        />
      )}

      <Link
        href={product.href}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
      >
        {/* Format 4/3 plutôt que carré : un conteneur est un objet long, et le
            recadrage carré lui coupait les deux extrémités. Le badge est posé
            sur l'image, ce qui évite de réserver une ligne vide sur les
            vignettes qui n'en ont pas. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* Un produit sans visuel hérite de celui de sa catégorie ; si elle
              n'en a pas non plus, `image` vaut la chaîne vide. La passer à
              <Image> fait recharger la page entière par le navigateur et
              affiche une icône d'image brisée : on rend un aplat à la place. */}
          {product.image ? (
            <Image
              src={product.image}
              alt={product.alt}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-accent">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/40">
                {product.brand}
              </span>
            </div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 z-10 rounded-full bg-badge px-2.5 py-1 text-[11px] font-bold text-badge-foreground shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {product.brand}
          </p>
          <p className="mt-1.5 line-clamp-2 font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </p>

          {/* L'étoile n'apparaît que si elle repose sur des avis de clients réels.
              Sans cette condition, la vignette affichait la note rédactionnelle sous
              la même étoile qu'une moyenne d'avis : rien ne les distinguait pour
              l'acheteur. La note maison reste lisible sur la fiche produit, où elle
              est nommée « Redaktionelle Einschätzung ». */}
          {typeof product.rating === "number" && (product.reviewCount ?? 0) > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 fill-signal text-signal" aria-hidden />
              {formatRating(product.rating, locale)}
              <span className="font-normal text-muted-foreground">({product.reviewCount})</span>
            </p>
          )}

          {/* Rien à lister : la liste ne sort pas du tout, plutôt qu'un bloc
              vide qui écarte le prix du titre sans rien dire. */}
          {product.bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {product.bullets.slice(0, BULLETS_AFFICHES).map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-[7px] h-px w-2.5 shrink-0 bg-primary/50" aria-hidden />
                {/* Deux lignes : les cotes « 6.058 × 2.438 × 2.591 mm » ne
                    tiennent pas sur une seule et se faisaient couper au milieu
                    du chiffre, ce qui est pire que pas de cote du tout. */}
                <span className="line-clamp-2">{bullet}</span>
              </li>
            ))}
          </ul>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3.5">
            <div className="flex items-baseline gap-2">
              {product.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
              )}
              <span className="text-lg font-black text-primary">{product.price}</span>
            </div>
            {product.inStock === false && (
              <span className="text-[11px] font-semibold text-muted-foreground">{t("onRequest")}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
