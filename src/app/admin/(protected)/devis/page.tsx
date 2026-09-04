import Link from "next/link";
import { requireAdminSession } from "@/lib/dal";
import { countQuoteRequestsByStatus, isQuoteRequestStatus, listQuoteRequests } from "@/server/quotes";
import { QuoteStatusSelect } from "@/components/admin/QuoteStatusSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate, parsePageParam } from "@/lib/pagination";
import { formatCents } from "@/lib/cart";
import type { QuoteRequestStatus } from "@/server/quotes";

interface StatusTab {
  value: QuoteRequestStatus | "all";
  label: string;
  href: string;
}

const EMPTY_MESSAGES: Record<QuoteRequestStatus | "all", string> = {
  all: "Aucune demande de devis pour le moment.",
  new: "Aucune nouvelle demande, tout est traité.",
  contacted: "Aucune demande marquée comme contactée.",
  closed: "Aucune demande clôturée pour le moment.",
};

/** Horodatage lisible, à l'heure de la boutique. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

export default async function AdminQuoteRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const activeStatus = isQuoteRequestStatus(params.status) ? params.status : undefined;

  const [allRequests, counts] = await Promise.all([
    listQuoteRequests(activeStatus),
    countQuoteRequestsByStatus(),
  ]);

  const pageInfo = paginate(allRequests, parsePageParam(params.page));
  const requests = pageInfo.items;

  const tabs: StatusTab[] = [
    { value: "new", label: `Nouvelles (${counts.new})`, href: "/admin/devis?status=new" },
    { value: "contacted", label: `Contactées (${counts.contacted})`, href: "/admin/devis?status=contacted" },
    { value: "closed", label: `Clôturées (${counts.closed})`, href: "/admin/devis?status=closed" },
    { value: "all", label: `Toutes (${counts.total})`, href: "/admin/devis" },
  ];
  const activeTab: QuoteRequestStatus | "all" = activeStatus ?? "all";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">Demandes de devis</h1>
        {counts.new > 0 && (
          <span className="rounded-sm bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {counts.new} demande{counts.new > 1 ? "s" : ""} non traitée{counts.new > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Déclenchées par le bouton « Angebot anfragen » de la fiche produit. Le nom, la référence et
        le prix sont ceux relevés au moment de la demande : ils peuvent différer de la fiche
        actuelle si elle a changé depuis.
      </p>

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={activeTab === tab.value ? "page" : undefined}
            className={`rounded-sm border px-4 py-2 text-sm font-bold ${
              activeTab === tab.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:border-primary"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {pageInfo.totalItems === 0 ? (
        <p className="rounded-sm border border-border bg-white px-4 py-6 text-sm text-muted-foreground">
          {EMPTY_MESSAGES[activeTab]}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-sm border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                    <p className="mt-0.5 font-bold text-foreground">
                      {request.productUrl ? (
                        <a
                          href={request.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          {request.productName}
                        </a>
                      ) : (
                        request.productName
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {request.productSku && <>{request.productSku} · </>}
                      {typeof request.productPriceCents === "number" && formatCents(request.productPriceCents)}
                    </p>
                  </div>
                  <QuoteStatusSelect id={request.id} status={request.status} />
                </div>

                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-foreground">{request.name}</span>
                  </p>
                  <p className="text-muted-foreground">
                    <a href={`mailto:${request.email}`} className="hover:text-primary hover:underline">
                      {request.email}
                    </a>
                    {request.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${request.phone}`} className="hover:text-primary hover:underline">
                          {request.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>

                {request.message && (
                  <p className="mt-2 rounded-sm bg-muted p-3 text-sm text-foreground/80">{request.message}</p>
                )}
              </div>
            ))}
          </div>
          <AdminPagination {...pageInfo} basePath="/admin/devis" params={params} label="demandes" />
        </>
      )}
    </div>
  );
}
