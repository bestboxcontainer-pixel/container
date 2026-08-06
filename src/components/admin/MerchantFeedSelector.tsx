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
 * Choix des produits transmis au flux Google.
 *
 * La sélection porte sur les catégories : cocher « Waschmaschinen » vaut pour
 * la catégorie entière, articles à venir compris. On ouvre une catégorie pour
 * en écarter un produit précis — c'est le cas rare, il est donc replié.
 *
 * Les produits inactifs sont affichés mais grisés : ils ne partent jamais dans
 * le flux, et les masquer laisserait croire à un catalogue amputé.
 */
export function MerchantFeedSelector({ catalog, selection }: MerchantFeedSelectorProps) {
  const router = useRouter();

  const [restricted, setRestricted] = useState(selection.restricted);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    // Sans restriction enregistrée, tout est coché : l'écran montre l'état réel
    // du flux, qui transmet alors le catalogue entier.
    selection.restricted ? selection.categoryIds : catalog.map((category) => category.id),
  );
  const [excluded, setExcluded] = useState<string[]>(selection.excludedProductIds);
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
    return catalog
      .filter((category) => !restricted || categoryIds.includes(category.id))
      .flatMap((category) => category.products)
      .filter((product) => product.active && !excluded.includes(product.id)).length;
  }, [catalog, restricted, categoryIds, excluded]);

  const total = useMemo(
    () => catalog.flatMap((category) => category.products).filter((product) => product.active).length,
    [catalog],
  );

  function toggleCategorie(id: string) {
    setRestricted(true);
    setCategoryIds((actuelles) =>
      actuelles.includes(id) ? actuelles.filter((x) => x !== id) : [...actuelles, id],
    );
  }

  function toggleProduit(id: string) {
    setExcluded((actuels) =>
      actuels.includes(id) ? actuels.filter((x) => x !== id) : [...actuels, id],
    );
  }

  function toutSelectionner() {
    setRestricted(false);
    setCategoryIds(catalog.map((category) => category.id));
    setExcluded([]);
  }

  async function enregistrer() {
    setError(null);
    setNotice(null);
    setPending(true);

    const response = await fetch("/api/admin/merchant-feed", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restricted, categoryIds, excludedProductIds: excluded }),
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
            Cocher une catégorie vaut pour tous ses produits, y compris ceux que vous ajouterez
            plus tard. Ouvrez une catégorie pour en écarter un article précis.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-foreground">{transmis}</p>
          <p className="text-xs text-muted-foreground">
            sur {total} actifs
          </p>
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
          onClick={() => {
            setRestricted(true);
            setCategoryIds([]);
          }}
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
                const cochee = !restricted || categoryIds.includes(category.id);
                const ouverte = ouvertes.includes(category.id);
                const actifs = category.products.filter((product) => product.active).length;
                const ecartes = category.products.filter((product) =>
                  excluded.includes(product.id),
                ).length;

                return (
                  <li key={category.id} className="rounded-sm border border-border">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        id={`cat-${category.id}`}
                        checked={cochee}
                        onChange={() => toggleCategorie(category.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <label
                        htmlFor={`cat-${category.id}`}
                        className="flex-1 cursor-pointer text-sm font-bold text-foreground"
                      >
                        {category.label}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {actifs} produit{actifs > 1 ? "s" : ""}
                        {ecartes > 0 && ` · ${ecartes} écarté${ecartes > 1 ? "s" : ""}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOuvertes((liste) =>
                            liste.includes(category.id)
                              ? liste.filter((x) => x !== category.id)
                              : [...liste, category.id],
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={ouverte ? "Replier" : "Voir les produits"}
                      >
                        {ouverte ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {ouverte && (
                      <ul className="border-t border-border bg-muted/40 px-3 py-2">
                        {category.products.map((product) => {
                          const retenu = cochee && !excluded.includes(product.id);
                          return (
                            <li key={product.id} className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                id={`prod-${product.id}`}
                                checked={retenu && product.active}
                                disabled={!cochee || !product.active}
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
                                {!product.active && " — inactif, jamais transmis"}
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
