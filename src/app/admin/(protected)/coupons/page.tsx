import { TicketPercent } from "lucide-react";
import { requireAdminSession } from "@/lib/dal";
import { listCoupons } from "@/server/coupons";
import { CouponManager, type CouponRow } from "@/components/admin/CouponManager";

export default async function AdminCouponsPage() {
  await requireAdminSession();
  const coupons = await listCoupons();

  // Les dates ne se sérialisent pas telles quelles vers un composant client.
  const lignes: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
    kind: c.kind,
    value: c.value,
    minSubtotalCents: c.minSubtotalCents,
    maxDiscountCents: c.maxDiscountCents,
    startsAt: c.startsAt?.toISOString() ?? null,
    endsAt: c.endsAt?.toISOString() ?? null,
    maxRedemptions: c.maxRedemptions,
    maxPerCustomer: c.maxPerCustomer,
    redemptionCount: c.redemptionCount,
    enabled: c.enabled,
  }));

  const actifs = coupons.filter((c) => c.enabled).length;
  const utilisations = coupons.reduce((somme, c) => somme + c.redemptionCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <TicketPercent className="h-6 w-6 text-primary" aria-hidden />
          Codes de réduction
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Le client saisit son code dans le panier ou à la caisse. La remise est recalculée par le
          serveur au moment de facturer : un code refusé n&apos;interrompt pas la commande, le
          client paie simplement le prix plein.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {coupons.length === 0
            ? "Aucun coupon enregistré."
            : `${actifs} coupon${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""} sur ${coupons.length} · ${utilisations} utilisation${utilisations > 1 ? "s" : ""} au total.`}
        </p>
      </div>

      <CouponManager coupons={lignes} />
    </div>
  );
}
