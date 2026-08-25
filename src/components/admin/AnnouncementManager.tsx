"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * Gestion des bandeaux d'annonce.
 *
 * Un aperçu accompagne le formulaire : les couleurs et le défilement se jugent
 * à l'œil, pas sur un code hexadécimal. Il reprend les valeurs saisies en
 * direct, avant même l'enregistrement.
 */

export interface AnnouncementRow {
  id: string;
  messageDe: string;
  messageEn: string;
  linkUrl: string;
  linkLabel: string;
  backgroundColor: string;
  textColor: string;
  scrolling: boolean;
  scrollSeconds: number;
  fullWidth: boolean;
  dismissible: boolean;
  startsAt: string | null;
  endsAt: string | null;
  enabled: boolean;
  position: number;
  updatedAt: string;
  updatedBy: string;
}

const VIDE: AnnouncementRow = {
  id: "",
  messageDe: "",
  messageEn: "",
  linkUrl: "",
  linkLabel: "",
  backgroundColor: "#e3000e",
  textColor: "#ffffff",
  scrolling: true,
  scrollSeconds: 20,
  fullWidth: true,
  dismissible: true,
  startsAt: null,
  endsAt: null,
  enabled: false,
  position: 0,
  updatedAt: "",
  updatedBy: "",
};

const CHAMP =
  "w-full rounded-sm border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary";
const LIBELLE = "mb-1 block text-sm font-semibold text-foreground";

