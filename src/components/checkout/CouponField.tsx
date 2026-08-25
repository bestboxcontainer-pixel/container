"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tag, X } from "lucide-react";
import { formatCents } from "@/lib/cart";
import type { CartLine, ShippingMethodKey } from "@/lib/cart";

/**
 * Saisie d'un code de réduction dans le tunnel de commande.
 *
 * Le navigateur n'annonce jamais un montant : il envoie un code et le contenu
 * du panier en identifiants, et le serveur rechiffre tout avant de répondre.
 * Ce que ce composant affiche n'est donc qu'un aperçu, la remise réellement
 * facturée est recalculée à la commande, par le même code serveur.
 *
 * Le coupon est revérifié dès que le panier ou le mode de livraison change. Un
 * client qui retire un article après avoir saisi son code passerait sinon sous
 * le minimum requis sans que rien ne le signale, et découvrirait la remise
 * disparue seulement sur la facture.
 */

export interface AppliedCoupon {
  code: string;
  /** Libellé court de la remise : « −10 % », « −15,00 € », « Versandkostenfrei ». */
  label: string;
  discountCents: number;
  freeShipping: boolean;
}

interface CouponResponse {
  ok?: boolean;
  code?: string;
  label?: string;
  discountCents?: number;
  freeShipping?: boolean;
  reason?: string;
  minSubtotalCents?: number;
}

/** Motifs de refus connus, pour ne traduire que ce qui existe. */
const MOTIFS = new Set([
  "unknown",
  "disabled",
  "not_started",
  "expired",
  "exhausted",
  "already_used",
  "min_subtotal",
  "no_effect",
  "rate_limited",
  "network",
]);

export function CouponField({
  lines,
  shippingMethodKey,
  applied,
  onChange,
}: {
  lines: readonly CartLine[];
  shippingMethodKey: ShippingMethodKey;
  applied: AppliedCoupon | null;
  onChange: (coupon: AppliedCoupon | null) => void;
}) {
  const t = useTranslations("checkout.coupon");
  const locale = useLocale();

  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<{ motif: string; min?: number } | null>(null);

  // Le rappel du parent change à chaque rendu ; le garder dans une référence
  // évite que la revérification automatique se redéclenche en boucle.
  const rappel = useRef(onChange);
  rappel.current = onChange;

  const panier = lines.map((line) => `${line.productId}:${line.quantity}`).join(",");
  const codeApplique = applied?.code ?? "";

  async function verifier(code: string): Promise<CouponResponse | null> {
    try {
      const reponse = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          locale,
          shippingMethodKey,
          items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      });
      return (await reponse.json().catch(() => null)) as CouponResponse | null;
    } catch {
      return null;
    }
  }

  async function soumettre() {
    const code = saisie.trim();
    if (!code || enCours) return;

    setEnCours(true);
    setRefus(null);

    const data = await verifier(code);
    setEnCours(false);

    if (!data) {
      setRefus({ motif: "network" });
      return;
    }
    if (!data.ok || !data.code) {
      setRefus({
        motif: MOTIFS.has(data.reason ?? "") ? (data.reason as string) : "unknown",
        min: data.minSubtotalCents,
      });
      return;
    }

    setSaisie("");
    rappel.current({
      code: data.code,
      label: data.label ?? "",
      discountCents: data.discountCents ?? 0,
      freeShipping: data.freeShipping ?? false,
    });
  }

  function retirer() {
    setRefus(null);
    setSaisie("");
    rappel.current(null);
  }

  // Revérification silencieuse : le panier ou la livraison ont bougé sous un
  // coupon déjà appliqué. Un refus retire la remise et l'explique, plutôt que
  // de laisser un montant qui ne sera pas honoré à la commande.
  useEffect(() => {
    if (!codeApplique) return;

    let abandonne = false;

    void (async () => {
      const data = await verifier(codeApplique);
      if (abandonne || !data) return;

      if (!data.ok || !data.code) {
        setRefus({
          motif: MOTIFS.has(data.reason ?? "") ? (data.reason as string) : "unknown",
          min: data.minSubtotalCents,
        });
        rappel.current(null);
        return;
      }

      rappel.current({
        code: data.code,
        label: data.label ?? "",
        discountCents: data.discountCents ?? 0,
        freeShipping: data.freeShipping ?? false,
      });
    })();

    return () => {
      abandonne = true;
    };
    // `verifier` se reconstruit à chaque rendu : la dépendance utile est le
    // contenu du panier, résumé par `panier`, et le mode de livraison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeApplique, panier, shippingMethodKey, locale]);

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-black text-foreground">
        <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        {t("title")}
      </h2>

      {applied ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-muted px-3 py-2">
          <p className="min-w-0 text-sm">
            <span className="block font-bold text-foreground">
              {t("applied", { code: applied.code })}
            </span>
            {applied.label && (
              <span className="block text-xs font-semibold text-primary">{applied.label}</span>
            )}
          </p>
          <button
            type="button"
            onClick={retirer}
            aria-label={t("remove")}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">{t("hint")}</p>
          <div className="flex gap-2">
            <input
              id="checkout-coupon"
              type="text"
              value={saisie}
              onChange={(event) => setSaisie(event.target.value)}
              // Valider au clavier plutôt qu'à la souris : le champ vit dans le
              // tunnel, hors de tout <form>, où « Entrée » ne déclenche rien.
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void soumettre();
                }
              }}
              placeholder={t("placeholder")}
              aria-label={t("label")}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={40}
              className="w-full min-w-0 rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm uppercase outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => void soumettre()}
              disabled={enCours || saisie.trim().length === 0}
              className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-white hover:brightness-125 disabled:opacity-50"
            >
              {enCours ? t("checking") : t("apply")}
            </button>
          </div>
        </>
      )}

      {refus && (
        <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
          {t(
            `errors.${refus.motif}` as "errors.unknown",
            refus.min === undefined ? undefined : { min: formatCents(refus.min) },
          )}
        </p>
      )}
    </div>
  );
}
