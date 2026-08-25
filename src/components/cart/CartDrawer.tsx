"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Minus, Plus, Trash2, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatCents, MAX_QUANTITY_PER_LINE } from "@/lib/cart";

// Panier latéral.
//
// Le tiroir liste les lignes du panier, permet d'ajuster les quantités et mène
// directement à la caisse. Les moyens de paiement sont rendus côté serveur et
// passés en `paymentSlot` : le tiroir reste un composant client sans avoir à
// interroger la base.
//
// Il s'ouvre à l'ajout d'un article (`AddToCartButton` appelle `openDrawer`) et
// n'a plus de déclencheur à lui. Une languette flottante se tenait auparavant
// collée au bord droit, à mi-hauteur, dès que le panier contenait quelque
// chose : elle suivait le visiteur sur toutes les pages de la boutique pour
// n'offrir qu'un raccourci que l'en-tête donne déjà. Le panier reste atteignable
// par l'indicateur de l'en-tête, présent à toutes les tailles d'écran.

/** Le panneau se referme sur Échap et rend le reste de la page inerte. */
function useDismissable(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);
}

export function CartDrawer({ paymentSlot }: { paymentSlot?: ReactNode }) {
  const t = useTranslations("cart");
  // L'ouverture vit dans le contexte du panier : ajouter un article doit
  // dérouler le tiroir, et le bouton d'ajout est ailleurs dans l'arbre.
  const {
    lines,
    totals,
    ready,
    setQuantity,
    remove,
    drawerOpen: open,
    closeDrawer,
  } = useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = closeDrawer;
  useDismissable(open, close);

  // Le focus entre dans le panneau à l'ouverture et retourne à la fermeture sur
  // l'élément qui l'avait avant : au clavier, on ne repart pas du haut de la
  // page. Il revenait auparavant sur la languette flottante ; sans elle, c'est
  // le bouton d'ajout qui a ouvert le tiroir qu'il faut retrouver, et il n'est
  // pas toujours le même. On mémorise donc l'élément actif plutôt qu'une cible
  // fixe. `wasOpen` évite de happer le focus au chargement, quand le tiroir n'a
  // jamais été ouvert.
  const wasOpen = useRef(false);
  const declencheur = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      if (!wasOpen.current) declencheur.current = document.activeElement as HTMLElement | null;
      wasOpen.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      // L'élément peut avoir quitté la page entre-temps : on ne force rien.
      if (declencheur.current?.isConnected) {
        declencheur.current.focus({ preventScroll: true });
      }
      declencheur.current = null;
    }
  }, [open]);

  const count = ready ? totals.itemCount : 0;

  // Vider le panier depuis le tiroir le fait disparaître. Sans cette remise à
  // zéro, `open` resterait vrai : le défilement de la page resterait bloqué et
  // le tiroir se rouvrirait seul au prochain ajout. L'ajustement se fait pendant
  // le rendu : React relance aussitôt, avant tout affichage et tout effet.
  if (open && count === 0) closeDrawer();

  // Rien à montrer tant que le panier est vide : ni bouton, ni panneau.
  if (!ready || count === 0) return null;

  return (
    <>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("drawerClose")}
            onClick={close}
            className="absolute inset-0 bg-black/50 motion-safe:animate-in motion-safe:fade-in"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id={titleId} className="text-lg font-black text-foreground">
                {t("drawerTitle")}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  ({t("itemCount", { count })})
                </span>
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label={t("drawerClose")}
                className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3 p-4">
                  <Link
                    href={line.path}
                    onClick={close}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={`${line.brand} ${line.name}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      {line.brand}
                    </p>
                    <Link
                      href={line.path}
                      onClick={close}
                      className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {line.name}
                    </Link>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-sm border border-border">
                        <button
                          type="button"
                          aria-label={t("decrease")}
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-foreground">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t("increase")}
                          disabled={line.quantity >= Math.min(MAX_QUANTITY_PER_LINE, line.stock)}
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.productId)}
                        aria-label={t("removeLabel", { name: `${line.brand} ${line.name}` })}
                        className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 text-right text-sm font-black text-foreground">
                    {formatCents(line.priceCents * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <footer className="border-t border-border bg-muted/40 px-5 py-4">
              <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {/* Le franco de port n'a plus de seuil : le standard est gratuit
                    quel que soit le montant. Le tiroir rappelle donc la règle,
                    au lieu du montant qui manquait autrefois pour l'atteindre. */}
                <span>{t("shippingStandardHint")}</span>
              </p>

              <dl className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("subtotal")}</dt>
                  <dd className="font-semibold text-foreground">
                    {formatCents(totals.subtotalCents)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("shipping")}</dt>
                  <dd className="font-semibold text-foreground">
                    {totals.shippingCents === 0
                      ? t("shippingFree")
                      : formatCents(totals.shippingCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <dt className="font-black text-foreground">{t("total")}</dt>
                  <dd className="font-black text-primary">{formatCents(totals.totalCents)}</dd>
                </div>
              </dl>

              <Link
                href="/kasse"
                onClick={close}
                className="block rounded-sm bg-primary px-5 py-3 text-center text-sm font-black text-primary-foreground transition-all hover:brightness-110"
              >
                {t("toCheckout")}
              </Link>
              <Link
                href="/warenkorb"
                onClick={close}
                className="mt-2 block text-center text-sm font-semibold text-primary hover:underline"
              >
                {t("drawerViewCart")}
              </Link>

              {paymentSlot && <div className="mt-4 border-t border-border pt-3">{paymentSlot}</div>}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
