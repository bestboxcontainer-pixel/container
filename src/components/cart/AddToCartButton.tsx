"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Minus, Plus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  /** Identifiant en base : c'est la seule donnée dont le serveur se sert. */
  productId: string;
  slug: string;
  brand: string;
  name: string;
  image: string;
  /** Chemin de la fiche produit, tel que fourni par `product.href`. */
  path: string;
  /** Prix unitaire TTC en centimes. */
  priceCents: number;
  stock: number;
  /** Affiche le sélecteur de quantité ; désactivé sur les vignettes de liste. */
  withQuantity?: boolean;
  /**
   * Achat direct : ajoute au panier puis enchaîne sur la caisse, sans
   * repasser par le panier. Réservé à la fiche produit, où c'est le choix
   * explicite du client face au devis — sur une vignette de liste, la
   * décision d'achat n'est pas encore prise.
   */
  withBuyNow?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  slug,
  brand,
  name,
  image,
  path,
  priceCents,
  stock,
  withQuantity = true,
  withBuyNow = false,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations("cart");
  const router = useRouter();
  const { add, ready, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const soldOut = stock <= 0;
  const disabled = soldOut || !ready;
  const maxQuantity = Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, stock));

  function handleAdd() {
    if (disabled) return;
    add({ productId, slug, brand, name, image, path, priceCents, stock }, quantity);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2500);

    // Le panier latéral se déroule aussitôt : le compteur qui s'incrémente à
    // l'autre bout de l'écran passe inaperçu, et l'on reclique en croyant que
    // rien ne s'est produit : l'article part alors en double.
    openDrawer();
  }

  /** Achat direct : même ajout, puis la caisse, sans repasser par le panier. */
  function handleBuyNow() {
    if (disabled) return;
    add({ productId, slug, brand, name, image, path, priceCents, stock }, quantity);
    router.push("/kasse");
  }

  const quantitySelector = withQuantity && !soldOut && (
    <div className="flex items-center rounded-sm border border-border">
      <button
        type="button"
        aria-label={t("decrease")}
        disabled={quantity <= 1}
        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-bold" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label={t("increase")}
        disabled={quantity >= maxQuantity}
        onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
        className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  const BOUTON = "flex flex-1 items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition-colors";

  const addToCartButton = (
    <button
      type="button"
      onClick={handleAdd}
      // `ready` évite qu'un clic parte avant que le magasin ne soit relu :
      // la quantité s'ajouterait alors à un panier considéré comme vide.
      disabled={disabled}
      aria-live="polite"
      className={cn(
        BOUTON,
        soldOut
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : added
            ? "bg-success text-white"
            : "bg-primary text-primary-foreground hover:brightness-110",
        !ready && !soldOut && "opacity-70",
      )}
    >
      {soldOut ? (
        t("soldOut")
      ) : added ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          {t("added")}
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" aria-hidden />
          {t("addToCart")}
        </>
      )}
    </button>
  );

  const buyNowButton = (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={disabled}
      className={cn(
        BOUTON,
        "uppercase tracking-wide",
        soldOut
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground hover:brightness-110",
        !ready && !soldOut && "opacity-70",
      )}
    >
      {soldOut ? (
        t("soldOut")
      ) : (
        <>
          <CreditCard className="h-4 w-4" aria-hidden />
          {t("payDirectly")}
        </>
      )}
    </button>
  );

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {quantitySelector}
      {withBuyNow ? buyNowButton : addToCartButton}
    </div>
  );
}
