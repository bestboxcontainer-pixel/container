"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Loader2, Pencil, Star, Trash2, X } from "lucide-react";
import { IconActionButton } from "@/components/admin/IconAction";
import { REVIEW_LIMITS } from "@/lib/reviewEdit";
import type { ReviewRecord, ReviewStatus } from "@/server/types";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Refusé",
};

const STATUS_BADGES: Record<ReviewStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  approved: "bg-secondary text-secondary-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function excerpt(text: string): string {
  return text.length > 160 ? `${text.slice(0, 160).trimEnd()} …` : text;
}

/** Champs modifiables d'un avis, tels que le formulaire les tient. */
interface Brouillon {
  authorName: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

/** Date au format attendu par un champ `date`, en heure locale. */
function pourChampDate(valeur: string | Date): string {
  const date = new Date(valeur);
  const decalage = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - decalage).toISOString().slice(0, 10);
}

export function ReviewModerationTable({ reviews }: { reviews: ReviewRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  // Un seul avis en cours de modification à la fois : deux formulaires ouverts
  // invitent à en enregistrer un et à perdre l'autre.
  const [editionId, setEditionId] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);

  function ouvrirEdition(review: ReviewRecord) {
    setError(null);
    setEditionId(review.id);
    setBrouillon({
      authorName: review.authorName,
      city: review.city ?? "",
      rating: review.rating,
      title: review.title ?? "",
      body: review.body,
      createdAt: pourChampDate(review.createdAt),
    });
  }

  function fermerEdition() {
    setEditionId(null);
    setBrouillon(null);
  }

  async function enregistrerEdition(review: ReviewRecord) {
    if (!brouillon) return;
    setError(null);
    setBusyId(review.id);

    const response = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brouillon),
    });

    setBusyId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "L'avis n'a pas pu être modifié.");
      return;
    }

    fermerEdition();
    router.refresh();
  }

  async function moderate(review: ReviewRecord, status: "approved" | "rejected") {
    setError(null);
    setBusyId(review.id);

    const response = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote: notes[review.id]?.trim() || undefined }),
    });

    setBusyId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "L'avis n'a pas pu être mis à jour.");
      return;
    }

    router.refresh();
  }

  async function remove(review: ReviewRecord) {
    if (!window.confirm(`Supprimer définitivement l'avis de « ${review.authorName} » ?`)) return;

    setError(null);
    setBusyId(review.id);

    const response = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });

    setBusyId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "L'avis n'a pas pu être supprimé.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-sm border border-destructive px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Auteur</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Texte</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => {
              const busy = busyId === review.id;

              // En modification, la ligne cède la place au formulaire sur toute
              // la largeur : sept colonnes étroites ne laissent pas la place
              // d'écrire un texte de deux mille caractères.
              if (editionId === review.id && brouillon) {
                return (
                  <tr key={review.id} className="border-b border-border bg-muted/40 last:border-0">
                    <td colSpan={7} className="px-4 py-4">
                      <p className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        Modifier l&apos;avis — {review.productName ?? review.productId}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="block text-xs font-semibold text-foreground">
                          Auteur
                          <input
                            value={brouillon.authorName}
                            onChange={(e) =>
                              setBrouillon({ ...brouillon, authorName: e.target.value })
                            }
                            maxLength={REVIEW_LIMITS.authorNameMax}
                            className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block text-xs font-semibold text-foreground">
                          Ville
                          <input
                            value={brouillon.city}
                            onChange={(e) => setBrouillon({ ...brouillon, city: e.target.value })}
                            maxLength={REVIEW_LIMITS.cityMax}
                            placeholder="facultatif"
                            className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block text-xs font-semibold text-foreground">
                          Note
                          <select
                            value={brouillon.rating}
                            onChange={(e) =>
                              setBrouillon({ ...brouillon, rating: Number(e.target.value) })
                            }
                            className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                          >
                            {[5, 4, 3, 2, 1].map((note) => (
                              <option key={note} value={note}>
                                {note} étoile{note > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block text-xs font-semibold text-foreground">
                          Date de dépôt
                          <input
                            type="date"
                            value={brouillon.createdAt}
                            max={pourChampDate(new Date())}
                            onChange={(e) =>
                              setBrouillon({ ...brouillon, createdAt: e.target.value })
                            }
                            className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block text-xs font-semibold text-foreground">
                        Intitulé
                        <input
                          value={brouillon.title}
                          onChange={(e) => setBrouillon({ ...brouillon, title: e.target.value })}
                          maxLength={REVIEW_LIMITS.titleMax}
                          placeholder="facultatif"
                          className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                        />
                      </label>

                      <label className="mt-3 block text-xs font-semibold text-foreground">
                        Texte de l&apos;avis
                        <textarea
                          value={brouillon.body}
                          onChange={(e) => setBrouillon({ ...brouillon, body: e.target.value })}
                          maxLength={REVIEW_LIMITS.bodyMax}
                          rows={4}
                          className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm font-normal outline-none focus:border-primary"
                        />
                        <span className="mt-0.5 block font-normal text-muted-foreground">
                          {brouillon.body.trim().length} / {REVIEW_LIMITS.bodyMax} caractères
                        </span>
                      </label>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => enregistrerEdition(review)}
                          disabled={busy}
                          className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                        >
                          {busy ? "Enregistrement…" : "Enregistrer"}
                        </button>
                        <button
                          type="button"
                          onClick={fermerEdition}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-sm border border-border px-4 py-2 text-sm font-bold text-foreground hover:border-primary"
                        >
                          <X className="h-4 w-4" /> Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={review.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {review.productName ?? review.productId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="block font-semibold text-foreground">{review.authorName}</span>
                    {review.city && <span className="block text-xs">{review.city}</span>}
                    {review.authorEmail && <span className="block text-xs">{review.authorEmail}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="flex gap-0.5"
                      role="img"
                      aria-label={`${review.rating} étoiles sur 5`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          aria-hidden
                          className={`h-4 w-4 ${index < review.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    {review.title && (
                      <span className="mb-1 block font-semibold text-foreground">{review.title}</span>
                    )}
                    {excerpt(review.body)}
                    {review.moderatorNote && (
                      <span className="mt-1 block text-xs italic">Note : {review.moderatorNote}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {dateFormatter.format(new Date(review.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-sm px-2 py-1 text-xs font-bold ${STATUS_BADGES[review.status]}`}
                    >
                      {STATUS_LABELS[review.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <label className="mb-2 block text-xs">
                      <span className="sr-only">Note de modération</span>
                      <input
                        value={notes[review.id] ?? review.moderatorNote ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [review.id]: event.target.value }))
                        }
                        placeholder="Note (facultatif)"
                        maxLength={500}
                        className="w-44 rounded-sm border border-border px-2 py-1 outline-none focus:border-primary"
                      />
                    </label>
                    <div className="flex flex-wrap justify-end gap-1">
                      <IconActionButton
                        label="Modifier"
                        icon={Pencil}
                        onClick={() => ouvrirEdition(review)}
                        disabled={busy}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconActionButton>
                      {review.status !== "approved" && (
                        <IconActionButton
                          label="Valider"
                          icon={Check}
                          tone="success"
                          onClick={() => moderate(review, "approved")}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </IconActionButton>
                      )}
                      {review.status !== "rejected" && (
                        <IconActionButton
                          label="Refuser"
                          icon={Ban}
                          onClick={() => moderate(review, "rejected")}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </IconActionButton>
                      )}
                      <IconActionButton
                        label="Supprimer"
                        icon={Trash2}
                        tone="danger"
                        onClick={() => remove(review)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </IconActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
