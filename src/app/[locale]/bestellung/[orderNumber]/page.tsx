import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatPrice } from "@/server/store";
import { getOrderByNumber, type OrderAddress, type OrderRecord } from "@/server/orders";
import { getBankTransferSettings } from "@/server/bankTransfer";
import { bankInstructionsFor, needsBankDetails, renderBankInstructions } from "@/lib/bankTransfer";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderStatus";

type ConfirmationParams = Promise<{ locale: string; orderNumber: string }>;
type ConfirmationSearch = Promise<{ token?: string }>;

// La commande contient l'adresse complète du client : la page n'est accessible
// qu'avec le jeton remis à la fin du tunnel, jamais avec le seul numéro.
export const dynamic = "force-dynamic";

// Les coordonnées bancaires du virement se saisissent dans le back-office
// (/admin/payments) et sont relues ici. Tant qu'elles n'ont pas été
// renseignées, ce sont celles de la démonstration qui s'affichent — avec
// l'avertissement qui va avec.
//
// Elles accompagnent désormais tout moyen de paiement qui aboutit à un virement
// — c'est-à-dire tous sauf la facture et le contre-remboursement. Aucun
// prestataire n'encaisse à la place de la boutique : renvoyer le client vers un
// « paiement en ligne » qui n'existe pas le laissait sans moyen de payer.

