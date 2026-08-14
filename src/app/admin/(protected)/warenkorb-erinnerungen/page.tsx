import { requireAdminSession } from "@/lib/dal";
import {
  isRecoveryEnabled,
  listRecoveries,
  recoveryStats,
  type RecoveryState,
} from "@/server/checkoutRecovery";
import { ADMIN_PAGE_SIZE, parsePageParam } from "@/lib/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { RecoveryTable } from "@/components/admin/RecoveryTable";

const CARD = "rounded-sm border border-border bg-white p-5";

const STATES: RecoveryState[] = ["active", "converted", "unsubscribed", "completed", "failed"];

function isRecoveryState(value: string | undefined): value is RecoveryState {
  return value !== undefined && (STATES as string[]).includes(value);
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className={CARD}>
      <p className="text-[11px] font-black tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const state = isRecoveryState(params.state) ? params.state : undefined;

  const [stats, enabled, result] = await Promise.all([
    recoveryStats(),
    isRecoveryEnabled(),
    listRecoveries({ state, page: parsePageParam(params.page), perPage: ADMIN_PAGE_SIZE }),
  ]);

  const offset = (parsePageParam(params.page) - 1) * ADMIN_PAGE_SIZE;
  const pageInfo = {
    page: parsePageParam(params.page),
    pageCount: Math.max(1, Math.ceil(result.total / ADMIN_PAGE_SIZE)),
    totalItems: result.total,
    firstItem: result.total === 0 ? 0 : offset + 1,
    lastItem: offset + result.rows.length,
  };

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-black text-foreground">Warenkorb-Erinnerungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Letzte 30 Tage</p>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Séquence automatique de trois e-mails envoyés aux visiteurs qui ont saisi leur adresse
        dans le tunnel de commande sans le terminer.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Erfasste Warenkörbe" value={stats.captured} hint="paniers capturés" />
        <StatCard label="Gesendete Nachrichten" value={stats.sent} hint="messages envoyés" />
        <StatCard
          label="Abgeschlossene Bestellungen"
          value={stats.converted}
          hint="commandes finalisées"
        />
        <StatCard
          label="Rückgewinnungsquote"
          value={stats.ratePercent}
          hint="% de paniers récupérés"
        />
      </div>

      <RecoveryTable rows={result.rows} enabled={enabled} activeState={state} />

      <AdminPagination
        {...pageInfo}
        basePath="/admin/warenkorb-erinnerungen"
        params={params}
        label="séquences"
      />
    </div>
  );
}
