import { Megaphone } from "lucide-react";
import { requireAdminSession } from "@/lib/dal";
import { listAnnouncements } from "@/server/announcement";
import { AnnouncementManager, type AnnouncementRow } from "@/components/admin/AnnouncementManager";

export default async function AdminAnnoncePage() {
  await requireAdminSession();
  const annonces = await listAnnouncements();

  // Les dates traversent la frontière serveur/client en chaîne : un objet Date
  // ne se sérialise pas tel quel vers un composant client.
  const lignes: AnnouncementRow[] = annonces.map((a) => ({
    ...a,
    startsAt: a.startsAt?.toISOString() ?? null,
    endsAt: a.endsAt?.toISOString() ?? null,
    updatedAt: a.updatedAt.toISOString(),
  }));

  const actifs = annonces.filter((a) => a.enabled).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <Megaphone className="h-6 w-6 text-primary" aria-hidden />
          Bandeau d&apos;annonce
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Message affiché tout en haut de la boutique : une promotion en cours, un délai de
          livraison exceptionnel, une fermeture. Un seul bandeau paraît à la fois — le premier
          actif dans l&apos;ordre indiqué, dont la fenêtre de dates est ouverte.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {actifs === 0
            ? "Aucun bandeau actif : le haut de la boutique reste vide."
            : `${actifs} bandeau${actifs > 1 ? "x" : ""} actif${actifs > 1 ? "s" : ""} sur ${annonces.length}.`}
        </p>
      </div>

      <AnnouncementManager announcements={lignes} />
    </div>
  );
}