/** Date ISO vers la valeur attendue par un champ `datetime-local`. */
function versChamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementManager({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();
  const [edite, setEdite] = useState<AnnouncementRow | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    if (!edite) return;

    setEnvoi(true);
    setErreur(null);

    const corps = {
      ...edite,
      startsAt: edite.startsAt || null,
      endsAt: edite.endsAt || null,
    };

    const reponse = await fetch(
      edite.id ? `/api/admin/annonce?id=${edite.id}` : "/api/admin/annonce",
      {
        method: edite.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      },
    ).catch(() => null);

    setEnvoi(false);

    if (!reponse?.ok) {
      const data = (await reponse?.json().catch(() => null)) as { error?: string } | null;
      setErreur(data?.error ?? "Enregistrement impossible.");
      return;
    }

    setEdite(null);
    router.refresh();
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer ce bandeau ?")) return;
    await fetch(`/api/admin/annonce?id=${id}`, { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <div>
      {!edite && (
        <button
          type="button"
          onClick={() => setEdite({ ...VIDE })}
          className="mb-4 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau bandeau
        </button>
      )}

      {edite && (
        <form onSubmit={enregistrer} className="mb-6 rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-lg font-black text-foreground">
            {edite.id ? "Modifier le bandeau" : "Nouveau bandeau"}
          </h2>

          {/* Aperçu : les couleurs et la vitesse ne se jugent pas sur un code. */}
          <div className="mb-5">
            <p className={LIBELLE}>Aperçu</p>
            <div
              style={{ backgroundColor: edite.backgroundColor, color: edite.textColor }}
              className="overflow-hidden rounded-sm py-2 text-sm"
            >
              {edite.scrolling ? (
                <div className="flex overflow-hidden">
                  {/* Même construction que la boutique : deux groupes larges
                      d'au moins un écran : pour que l'aperçu montre le
                      défilement réel et non une version approchée. */}
                  <div
                    className="flex w-max shrink-0 whitespace-nowrap motion-safe:animate-[defilement_linear_infinite]"
                    style={{ animationDuration: `${edite.scrollSeconds}s` }}
                  >
                    {[0, 1].map((groupe) => (
                      <div
                        key={groupe}
                        className="flex min-w-full shrink-0 items-center justify-around gap-12"
                        aria-hidden={groupe === 1 || undefined}
                      >
                        {[0, 1, 2, 3].map((copie) => (
                          <span key={copie} className="px-3">
                            {edite.messageDe || "Ihr Hinweis erscheint hier"}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="px-3 text-center font-semibold">
                  {edite.messageDe || "Ihr Hinweis erscheint hier"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LIBELLE} htmlFor="msg-de">
                Message (allemand)
              </label>
              <input
                id="msg-de"
                value={edite.messageDe}
                onChange={(e) => setEdite({ ...edite, messageDe: e.target.value })}
                maxLength={300}
                className={CHAMP}
                placeholder="Sommeraktion: 20 % mit Code SOMMER20"
              />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="msg-en">
                Message (anglais)
              </label>
              <input
                id="msg-en"
                value={edite.messageEn}
                onChange={(e) => setEdite({ ...edite, messageEn: e.target.value })}
                maxLength={300}
                className={CHAMP}
                placeholder="Summer sale: 20 % off with code SOMMER20"
              />
            </div>
          </div>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Une langue laissée vide signifie « pas de bandeau dans cette langue ».
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LIBELLE} htmlFor="lien">
                Lien (facultatif)
              </label>
              <input
                id="lien"
                value={edite.linkUrl}
                onChange={(e) => setEdite({ ...edite, linkUrl: e.target.value })}
                className={CHAMP}
                placeholder="/haushalt/waschmaschinen"
              />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="lien-libelle">
                Texte du lien
              </label>
              <input
                id="lien-libelle"
                value={edite.linkLabel}
                onChange={(e) => setEdite({ ...edite, linkLabel: e.target.value })}
                maxLength={80}
                className={CHAMP}
                placeholder="Jetzt entdecken"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={LIBELLE} htmlFor="fond">
                Couleur de fond
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fond"
                  type="color"
                  value={edite.backgroundColor}
                  onChange={(e) => setEdite({ ...edite, backgroundColor: e.target.value })}
                  className="h-9 w-12 rounded-sm border border-border"
                />
                <input
                  value={edite.backgroundColor}
                  onChange={(e) => setEdite({ ...edite, backgroundColor: e.target.value })}
                  className={CHAMP}
                />
              </div>
            </div>
            <div>
              <label className={LIBELLE} htmlFor="texte">
                Couleur du texte
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="texte"
                  type="color"
                  value={edite.textColor}
                  onChange={(e) => setEdite({ ...edite, textColor: e.target.value })}
                  className="h-9 w-12 rounded-sm border border-border"
                />
                <input
                  value={edite.textColor}
                  onChange={(e) => setEdite({ ...edite, textColor: e.target.value })}
                  className={CHAMP}
                />
              </div>
            </div>
            <div>
              <label className={LIBELLE} htmlFor="vitesse">
                Défilement (secondes)
              </label>
              <input
                id="vitesse"
                type="number"
                min={5}
                max={120}
                value={edite.scrollSeconds}
                onChange={(e) => setEdite({ ...edite, scrollSeconds: Number(e.target.value) })}
                className={CHAMP}
              />
              <p className="mt-1 text-xs text-muted-foreground">Plus grand = plus lent.</p>
            </div>
            <div>
              <label className={LIBELLE} htmlFor="position">
                Ordre
              </label>
              <input
                id="position"
                type="number"
                min={0}
                value={edite.position}
                onChange={(e) => setEdite({ ...edite, position: Number(e.target.value) })}
                className={CHAMP}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LIBELLE} htmlFor="debut">
                Début (facultatif)
              </label>
              <input
                id="debut"
                type="datetime-local"
                value={versChamp(edite.startsAt)}
                onChange={(e) => setEdite({ ...edite, startsAt: e.target.value || null })}
                className={CHAMP}
              />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="fin">
                Fin (facultatif)
              </label>
              <input
                id="fin"
                type="datetime-local"
                value={versChamp(edite.endsAt)}
                onChange={(e) => setEdite({ ...edite, endsAt: e.target.value || null })}
                className={CHAMP}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-5">
            {(
              [
                ["scrolling", "Faire défiler le message"],
                ["fullWidth", "Pleine largeur"],
                ["dismissible", "Le visiteur peut le fermer"],
                ["enabled", "Actif"],
              ] as const
            ).map(([champ, libelle]) => (
              <label key={champ} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={edite[champ]}
                  onChange={(e) => setEdite({ ...edite, [champ]: e.target.checked })}
                  className="h-4 w-4 rounded-sm border-border accent-primary"
                />
                {libelle}
              </label>
            ))}
          </div>

          {erreur && (
            <p role="alert" className="mt-4 rounded-sm bg-primary/10 px-3 py-2 text-sm text-primary">
              {erreur}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={envoi}
              className="rounded-sm bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-70"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEdite(null);
                setErreur(null);
              }}
              className="rounded-sm border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Aucun bandeau. Le haut de la boutique reste vide.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-white">
          {announcements.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
              <span
                style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
                className="max-w-xs truncate rounded-sm px-3 py-1 text-xs"
              >
                {a.messageDe || a.messageEn || "(vide)"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  a.enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {a.enabled ? "Actif" : "Inactif"}
              </span>
              {a.scrolling && (
                <span className="text-xs text-muted-foreground">défile en {a.scrollSeconds} s</span>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setEdite(a)}
                  aria-label="Modifier"
                  className="rounded-sm border border-border p-2 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(a.id)}
                  aria-label="Supprimer"
                  className="rounded-sm border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
