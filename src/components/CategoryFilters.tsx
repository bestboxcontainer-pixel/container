import { SlidersHorizontal } from "lucide-react";

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: "Bis 100 €", min: 0, max: 100 },
  { label: "100 € - 300 €", min: 100, max: 300 },
  { label: "300 € - 600 €", min: 300, max: 600 },
  { label: "600 € - 1.000 €", min: 600, max: 1000 },
  { label: "Über 1.000 €", min: 1000, max: Infinity },
];

export const RATING_THRESHOLDS = [4.5, 4, 3];

interface BrandOption {
  brand: string;
  count: number;
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
}: {
  brandOptions: BrandOption[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  priceRange: string | null;
  onSelectPriceRange: (label: string | null) => void;
  minRatings: number[];
  onToggleMinRating: (rating: number) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-56 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </div>
        {hasActiveFilters && (
          <button type="button" onClick={onReset} className="text-xs font-semibold text-primary hover:underline">
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Marke</legend>
          <ul className="space-y-1.5">
            {brandOptions.map(({ brand, count }) => (
              <li key={brand}>
                <label className="flex items-center justify-between gap-2 text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => onToggleBrand(brand)}
                      className="h-4 w-4 rounded-sm border-border accent-primary"
                    />
                    {brand}
                  </span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Preis</legend>
          <ul className="space-y-1.5">
            {PRICE_RANGES.map((range) => (
              <li key={range.label}>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === range.label}
                    onChange={() => onSelectPriceRange(range.label)}
                    onClick={() => {
                      if (priceRange === range.label) onSelectPriceRange(null);
                    }}
                    className="h-4 w-4 border-border accent-primary"
                  />
                  {range.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Bewertung</legend>
          <ul className="space-y-1.5">
            {RATING_THRESHOLDS.map((rating) => (
              <li key={rating}>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={minRatings.includes(rating)}
                    onChange={() => onToggleMinRating(rating)}
                    className="h-4 w-4 rounded-sm border-border accent-primary"
                  />
                  ab {rating.toString().replace(".", ",")} Sterne
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onToggleInStockOnly}
            className="h-4 w-4 rounded-sm border-border accent-primary"
          />
          Nur sofort lieferbar
        </label>
      </div>
    </aside>
  );
}
