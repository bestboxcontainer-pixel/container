"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { CATEGORY_FILTER_TOKENS } from "@/lib/categoryLayoutTokens";

// L'identifiant "id" est stable et sert d'état ; seul le libellé est traduit,
// via "category.priceRanges.<id>".
export interface PriceRange {
  id: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: "under100", min: 0, max: 100 },
  { id: "from100", min: 100, max: 300 },
  { id: "from300", min: 300, max: 600 },
  { id: "from600", min: 600, max: 1000 },
  { id: "over1000", min: 1000, max: Infinity },
];

export const RATING_THRESHOLDS = [4.5, 4, 3];

interface BrandOption {
  brand: string;
  count: number;
}

/**
 * Section repliable du panneau. Ouverte par défaut : un filtre qu'on ne voit
 * pas est un filtre qu'on n'utilise pas.
 */
function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className={`group ${CATEGORY_FILTER_TOKENS.group}`}>
      <summary className={CATEGORY_FILTER_TOKENS.groupSummary}>
        {title}
        <ChevronDown className={CATEGORY_FILTER_TOKENS.groupChevron} aria-hidden />
      </summary>
      <div className="mt-2 space-y-0.5">{children}</div>
    </details>
  );
}

/** Ligne d'option : le repère est dessiné, l'input natif reste sous le doigt. */
function FilterOption({
  type,
  name,
  checked,
  onChange,
  onClick,
  label,
  count,
}: {
  type: "checkbox" | "radio";
  name?: string;
  checked: boolean;
  onChange: () => void;
  onClick?: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className={CATEGORY_FILTER_TOKENS.option}>
      <span className="flex min-w-0 items-center gap-2.5">
        <input
          type={type}
          name={name}
          checked={checked}
          onChange={onChange}
          onClick={onClick}
          className="peer sr-only"
        />
        <span className={type === "radio" ? CATEGORY_FILTER_TOKENS.dot : CATEGORY_FILTER_TOKENS.box}>
          {type === "radio" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          ) : (
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          )}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && <span className={CATEGORY_FILTER_TOKENS.count}>{count}</span>}
    </label>
  );
}

export function CategoryFilters({
  brandOptions,
  selectedBrands,
  onToggleBrand,
  priceRange,
  onSelectPriceRange,
  minRatings,
  onToggleMinRating,
  inStockOnly,
  onToggleInStockOnly,
  onReset,
  hasActiveFilters,
  open,
  onClose,
  resultCount,
}: {
  brandOptions: BrandOption[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  priceRange: string | null;
  onSelectPriceRange: (id: string | null) => void;
  minRatings: number[];
  onToggleMinRating: (rating: number) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  /** Ouverture du panneau sur petit écran. Sans effet à partir de `lg`. */
  open: boolean;
  onClose: () => void;
  /** Nombre de fiches retenues, rappelé sur le bouton de validation. */
  resultCount: number;
}) {
  const t = useTranslations("category");
  const locale = useLocale();

  return (
    <>
      {/* Voile derrière le panneau, sur petit écran uniquement. */}
      {open && (
        <button
          type="button"
          aria-label={t("filtersClose")}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Un seul balisage pour les deux affichages. À partir de `lg`, c'est la
          colonne latérale d'origine ; en dessous, un panneau qui glisse depuis
          la gauche, masqué tant qu'on ne le demande pas. Dupliquer le balisage
          pour chaque taille d'écran ferait vivre deux fois les mêmes cases à
          cocher, avec le risque qu'elles se désynchronisent. */}
      <aside
        className={`${CATEGORY_FILTER_TOKENS.sidebarBase} ${
          open ? CATEGORY_FILTER_TOKENS.sidebarOpen : CATEGORY_FILTER_TOKENS.sidebarClosed
        }`}
      >
        <div className={CATEGORY_FILTER_TOKENS.panel}>
          <div className={CATEGORY_FILTER_TOKENS.panelHead}>
            <span className={CATEGORY_FILTER_TOKENS.panelTitle}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {t("filtersTitle")}
            </span>

            {/* Fermeture réservée au panneau mobile : en colonne, il n'y a rien
                à fermer. */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("filtersClose")}
              className="-mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <FilterGroup title={t("filterBrand")}>
            {brandOptions.map(({ brand, count }) => (
              <FilterOption
                key={brand}
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => onToggleBrand(brand)}
                label={brand}
                count={count}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("filterPrice")}>
            {PRICE_RANGES.map((range) => (
              <FilterOption
                key={range.id}
                type="radio"
                name="price"
                checked={priceRange === range.id}
                onChange={() => onSelectPriceRange(range.id)}
                // Recliquer la tranche déjà cochée la retire : sans cela, un
                // choix de prix ne se défait plus qu'en réinitialisant tout.
                onClick={() => {
                  if (priceRange === range.id) onSelectPriceRange(null);
                }}
                label={t(`priceRanges.${range.id}`)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("filterRating")}>
            {RATING_THRESHOLDS.map((rating) => (
              <FilterOption
                key={rating}
                type="checkbox"
                checked={minRatings.includes(rating)}
                onChange={() => onToggleMinRating(rating)}
                // « 4,5 » en allemand, « 4.5 » en anglais, « 4 » reste « 4 »
                label={t("filterMinStars", { rating: rating.toLocaleString(locale) })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("filterAvailability")}>
            <FilterOption
              type="checkbox"
              checked={inStockOnly}
              onChange={onToggleInStockOnly}
              label={t("filterInStockOnly")}
            />
          </FilterGroup>

          {hasActiveFilters && (
            <button type="button" onClick={onReset} className={CATEGORY_FILTER_TOKENS.reset}>
              {t("filtersReset")}
            </button>
          )}
        </div>

        {/* Retour aux produits, avec le nombre de fiches retenues : dans un
            panneau qui couvre l'écran, on ne voit pas le résultat de ce qu'on
            coche. Inutile en colonne, où la grille est juste à côté. */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 lg:hidden"
        >
          {t("filtersApply", { count: resultCount })}
        </button>
      </aside>
    </>
  );
}
