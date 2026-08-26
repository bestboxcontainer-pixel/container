"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { PRICE_RANGES, RATING_THRESHOLDS } from "@/lib/categoryFilters";
import { CATEGORY_BAR_TOKENS } from "@/lib/categoryLayoutTokens";

export interface BrandOption {
  brand: string;
  count: number;
}

interface CategoryFilterBarProps {
  brandOptions: BrandOption[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  priceRange: string | null;
  onSelectPriceRange: (range: string | null) => void;
  minRatings: number[];
  onToggleMinRating: (rating: number) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
}

/**
 * Un menu de la barre : bouton, puis panneau posé dessous.
 *
 * Le panneau se referme au clic à côté et à la touche d'échappement. Sans
 * quoi deux menus restent ouverts l'un sur l'autre, et sur mobile le premier
 * recouvre la grille sans qu'on sache comment le fermer.
 */
function FilterMenu({
  label,
  count,
  children,
  openId,
  setOpenId,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const id = useId();
  const conteneur = useRef<HTMLDivElement>(null);
  const ouvert = openId === id;

  useEffect(() => {
    if (!ouvert) return;

    function auClicDehors(event: PointerEvent) {
      if (!conteneur.current?.contains(event.target as Node)) setOpenId(null);
    }
    function aLEchappement(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }

    document.addEventListener("pointerdown", auClicDehors);
    document.addEventListener("keydown", aLEchappement);
    return () => {
      document.removeEventListener("pointerdown", auClicDehors);
      document.removeEventListener("keydown", aLEchappement);
    };
  }, [ouvert, setOpenId]);

  return (
    <div ref={conteneur} className="relative">
      <button
        type="button"
        onClick={() => setOpenId(ouvert ? null : id)}
        aria-expanded={ouvert}
        aria-haspopup="true"
        className={count > 0 ? CATEGORY_BAR_TOKENS.triggerActive : CATEGORY_BAR_TOKENS.trigger}
      >
        {label}
        {count > 0 && <span className={CATEGORY_BAR_TOKENS.triggerCount}>{count}</span>}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {ouvert && <div className={CATEGORY_BAR_TOKENS.menu}>{children}</div>}
    </div>
  );
}

/** Ligne d'option : le repère est dessiné, l'input natif reste sous le doigt. */
function FilterOption({
  type,
  name,
  checked,
  onChange,
  label,
  count,
}: {
  type: "checkbox" | "radio";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className={CATEGORY_BAR_TOKENS.option}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className={type === "radio" ? CATEGORY_BAR_TOKENS.dot : CATEGORY_BAR_TOKENS.box}>
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className={CATEGORY_BAR_TOKENS.count}>{count}</span>}
    </label>
  );
}

/**
 * Filtres du catalogue, sur une seule ligne au-dessus des fiches.
 *
 * Ils occupaient une colonne de 16 rem à gauche, qui prenait le quart de la
 * largeur pour une poignée de cases à cocher et bornait la grille à trois
 * fiches par rangée. En barre, la grille récupère toute la largeur et passe à
 * quatre.
 */
export function CategoryFilterBar({
  brandOptions,
  selectedBrands,
  onToggleBrand,
  priceRange,
  onSelectPriceRange,
  minRatings,
  onToggleMinRating,
  inStockOnly,
  onToggleInStockOnly,
}: CategoryFilterBarProps) {
  const t = useTranslations("category");
  const locale = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={CATEGORY_BAR_TOKENS.group}>
      {/* Une seule bauart au catalogue : le menu n'offrirait aucun choix. */}
      {brandOptions.length > 1 && (
        <FilterMenu
          label={t("filterBrand")}
          count={selectedBrands.length}
          openId={openId}
          setOpenId={setOpenId}
        >
          {brandOptions.map((option) => (
            <FilterOption
              key={option.brand}
              type="checkbox"
              checked={selectedBrands.includes(option.brand)}
              onChange={() => onToggleBrand(option.brand)}
              label={option.brand}
              count={option.count}
            />
          ))}
        </FilterMenu>
      )}

      <FilterMenu
        label={t("filterPrice")}
        count={priceRange ? 1 : 0}
        openId={openId}
        setOpenId={setOpenId}
      >
        {PRICE_RANGES.map((range) => (
          <FilterOption
            key={range.id}
            type="radio"
            name="price-range"
            checked={priceRange === range.id}
            // Recliquer sur la tranche cochée la retire : sans cela, un bouton
            // radio ne se déselectionne plus une fois le premier choisi.
            onChange={() => onSelectPriceRange(priceRange === range.id ? null : range.id)}
            label={t(`priceRanges.${range.id}`)}
          />
        ))}
      </FilterMenu>

      <FilterMenu
        label={t("filterRating")}
        count={minRatings.length}
        openId={openId}
        setOpenId={setOpenId}
      >
        {RATING_THRESHOLDS.map((rating) => (
          <FilterOption
            key={rating}
            type="checkbox"
            checked={minRatings.includes(rating)}
            onChange={() => onToggleMinRating(rating)}
            label={t("filterMinStars", { rating: rating.toLocaleString(locale) })}
          />
        ))}
      </FilterMenu>

      {/* Une seule case : un menu déroulant pour la cocher ferait deux clics
          là où un bouton bascule en demande un. */}
      <button
        type="button"
        onClick={onToggleInStockOnly}
        aria-pressed={inStockOnly}
        className={inStockOnly ? CATEGORY_BAR_TOKENS.toggleActive : CATEGORY_BAR_TOKENS.toggle}
      >
        {t("filterInStockOnly")}
      </button>
    </div>
  );
}
