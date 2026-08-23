"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { classeCoherente, echelleEnergie } from "@/lib/energieskala";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CampaignCountdown } from "@/components/CampaignCountdown";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { Product } from "@/types/home";

export function ProductPurchaseBox({ product }: { product: Product }) {
  const t = useTranslations("product");
  const inStock = product.inStock !== false;

  // L'étiquette ne s'affiche que si les trois conditions sont réunies : une
  // classe renseignée, une famille effectivement soumise à étiquetage, et une
  // classe qui tient sur l'échelle de cette famille. Une donnée qui échoue à
  // l'un des trois ne s'affiche pas : un « A+ » sur un lave-linge, par exemple,
  // date d'avant le rééchelonnage de 2021 et induirait l'acheteur en erreur.
  const echelle = product.categorySlug ? echelleEnergie(product.categorySlug) : undefined;
  const classeEnergie =
    product.energyEfficiencyClass && echelle && classeCoherente(product.energyEfficiencyClass, echelle)
      ? product.energyEfficiencyClass.trim().toUpperCase()
      : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border p-4">
      <div>
        {/* Le prix barré est la recommandation du fabricant, pas un prix que la
            boutique aurait elle-même pratiqué. Le nommer ainsi n'est pas un
            détail de vocabulaire : annoncer une réduction sur son propre prix
            antérieur oblige à afficher le prix le plus bas des trente derniers
            jours (§ 11 PAngV), et à l'avoir réellement pratiqué. Une référence
            fabricant, elle, se compare librement : à condition d'être désignée
            pour ce qu'elle est. */}
        {product.oldPrice && (
          <p className="text-sm text-muted-foreground">
            {t("manufacturerPrice")} <span className="line-through">{product.oldPrice}</span>
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
            de plus : un compte à rebours sur une offre de deux semaines
            fabrique une urgence qui n'existe pas. */}
        {product.promoCountdown && product.promoEndsAt && (
          <div className="mt-2">
            <CampaignCountdown endsAt={product.promoEndsAt} />
          </div>
        )}

        {/* § 1 PAngV impose d'indiquer que le prix comprend la TVA ; § 6 exige
            en outre que le visiteur puisse atteindre les frais de livraison
            depuis le prix, sans les chercher. D'où le lien : la livraison
            standard est offerte, l'express ne l'est pas, et le montant se lit
            sur la page dédiée plutôt que dans une formule qui trancherait mal
            entre les deux. */}
        <p className="text-xs text-muted-foreground">
          {t("vatOnly")}{" "}
          <Link href="/versand" className="underline underline-offset-2 hover:text-foreground">
            {t("shippingCosts")}
          </Link>
        </p>
      </div>

      {/* Classe d'efficacité énergétique, à proximité immédiate du prix comme
          l'exige l'article 6 du règlement (UE) 2017/1369 pour la vente à
          distance, avec l'étendue de l'échelle : sans elle, la lettre ne se
          situe pas. */}
      {classeEnergie && echelle && (
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-sm bg-primary px-2 py-0.5 text-sm font-bold text-primary-foreground">
            {classeEnergie}
          </span>
          <span>
            {t("energyLabel")}: {t("energyScale", { best: echelle.meilleure, worst: echelle.pire })}
          </span>
        </p>
      )}

      <p className={`text-sm font-semibold ${inStock ? "text-foreground" : "text-muted-foreground"}`}>
        {inStock ? `✓ ${t("inStock")}` : t("outOfStock")}
      </p>

      {/* Achat direct, quantité et ajout au panier : le composant refuse de
          dépasser le stock réel et désactive tout quand l'article est épuisé.
          C'est ici, et seulement ici, que « acheter maintenant » a sa place :
          la décision d'achat se prend sur la fiche, pas sur une vignette. */}
      <AddToCartButton
        productId={product.id ?? ""}
        slug={product.slug ?? ""}
        brand={product.brand}
        name={product.name}
        image={product.image}
        path={product.href}
        priceCents={product.priceCents ?? 0}
        stock={product.stock ?? 0}
        withBuyNow
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
