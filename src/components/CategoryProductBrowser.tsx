"use client";

import { useMemo, useState } from "react";
import { CategoryFilters, PRICE_RANGES } from "@/components/CategoryFilters";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { parsePrice } from "@/lib/price";
import type { Product } from "@/types/home";

type SortOption = "relevanz" | "preis-aufsteigend" | "preis-absteigend" | "neuheiten";

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [minRatings, setMinRatings] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevanz");

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
    () => PRICE_RANGES.find((range) => range.label === priceRange) ?? null,
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
    if (sortBy === "preis-aufsteigend") {
      sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === "preis-absteigend") {
      sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === "neuheiten") {
      sorted.sort((a, b) => Number(b.badge === "Neu") - Number(a.badge === "Neu"));
    }
    return sorted;
  }, [products, selectedBrands, activePriceRange, minRatings, inStockOnly, sortBy]);

  const hasActiveFilters = selectedBrands.length > 0 || priceRange !== null || minRatings.length > 0 || inStockOnly;

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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
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
      />

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filteredProducts.length}</span> von {products.length}{" "}
            Produkten
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Sortieren nach</span>
            <select
              aria-label="Sortieren nach"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="rounded-sm border border-border bg-white px-2 py-1.5 text-sm font-semibold text-foreground"
            >
              <option value="relevanz">Relevanz</option>
              <option value="preis-aufsteigend">Preis aufsteigend</option>
              <option value="preis-absteigend">Preis absteigend</option>
              <option value="neuheiten">Neuheiten</option>
            </select>
          </label>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <Reveal key={product.name} delay={Math.min(index * 60, 300)}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border py-16 text-center">
            <p className="font-semibold text-foreground">Keine Produkte gefunden</p>
            <p className="text-sm text-muted-foreground">Passen Sie Ihre Filter an, um mehr Ergebnisse zu sehen.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
