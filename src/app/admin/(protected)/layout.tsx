import { requireAdminSession } from "@/lib/dal";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { countReviewsByStatus } from "@/server/reviews";
import { countRunningCampaigns } from "@/server/campaignAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  // Les deux compteurs du menu partent ensemble : deux requêtes indépendantes
  // n'ont aucune raison de s'attendre l'une l'autre.
  const [counts, runningCampaigns] = await Promise.all([
    countReviewsByStatus(),
    countRunningCampaigns(),
  ]);

  return (
    <div className="min-h-screen bg-muted lg:flex">
      <AdminSidebar
        email={session.email}
        pendingReviews={counts.pending}
        runningCampaigns={runningCampaigns}
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
