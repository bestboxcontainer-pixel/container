import { requireAdminSession } from "@/lib/dal";
import { listPaymentMethods } from "@/server/payments";
import { PaymentMethodForm } from "@/components/admin/PaymentMethodForm";
import { PaymentMethodTable } from "@/components/admin/PaymentMethodTable";

export default async function AdminPaymentsPage() {
  await requireAdminSession();
  const methods = await listPaymentMethods();
  const activeCount = methods.filter((method) => method.enabled).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Moyens de paiement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCount} moyen{activeCount > 1 ? "s" : ""} de paiement sur {methods.length} visible
          {activeCount > 1 ? "s" : ""} dans la boutique. L&apos;ordre détermine l&apos;affichage au
          moment du paiement et dans le pied de page.
        </p>
      </div>

      <PaymentMethodTable methods={methods} />

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-black text-foreground">Nouveau moyen de paiement</h2>
        <PaymentMethodForm mode="new" />
      </div>
    </div>
  );
}
