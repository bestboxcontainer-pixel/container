"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MerchantSelection } from "@/lib/merchantSelection";
import type { SelectableCategory } from "@/server/merchantSelection";

interface MerchantFeedSelectorProps {
  catalog: SelectableCategory[];
  selection: MerchantSelection;
}

const CARD = "rounded-sm border border-border bg-white p-5";

/**
 * Choix des produits transmis au flux Google, produit par produit.
 *
 * Cocher un article l'ajoute au flux, indépendamment de sa catégorie. Un
 * produit ajouté plus tard au catalogue ne part pas tout seul : il faut
 * revenir cocher sa case ici : contrepartie du choix « par produit » plutôt
 * que « par catégorie ».
 *
 * Les catégories ne servent qu'à regrouper l'affichage ; chacune propose un
 * raccourci pour cocher ou décocher tous ses articles d'un coup.
 */
export function MerchantFeedSelector({ catalog, selection }: MerchantFeedSelectorProps) {
  const router = useRouter();

  const produitsActifs = useMemo(
    () => catalog.flatMap((category) => category.products).filter((product) => product.active),
    [catalog],
  );

  const [restricted, setRestricted] = useState(selection.restricted);
  const [included, setIncluded] = useState<string[]>(
    // Sans restriction enregistrée, tout est coché : l'écran montre l'état réel
    // du flux, qui transmet alors le catalogue entier.
    selection.restricted ? selection.includedProductIds : produitsActifs.map((product) => product.id),
  );
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const parGroupe = useMemo(() => {
    const groupes = new Map<string, SelectableCategory[]>();
    for (const category of catalog) {
      const liste = groupes.get(category.groupLabel) ?? [];
      liste.push(category);
      groupes.set(category.groupLabel, liste);
    }
    return [...groupes.entries()];
  }, [catalog]);

  /** Nombre d'articles réellement transmis, tel que Google le lira. */
  const transmis = useMemo(() => {
    if (!restricted) return produitsActifs.length;
    const retenus = new Set(included);
    return produitsActifs.filter((product) => retenus.has(product.id)).length;
  }, [produitsActifs, restricted, included]);

  const total = produitsActifs.length;

  function toggleProduit(id: string) {
    setRestricted(true);
    setIncluded((actuels) =>
      actuels.includes(id) ? actuels.filter((x) => x !== id) : [...actuels, id],
    );
  }

  function toutSelectionner() {
    setRestricted(false);
    setIncluded(produitsActifs.map((product) => product.id));
  }

  function toutDeselectionner() {
    setRestricted(true);
    setIncluded([]);
  }

  /** Coche ou décoche tous les articles actifs d'une catégorie. */
  function basculerCategorie(category: SelectableCategory, cocher: boolean) {
    const idsCategorie = category.products.filter((product) => product.active).map((product) => product.id);
    setRestricted(true);
    setIncluded((actuels) => {
      const sansCategorie = actuels.filter((id) => !idsCategorie.includes(id));
      return cocher ? [...sansCategorie, ...idsCategorie] : sansCategorie;
    });
  }

  async function enregistrer() {
    setError(null);
    setNotice(null);
    setPending(true);

    const response = await fetch("/api/admin/merchant-feed", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restricted, includedProductIds: included }),
    });
    setPending(false);

    const data = (await response.json().catch(() => null)) as
      | { error?: string; count?: number }
      | null;

    if (!response.ok) {
      setError(data?.error ?? "Échec de l'enregistrement.");
      return;
    }

    setNotice(
      `Sélection enregistrée : ${data?.count ?? transmis} produits dans le flux. Google la reprendra à sa prochaine lecture.`,
    );
    router.refresh();
  }

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Produits transmis au flux</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cochez les produits à transmettre à Google. Un produit ajouté plus tard au catalogue
            ne part pas automatiquement : revenez cocher sa case ici.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-foreground">{transmis}</p>
          <p className="text-xs text-muted-foreground">sur {total} actifs</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toutSelectionner}
          className="rounded-sm border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary"
        >
          Tout le catalogue
        </button>
        <button
          type="button"
          onClick={toutDeselectionner}
          className="rounded-sm border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary"
        >
          Ne rien cocher
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {parGroupe.map(([groupe, categories]) => (
          <div key={groupe}>
            <p className="mb-2 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
              {groupe}
            </p>
            <ul className="space-y-1">
              {categories.map((category) => {
                const ouverte = ouvertes.includes(category.id);
                const actifs = category.products.filter((product) => product.active);
                const retenus = actifs.filter((product) => !restricted || included.includes(product.id));

                return (
                  <li key={category.id} className="rounded-sm border border-border">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOuvertes((liste) =>
                            liste.includes(category.id)
                              ? liste.filter((x) => x !== category.id)
                              : [...liste, category.id],
                          )
                        }
                        className="flex flex-1 items-center gap-2 text-left"
                        aria-expanded={ouverte}
                      >
                        {ouverte ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="text-sm font-bold text-foreground">{category.label}</span>
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {retenus.length}/{actifs.length} retenu{retenus.length > 1 ? "s" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => basculerCategorie(category, true)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Tout
                      </button>
                      <button
                        type="button"
                        onClick={() => basculerCategorie(category, false)}
                        className="text-xs font-bold text-muted-foreground hover:underline"
                      >
                        Aucun
                      </button>
                    </div>

                    {ouverte && (
                      <ul className="border-t border-border bg-muted/40 px-3 py-2">
                        {category.products.map((product) => {
                          const coche = product.active && (!restricted || included.includes(product.id));
                          return (
                            <li key={product.id} className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                id={`prod-${product.id}`}
                                checked={coche}
                                disabled={!product.active}
                                onChange={() => toggleProduit(product.id)}
                                className="h-3.5 w-3.5 accent-primary"
                              />
                              <label
                                htmlFor={`prod-${product.id}`}
                                className={`flex-1 cursor-pointer text-xs ${
                                  product.active ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {product.brand} {product.name}
                                {!product.active && "inactif, jamais transmis"}
                              </label>
                            </li>
                          );
                        })}
                        {category.products.length === 0 && (
                          <li className="py-1 text-xs text-muted-foreground">
                            Aucun produit dans cette catégorie.
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-sm bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 rounded-sm bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={enregistrer}
        disabled={pending}
        className="mt-4 rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer la sélection"}
      </button>
    </section>
  );
}
