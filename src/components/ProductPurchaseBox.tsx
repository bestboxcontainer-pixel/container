"use client";

import { useState } from "react";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/types/home";

export function ProductPurchaseBox({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const inStock = product.inStock !== false;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border p-4">
      <div>
        {product.oldPrice && (
          <p className="text-sm text-muted-foreground">
            Ursprünglicher Preis <span className="line-through">{product.oldPrice}</span>
          </p>
        )}
        <div className="flex items-center gap-2">
          <p className="text-3xl font-black text-primary">{product.price}</p>
          {product.badge && (
            <span className="rounded-sm bg-badge px-2 py-0.5 text-xs font-bold text-badge-foreground">
              {product.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">inkl. MwSt., zzgl. Service &amp; Versandkosten</p>
      </div>

      <p className={`text-sm font-semibold ${inStock ? "text-foreground" : "text-muted-foreground"}`}>
        {inStock ? "✓ Vorrätig – Lieferung in 1-3 Werktagen" : "Auf Anfrage – kommt in 2-4 Wochen"}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-sm border border-border">
          <button
            type="button"
            aria-label="Anzahl um 1 verringern"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Anzahl um 1 erhöhen"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className="flex-1 rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          In den Warenkorb
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" /> Schnelle Lieferung in 1-3 Werktagen
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> 2 Jahre Garantie auf alle Geräte
        </p>
      </div>
    </div>
  );
}
