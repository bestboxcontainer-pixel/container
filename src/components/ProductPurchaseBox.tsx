"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CampaignCountdown } from "@/components/CampaignCountdown";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS, formatCents } from "@/lib/cart";
import type { Product } from "@/types/home";

export function ProductPurchaseBox({ product }: { product: Product }) {
  const t = useTranslations("product");
  const inStock = product.inStock !== false;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border p-4">
      <div>
        {product.oldPrice && (
          <p className="text-sm text-muted-foreground">
            {t("originalPrice")} <span className="line-through">{product.oldPrice}</span>
          </p>
        )}
        <div className="flex items-center gap-2">
          <p className="text-3xl font-black text-primary">{product.price}</p>
          {product.badge && (
            <span className="rounded-sm bg-badge px-2 py-0.5 text-xs font-bold text-badge-foreground">
              {product.badge}
            </span>
          )}
        </div>
        {/* Vente flash : le décompte est l'argument principal, il vient juste
            sous le prix. Les autres campagnes affichent leur pastille et rien
            de plus — un compte à rebours sur une offre de deux semaines
            fabrique une urgence qui n'existe pas. */}
        {product.promoCountdown && product.promoEndsAt && (
          <div className="mt-2">
            <CampaignCountdown endsAt={product.promoEndsAt} />
          </div>
        )}

        {/* La mention doit refléter le tarif réellement appliqué au panier :
            une indication de frais de port inexacte est une information
            trompeuse au sens de Google Merchant Center et de la PAngV. */}
        <p className="text-xs text-muted-foreground">
          {(product.priceCents ?? 0) >= FREE_SHIPPING_THRESHOLD_CENTS
            ? t("vatNoteFreeShipping")
            : t("vatNoteWithShipping", { amount: formatCents(SHIPPING_FLAT_CENTS) })}
        </p>
      </div>

      <p className={`text-sm font-semibold ${inStock ? "text-foreground" : "text-muted-foreground"}`}>
        {inStock ? `✓ ${t("inStock")}` : t("outOfStock")}
      </p>

      {/* Sélecteur de quantité et ajout au panier : le composant refuse de
          dépasser le stock réel et désactive tout quand l'article est épuisé. */}
      <AddToCartButton
        productId={product.id ?? ""}
        slug={product.slug ?? ""}
        brand={product.brand}
        name={product.name}
        image={product.image}
        path={product.href}
        priceCents={product.priceCents ?? 0}
        stock={product.stock ?? 0}
      />

      {product.id && (
        <WishlistButton
          variant="full"
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

      <div className="flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" /> {t("fastDelivery")}
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> {t("warranty")}
        </p>
      </div>
    </div>
  );
}
