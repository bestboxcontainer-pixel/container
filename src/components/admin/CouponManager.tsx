"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * Gestion des codes de réduction.
 *
 * Les montants se saisissent en euros et se transmettent en centimes : le reste
 * de la boutique ne connaît que les centimes, et convertir au dernier moment
 * éviterait mal les arrondis.
 */

export interface CouponRow {
  id: string;
  code: string;
  label: string;
  kind: "percent" | "fixed" | "freeShipping";
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number;
  maxPerCustomer: number;
  redemptionCount: number;
  enabled: boolean;
}

const VIDE: CouponRow = {
  id: "",
  code: "",
  label: "",
  kind: "percent",
  value: 10,
  minSubtotalCents: 0,
  maxDiscountCents: 0,
  startsAt: null,
  endsAt: null,
  maxRedemptions: 0,
  maxPerCustomer: 0,
  redemptionCount: 0,
  enabled: false,
};

const CHAMP =
  "w-full rounded-sm border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary";
const LIBELLE = "mb-1 block text-sm font-semibold text-foreground";

const NATURES: { valeur: CouponRow["kind"]; libelle: string }[] = [
  { valeur: "percent", libelle: "Pourcentage" },
  { valeur: "fixed", libelle: "Montant fixe" },
  { valeur: "freeShipping", libelle: "Livraison offerte" },
];

const euros = (cents: number) => (cents / 100).toFixed(2);
const centimes = (valeur: string) => Math.round(Number(valeur.replace(",", ".")) * 100) || 0;

function versChamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ce que le coupon retire, en une ligne lisible. */
function resume(c: CouponRow): string {
  if (c.kind === "freeShipping") return "Livraison offerte";
  if (c.kind === "percent") {
    const plafond = c.maxDiscountCents > 0 ? `, au plus ${euros(c.maxDiscountCents)} €` : "";
    return `−${c.value} %${plafond}`;
  }
  return `−${euros(c.value)} €`;
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [edite, setEdite] = useState<CouponRow | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    if (!edite) return;

    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch(
      edite.id ? `/api/admin/coupons?id=${edite.id}` : "/api/admin/coupons",
      {
        method: edite.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...edite, startsAt: edite.startsAt || null, endsAt: edite.endsAt || null }),
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

  async function supprimer(c: CouponRow) {
    const message =
      c.redemptionCount > 0
        ? `Ce coupon a déjà servi ${c.redemptionCount} fois. Le supprimer efface aussi son historique d'utilisation. Continuer ?`
        : "Supprimer ce coupon ?";
    if (!window.confirm(message)) return;
    await fetch(`/api/admin/coupons?id=${c.id}`, { method: "DELETE" }).catch(() => null);
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
          Nouveau coupon
        </button>
      )}

      {edite && (
        <form onSubmit={enregistrer} className="mb-6 rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-lg font-black text-foreground">
            {edite.id ? `Modifier ${edite.code}` : "Nouveau coupon"}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LIBELLE} htmlFor="code">
                Code
              </label>
              <input
                id="code"
                value={edite.code}
                onChange={(e) => setEdite({ ...edite, code: e.target.value.toUpperCase() })}
                maxLength={40}
                required
                className={`${CHAMP} font-mono`}
                placeholder="SOMMER20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                La casse est ignorée à la saisie du client.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={LIBELLE} htmlFor="label">
                Intitulé interne
              </label>
              <input
                id="label"
                value={edite.label}
                onChange={(e) => setEdite({ ...edite, label: e.target.value })}
                maxLength={120}
                className={CHAMP}
                placeholder="Campagne été 2026"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LIBELLE} htmlFor="nature">
                Nature
              </label>
              <select
                id="nature"
                value={edite.kind}
                onChange={(e) => setEdite({ ...edite, kind: e.target.value as CouponRow["kind"] })}
                className={CHAMP}
              >
                {NATURES.map((n) => (
                  <option key={n.valeur} value={n.valeur}>
                    {n.libelle}
                  </option>
                ))}
              </select>
            </div>

            {edite.kind !== "freeShipping" && (
              <div>
                <label className={LIBELLE} htmlFor="valeur">
                  {edite.kind === "percent" ? "Pourcentage" : "Montant (€)"}
                </label>
                <input
                  id="valeur"
                  type="number"
                  min={1}
                  max={edite.kind === "percent" ? 100 : undefined}
                  step={edite.kind === "percent" ? 1 : 0.01}
                  value={edite.kind === "percent" ? edite.value : euros(edite.value)}
                  onChange={(e) =>
                    setEdite({
                      ...edite,
                      value:
                        edite.kind === "percent" ? Number(e.target.value) : centimes(e.target.value),
                    })
                  }
                  className={CHAMP}
                />
              </div>
            )}

            {edite.kind === "percent" && (
              <div>
                <label className={LIBELLE} htmlFor="plafond">
                  Remise maximale (€)
                </label>
                <input
                  id="plafond"
                  type="number"
                  min={0}
                  step={0.01}
                  value={euros(edite.maxDiscountCents)}
                  onChange={(e) => setEdite({ ...edite, maxDiscountCents: centimes(e.target.value) })}
                  className={CHAMP}
                />
                <p className="mt-1 text-xs text-muted-foreground">0 = sans plafond.</p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LIBELLE} htmlFor="minimum">
                Panier minimum (€)
              </label>
              <input
                id="minimum"
                type="number"
                min={0}
                step={0.01}
                value={euros(edite.minSubtotalCents)}
                onChange={(e) => setEdite({ ...edite, minSubtotalCents: centimes(e.target.value) })}
                className={CHAMP}
              />
            </div>
            <div>
              <label className={LIBELLE} htmlFor="quota">
                Utilisations au total
              </label>
              <input
                id="quota"
                type="number"
                min={0}
                value={edite.maxRedemptions}
                onChange={(e) => setEdite({ ...edite, maxRedemptions: Number(e.target.value) })}
                className={CHAMP}
              />
              <p className="mt-1 text-xs text-muted-foreground">0 = illimité.</p>
            </div>
            <div>
              <label className={LIBELLE} htmlFor="parclient">
                Utilisations par client
              </label>
              <input
                id="parclient"
                type="number"
                min={0}
                value={edite.maxPerCustomer}
                onChange={(e) => setEdite({ ...edite, maxPerCustomer: Number(e.target.value) })}
                className={CHAMP}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                0 = illimité. Compté par adresse e-mail.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LIBELLE} htmlFor="debut">
                Début de validité
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
                Fin de validité
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

          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={edite.enabled}
              onChange={(e) => setEdite({ ...edite, enabled: e.target.checked })}
              className="h-4 w-4 rounded-sm border-border accent-primary"
            />
            Actif : le code est accepté à la caisse
          </label>

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

      {coupons.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Aucun coupon. Le champ de la caisse refusera tous les codes.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Remise</th>
                <th className="px-4 py-3">Conditions</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-foreground">{c.code}</span>
                    {c.label && (
                      <span className="block text-xs text-muted-foreground">{c.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{resume(c)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.minSubtotalCents > 0 && <span>dès {euros(c.minSubtotalCents)} € · </span>}
                    {c.maxPerCustomer > 0 ? `${c.maxPerCustomer}× par client` : "sans limite par client"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.redemptionCount}
                    {c.maxRedemptions > 0 ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.enabled
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.enabled ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEdite(c)}
                        aria-label={`Modifier ${c.code}`}
                        className="rounded-sm border border-border p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => supprimer(c)}
                        aria-label={`Supprimer ${c.code}`}
                        className="rounded-sm border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