export async function generateMetadata({
  params,
}: {
  params: ConfirmationParams;
}): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("confirmation.metaTitle", { orderNumber: decodeURIComponent(orderNumber) }),
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: ConfirmationParams;
  searchParams: ConfirmationSearch;
}) {
  const { locale, orderNumber } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "checkout" });

  const order = token
    ? await getOrderByNumber(decodeURIComponent(orderNumber), token)
    : undefined;

  if (!order) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-muted/40">
          <div className="mx-auto max-w-screen-md px-3 py-16">
            <div className="rounded-sm border border-border bg-white p-8 text-center">
              <h1 className="text-2xl font-black text-foreground">
                {t("confirmation.notFoundTitle")}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">{t("confirmation.notFoundText")}</p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-sm bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
              >
                {t("confirmation.continueShopping")}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const language = locale === "en" ? "en" : "de";
  const orderDate = new Intl.DateTimeFormat(language === "en" ? "en-GB" : "de-DE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  return (
    <>
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="mx-auto max-w-screen-lg px-3 py-8">
          <div className="mb-6 rounded-sm border border-border bg-white p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[#16a34a]" aria-hidden />
              <div>
                <h1 className="text-2xl font-black text-foreground">{t("confirmation.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("confirmation.subtitle")}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("confirmation.orderNumber")}
                </dt>
                <dd className="text-lg font-black text-primary">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("confirmation.orderDate")}
                </dt>
                <dd className="text-sm font-semibold text-foreground">{orderDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("confirmation.statusOrder")}
                </dt>
                <dd className="text-sm font-semibold text-foreground">
                  {ORDER_STATUS_LABELS[order.status][language]}
                </dd>
              </div>
            </dl>

            <p className="mt-5 rounded-sm bg-muted px-4 py-3 text-sm text-muted-foreground">
              {t("confirmation.emailNotice", { email: order.email })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Articles commandés et montants détaillés */}
              <section className="rounded-sm border border-border bg-white p-5">
                <h2 className="mb-4 text-lg font-black text-foreground">
                  {t("confirmation.itemsTitle")}
                </h2>

                <ul className="divide-y divide-border">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-4 py-3">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={`${item.brand} ${item.name}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                          {item.brand}
                        </span>
                        {item.path ? (
                          <Link
                            href={item.path}
                            className="block text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="block text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                        )}
                        <span className="block text-xs text-muted-foreground">
                          {t("quantityShort", { count: item.quantity })}{" "}
                          {formatPrice(item.unitPriceCents)}
                          {item.sku ? ` · ${item.sku}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-black text-foreground">
                        {formatPrice(item.lineTotalCents)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("subtotal")}</dt>
                    <dd className="font-semibold text-foreground">
                      {formatPrice(order.subtotalCents)}
                    </dd>
                  </div>
                  {/* Remise accordée, avec le code qui l'a ouverte : le client
                      doit retrouver sur sa confirmation la somme qu'il a vue
                      au moment de commander. */}
                  {order.discountCents > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        {t("discount")}
                        {order.couponCode && (
                          <span className="mt-0.5 block text-xs">{order.couponCode}</span>
                        )}
                      </dt>
                      <dd className="font-semibold text-primary">
                        −{formatPrice(order.discountCents)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("shipping")}</dt>
                    <dd className="font-semibold text-foreground">
                      {order.shippingCents === 0
                        ? t("shippingFree")
                        : formatPrice(order.shippingCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base">
                    <dt className="font-black text-foreground">{t("total")}</dt>
                    <dd className="font-black text-primary">{formatPrice(order.totalCents)}</dd>
                  </div>
                </dl>
              </section>

              {/* Instructions de paiement selon le mode choisi */}
              <PaymentInstructions order={order} />

              {/* Droit de rétractation — information post-contractuelle (§ 312f BGB) */}
              <section className="rounded-sm border border-border bg-white p-5">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                  {t("confirmation.withdrawalTitle")}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("confirmation.withdrawalText")}
                </p>
                <Link
                  href="/widerrufsrecht"
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  {t("confirmation.withdrawalLink")}
                </Link>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-sm border border-border bg-white p-5">
                <h2 className="mb-3 text-sm font-black text-foreground">
                  {t("confirmation.contactTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{order.email}</p>
                {order.phone && <p className="text-sm text-muted-foreground">{order.phone}</p>}
              </section>

              <section className="rounded-sm border border-border bg-white p-5">
                <h2 className="mb-3 text-sm font-black text-foreground">
                  {t("confirmation.addressTitle")}
                </h2>
                <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("reviewBilling")}
                </h3>
                <AddressBlock address={order.billing} />
                <h3 className="mt-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("reviewShipping")}
                </h3>
                <AddressBlock address={order.shippingSameAsBilling ? order.billing : order.shipping} />
              </section>

              <section className="rounded-sm border border-border bg-white p-5">
                <h2 className="mb-3 text-sm font-black text-foreground">
                  {t("confirmation.paymentTitle")}
                </h2>
                <p className="text-sm font-semibold text-foreground">{order.paymentMethodLabel}</p>
                {order.paymentMethodFee && (
                  <p className="text-xs text-muted-foreground">{order.paymentMethodFee}</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("confirmation.statusPayment")}:{" "}
                  <span className="font-semibold text-foreground">
                    {PAYMENT_STATUS_LABELS[order.paymentStatus][language]}
                  </span>
                </p>
              </section>

              <Link
                href="/"
                className="block rounded-sm border border-border bg-white px-5 py-3 text-center text-sm font-bold text-foreground hover:border-primary"
              >
                {t("confirmation.continueShopping")}
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function PaymentInstructions({ order }: { order: OrderRecord }) {
  const t = await getTranslations({
    locale: order.locale === "en" ? "en" : "de",
    namespace: "checkout",
  });

  const total = formatPrice(order.totalCents);
  const key = order.paymentMethodKey;
  const bank = await getBankTransferSettings();

  return (
    <section className="rounded-sm border border-border bg-white p-5">
      <h2 className="mb-3 text-lg font-black text-foreground">
        {t("confirmation.instructionsTitle")}
      </h2>

      {needsBankDetails(key) && (
        <>
          <p className="text-sm leading-relaxed text-foreground">
            {renderBankInstructions(bankInstructionsFor(bank, order.locale), {
              total,
              orderNumber: order.orderNumber,
            })}
          </p>

          {/* Étiquette au-dessus de la valeur, à toutes les tailles d'écran.
              L'IBAN fait vingt-deux caractères en Allemagne et jusqu'à
              trente-et-un ailleurs : mis en regard de son intitulé sur un
              téléphone, il n'a pas la place et se coupe en deux lignes
              décalées. Empilé, il tient sur une ligne pleine largeur, et les
              valeurs restent alignées entre elles. */}
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 rounded-sm bg-muted p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">
                {t("confirmation.bankHolder")}
              </dt>
              <dd className="font-semibold break-words text-foreground">{bank.holder}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">
                {t("confirmation.bankIban")}
              </dt>
              <dd className="font-mono font-semibold break-words text-foreground">{bank.iban}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">
                {t("confirmation.bankBic")}
              </dt>
              <dd className="font-mono font-semibold break-words text-foreground">{bank.bic}</dd>
            </div>
            {/* Le nom de l'établissement est facultatif : rien ne s'affiche
                plutôt qu'un intitulé suivi du vide. */}
            {bank.bank && (
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">
                  {t("confirmation.bankBank")}
                </dt>
                <dd className="font-semibold break-words text-foreground">{bank.bank}</dd>
              </div>
            )}
            {/* Même règle que la banque : le type de virement ne s'affiche que
                si le vendeur l'a renseigné. Le libellé saisi n'est pas traduit,
                il doit correspondre au mot à mot de l'application bancaire. */}
            {bank.transferType && (
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">
                  {t("confirmation.bankTransferType")}
                </dt>
                <dd className="font-semibold break-words text-foreground">{bank.transferType}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold text-muted-foreground uppercase">
                {t("confirmation.bankReference")}
              </dt>
              <dd className="font-mono font-semibold break-words text-foreground">
                {order.orderNumber}
              </dd>
            </div>
          </dl>

          {/* L'avertissement disparaît dès que de vraies coordonnées ont été
              enregistrées dans le back-office. */}
          {!bank.configured && (
            <p className="mt-3 flex items-start gap-2 rounded-sm border border-accent bg-accent/15 px-4 py-3 text-xs font-semibold text-foreground">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{t("confirmation.bankDemoNotice")}</span>
            </p>
          )}
        </>
      )}

      {key === "rechnung" && (
        <p className="text-sm leading-relaxed text-foreground">
          {t("confirmation.instructions.rechnung", { total, orderNumber: order.orderNumber })}
        </p>
      )}

      {key === "nachnahme" && (
        <p className="text-sm leading-relaxed text-foreground">
          {t("confirmation.instructions.nachnahme", { total, orderNumber: order.orderNumber })}
        </p>
      )}

    </section>
  );
}

function AddressBlock({ address }: { address: OrderAddress }) {
  return (
    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">
        {address.firstName} {address.lastName}
      </p>
      {address.company && <p>{address.company}</p>}
      <p>{address.street}</p>
      <p>
        {address.postalCode} {address.city}
      </p>
      <p>{address.country}</p>
    </div>
  );
}
