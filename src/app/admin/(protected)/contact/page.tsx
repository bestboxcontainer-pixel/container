import Link from "next/link";
import { requireAdminSession } from "@/lib/dal";
import { countContactMessagesByStatus, isContactMessageStatus, listContactMessages } from "@/server/contact";
import { ContactStatusSelect } from "@/components/admin/ContactStatusSelect";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate, parsePageParam } from "@/lib/pagination";
import type { ContactMessageStatus } from "@/server/contact";

interface StatusTab {
  value: ContactMessageStatus | "all";
  label: string;
  href: string;
}

const EMPTY_MESSAGES: Record<ContactMessageStatus | "all", string> = {
  all: "Aucun message pour le moment.",
  new: "Aucun nouveau message, tout est traité.",
  contacted: "Aucun message marqué comme contacté.",
  closed: "Aucun message clôturé pour le moment.",
};

/** Horodatage lisible, à l'heure de la boutique. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const activeStatus = isContactMessageStatus(params.status) ? params.status : undefined;

  const [allMessages, counts] = await Promise.all([
    listContactMessages(activeStatus),
    countContactMessagesByStatus(),
  ]);

  const pageInfo = paginate(allMessages, parsePageParam(params.page));
  const messages = pageInfo.items;

  const tabs: StatusTab[] = [
    { value: "new", label: `Nouveaux (${counts.new})`, href: "/admin/contact?status=new" },
    { value: "contacted", label: `Contactés (${counts.contacted})`, href: "/admin/contact?status=contacted" },
    { value: "closed", label: `Clôturés (${counts.closed})`, href: "/admin/contact?status=closed" },
    { value: "all", label: `Tous (${counts.total})`, href: "/admin/contact" },
  ];
  const activeTab: ContactMessageStatus | "all" = activeStatus ?? "all";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">Messages de contact</h1>
        {counts.new > 0 && (
          <span className="rounded-sm bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {counts.new} message{counts.new > 1 ? "s" : ""} non traité{counts.new > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Envoyés depuis le formulaire général de la page « Kontakt », sans produit ni fiche
        rattachée.
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
            {messages.map((message) => (
              <div key={message.id} className="rounded-sm border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</p>
                    <p className="mt-0.5 font-bold text-foreground">{message.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <a href={`mailto:${message.email}`} className="hover:text-primary hover:underline">
                        {message.email}
                      </a>
                      {message.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${message.phone}`} className="hover:text-primary hover:underline">
                            {message.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ContactStatusSelect id={message.id} status={message.status} />
                    <DeleteButton
                      action={`/api/admin/contact/${message.id}`}
                      confirmLabel={`Supprimer définitivement le message de « ${message.name} » ?`}
                    />
                  </div>
                </div>

                <p className="mt-2 rounded-sm bg-muted p-3 text-sm text-foreground/80">{message.message}</p>
              </div>
            ))}
          </div>
          <AdminPagination {...pageInfo} basePath="/admin/contact" params={params} label="messages" />
        </>
      )}
    </div>
  );
}
