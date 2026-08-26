"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { PRICE_RANGES } from "@/lib/categoryFilters";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { CATEGORY_BAR_TOKENS, CATEGORY_GRID_TOKENS } from "@/lib/categoryLayoutTokens";
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
   * Filtres actifs rappelés sous la barre. Les menus sont refermés une fois le
   * choix fait : sans ce rappel, rien n'expliquerait pourquoi la grille s'est
   * vidée.
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
    <div className="flex flex-col">
      <div className={CATEGORY_BAR_TOKENS.bar}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className={CATEGORY_GRID_TOKENS.toolbarCount}>
            {t.rich("productsCount", {
              filtered: filteredProducts.length,
              total: products.length,
              b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
            })}
          </p>

          <CategoryFilterBar
            brandOptions={brandOptions}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
            priceRange={priceRange}
            onSelectPriceRange={setPriceRange}
            minRatings={minRatings}
            onToggleMinRating={toggleMinRating}
            inStockOnly={inStockOnly}
            onToggleInStockOnly={() => setInStockOnly((current) => !current)}
          />
        </div>

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

      <div className="min-w-0">
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
