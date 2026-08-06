import { requireAdminSession } from "@/lib/dal";
import { listPaymentMethods } from "@/server/payments";
import { PaymentMethodForm } from "@/components/admin/PaymentMethodForm";
import { PaymentMethodTable } from "@/components/admin/PaymentMethodTable";
import { GatewaySettingsForm } from "@/components/admin/GatewaySettingsForm";
import { BankTransferForm } from "@/components/admin/BankTransferForm";
import { getGatewayAdminState } from "@/server/gateways/admin";
import { getBankTransferSettings } from "@/server/bankTransfer";

export default async function AdminPaymentsPage() {
  await requireAdminSession();
  const methods = await listPaymentMethods();
  const gatewayState = await getGatewayAdminState();
  const bankTransfer = await getBankTransferSettings();
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

      {/* Deux couches à ne pas confondre : la table ci-dessus décide de ce que
          le client VOIT au moment de payer ; le bloc ci-dessous décide de qui
          ENCAISSE. Un moyen de paiement peut très bien être affiché sans être
          rattaché à un prestataire — c'est le cas du virement. */}
      <div className="mt-10">
        <h2 className="mb-1 text-lg font-black text-foreground">
          Paiement en ligne (carte bancaire)
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Activez un prestataire pour encaisser les cartes automatiquement, saisissez ses clés
          secrètes, puis indiquez quels moyens de paiement passent par lui. Le webhook du
          prestataire doit pointer vers{" "}
          <span className="font-mono">/api/payments/webhook/&lt;prestataire&gt;</span>.
        </p>
        <GatewaySettingsForm state={gatewayState} methods={methods} />
      </div>

      {/* Le pendant hors ligne du bloc précédent : ce que le client doit faire,
          et sur quel compte, quand aucun prestataire n'encaisse pour lui. */}
      <div className="mt-10">
        <h2 className="mb-1 text-lg font-black text-foreground">Coordonnées du virement bancaire</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Ces coordonnées et ce texte s&apos;affichent sur la page de confirmation et dans
          l&apos;e-mail envoyé au client, pour les commandes réglées par virement. Le numéro de
          commande est ajouté automatiquement comme référence du virement.
        </p>
        <BankTransferForm state={bankTransfer} />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-black text-foreground">Nouveau moyen de paiement</h2>
        <PaymentMethodForm mode="new" />
      </div>
    </div>
  );
}
