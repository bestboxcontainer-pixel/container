"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import { formatCents } from "@/lib/cart";
import type { CartLine, CartTotals } from "@/lib/cart";

// Bloc récapitulatif du tunnel de commande.
//
// § 312j Abs. 2 BGB impose que le prix total, les frais de livraison et les
// caractéristiques essentielles des articles soient visibles « unmittelbar
// bevor der Verbraucher seine Bestellung abgibt », donc juste au-dessus du
// bouton, sans que le client ait à ouvrir quoi que ce soit.

export function CheckoutSummary({
  lines,
  totals,
  showItems = true,
  couponCode,
}: {
  lines: readonly CartLine[];
  totals: CartTotals;
  showItems?: boolean;
  /** Code appliqué, nommé sous la remise. Absent, la ligne ne paraît pas. */
  couponCode?: string;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 text-lg font-black text-foreground">{t("summaryTitle")}</h2>

      {showItems && (
        <ul className="mb-4 space-y-3 border-b border-border pb-4">
          {lines.map((line) => (
            <li key={line.productId} className="flex items-start gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {line.image && (
                  <Image
                    src={line.image}
                    alt={`${line.brand} ${line.name}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  {line.brand}
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {line.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("quantityShort", { count: line.quantity })} {formatCents(line.priceCents)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-foreground">
                {formatCents(line.priceCents * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-semibold text-foreground">{formatCents(totals.subtotalCents)}</dd>
        </div>
        {/* Remise, entre le sous-total et la livraison, l'ordre dans lequel
            elle se calcule. Le code est rappelé dessous : une somme retirée
            sans justification est la première chose qu'un client conteste. */}
        {totals.discountCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t("discount")}
              {couponCode && <span className="mt-0.5 block text-xs">{couponCode}</span>}
            </dt>
            <dd className="font-semibold text-primary">
              −{formatCents(totals.discountCents)}
            </dd>
          </div>
        )}

        {/* Le mode retenu est nommé sous le montant : « 70,00 € » sans mention
            de l'express laisserait le client deviner d'où vient la somme. */}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t("shipping")}
            <span className="mt-0.5 block text-xs">
              {t(`shippingMethods.${totals.shippingMethodKey}.label`)} ·{" "}
              {t(`shippingMethods.${totals.shippingMethodKey}.delay`)}
            </span>
          </dt>
          <dd className="font-semibold text-foreground">
            {totals.shippingCents === 0 ? t("shippingFree") : formatCents(totals.shippingCents)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base">
          <dt className="font-black text-foreground">{t("total")}</dt>
          <dd className="font-black text-primary">{formatCents(totals.totalCents)}</dd>
        </div>
      </dl>

      {/* Le détail du taux et du montant de TVA a été retiré à la demande du
          commerçant. La mention ci-dessous reste : la loi allemande sur
          l'affichage des prix (§ 1 PAngV) impose d'indiquer au consommateur que
          le prix affiché comprend la taxe, même sans en détailler le calcul. */}
      <p className="mt-1 text-xs text-muted-foreground">{t("priceNote")}</p>

      {/* La zone de livraison n'est plus annoncée ici : la boutique expédie
          au-delà de l'Allemagne, et une mention figée contredirait le pays que
          le client vient de choisir dans son adresse. */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span>{t("deliveryTime")}</span>
      </p>
    </div>
  );
}
