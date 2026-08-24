"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { CategoryFilters, PRICE_RANGES } from "@/components/CategoryFilters";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { CATEGORY_GRID_TOKENS } from "@/lib/categoryLayoutTokens";
import { parsePrice } from "@/lib/price";
import type { Product } from "@/types/home";

// Valeurs internes : elles ne sont jamais affichées, seul le libellé est traduit.
type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "price-asc", labelKey: "sortPriceAsc" },
  { value: "price-desc", labelKey: "sortPriceDesc" },
  { value: "newest", labelKey: "sortNewest" },
];

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const t = useTranslations("category");
  const locale = useLocale();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [minRatings, setMinRatings] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
    return Array.from(counts, ([brand, count]) => ({ brand, count })).sort((a, b) =>
      a.brand.localeCompare(b.brand),
    );
  }, [products]);

  const activePriceRange = useMemo(
    () => PRICE_RANGES.find((range) => range.id === priceRange) ?? null,
    [priceRange],
  );

  const filteredProducts = useMemo(() => {
    const minRating = minRatings.length > 0 ? Math.min(...minRatings) : null;

    const filtered = products.filter((product) => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
      if (activePriceRange) {
        const price = parsePrice(product.price);
        if (price < activePriceRange.min || price > activePriceRange.max) return false;
      }
      if (minRating !== null && (product.rating ?? 0) < minRating) return false;
      if (inStockOnly && product.inStock === false) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === "newest") {
      // Le badge « Neu » vient du catalogue et n'est pas traduit
      sorted.sort((a, b) => Number(b.badge === "Neu") - Number(a.badge === "Neu"));
    }
    return sorted;
  }, [products, selectedBrands, activePriceRange, minRatings, inStockOnly, sortBy]);

  const hasActiveFilters = selectedBrands.length > 0 || priceRange !== null || minRatings.length > 0 || inStockOnly;

  // Repris sur le bouton d'ouverture : panneau fermé, rien n'indiquerait
  // autrement que la grille est déjà filtrée.
  const activeFilterCount =
    selectedBrands.length + minRatings.length + (priceRange ? 1 : 0) + (inStockOnly ? 1 : 0);

  const [filtersOpen, setFiltersOpen] = useState(false);

  function toggleBrand(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand],
    );
  }

  function toggleMinRating(rating: number) {
    setMinRatings((current) =>
      current.includes(rating) ? current.filter((item) => item !== rating) : [...current, rating],
    );
  }

  function resetFilters() {
    setSelectedBrands([]);
    setPriceRange(null);
    setMinRatings([]);
    setInStockOnly(false);
  }

  /**
   * Filtres actifs rappelés au-dessus de la grille. Sur grand écran la colonne
   * est visible, mais elle défile : passé quelques marques, on ne sait plus ce
   * qui reste coché plus haut.
   */
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedBrands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => toggleBrand(brand),
    })),
    ...(priceRange ? [{
      key: `price-${priceRange}`,
      label: t(`priceRanges.${priceRange}`),
      onRemove: () => setPriceRange(null),
    }] : []),
    ...minRatings.map((rating) => ({
      key: `rating-${rating}`,
      label: t("filterMinStars", { rating: rating.toLocaleString(locale) }),
      onRemove: () => toggleMinRating(rating),
    })),
    ...(inStockOnly ? [{
      key: "in-stock",
      label: t("filterInStockOnly"),
      onRemove: () => setInStockOnly(false),
    }] : []),
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <CategoryFilters
        brandOptions={brandOptions}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
        priceRange={priceRange}
        onSelectPriceRange={setPriceRange}
        minRatings={minRatings}
        onToggleMinRating={toggleMinRating}
        inStockOnly={inStockOnly}
        onToggleInStockOnly={() => setInStockOnly((current) => !current)}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        resultCount={filteredProducts.length}
      />

      <div className="min-w-0 flex-1">
        <div className={CATEGORY_GRID_TOKENS.toolbar}>
          {/* Sur petit écran, le décompte laisse sa place au bouton de filtres :
              les deux ensemble ne tiennent pas sur une ligne, et c'est le
              bouton qui sert. */}
          <p className="hidden text-sm text-muted-foreground sm:block">
            {t.rich("productsCount", {
              filtered: filteredProducts.length,
              total: products.length,
              b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
            })}
          </p>

          {/* Ouverture des filtres, à hauteur des produits plutôt qu'au-dessus.
              Empilée avant la grille, la colonne de filtres imposait de faire
              défiler tout un écran de cases à cocher avant d'atteindre la
              première fiche. */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {activeFilterCount > 0
              ? t("filtersOpenWithCount", { count: activeFilterCount })
              : t("filtersOpen")}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{t("sortBy")}</span>
            <select
              aria-label={t("sortBy")}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className={CATEGORY_GRID_TOKENS.select}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeChips.length > 0 && (
          <div className={CATEGORY_GRID_TOKENS.chipRow}>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className={CATEGORY_GRID_TOKENS.chip}
              >
                {chip.label}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
            <button type="button" onClick={resetFilters} className={CATEGORY_GRID_TOKENS.chipClear}>
              {t("filtersReset")}
            </button>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className={CATEGORY_GRID_TOKENS.grid}>
            {filteredProducts.map((product, index) => (
              <Reveal key={product.slug ?? product.name} delay={Math.min(index * 60, 300)}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className={CATEGORY_GRID_TOKENS.empty}>
            <p className="font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t("emptyReset")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
