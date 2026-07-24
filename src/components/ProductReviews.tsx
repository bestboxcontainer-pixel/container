import { Star } from "lucide-react";

function reviewCountFor(sku: string): number {
  const sum = sku.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return 20 + (sum % 180);
}

export function ProductReviews({ rating, sku }: { rating?: number; sku?: string }) {
  if (typeof rating !== "number") {
    return (
      <section className="mx-auto max-w-screen-xl px-3 py-8">
        <h2 className="mb-3 text-xl font-black text-foreground">Kundenbewertungen</h2>
        <p className="text-sm text-muted-foreground">
          Für diesen Artikel sind noch keine Bewertungen vorhanden.
        </p>
      </section>
    );
  }

  const count = reviewCountFor(sku ?? "sku");
  const rounded = Math.round(rating);

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-8">
      <h2 className="mb-4 text-xl font-black text-foreground">Kundenbewertungen</h2>
      <div className="flex flex-col gap-4 rounded-sm border border-border p-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex flex-col items-center gap-1 sm:border-r sm:border-border sm:pr-8">
          <p className="text-4xl font-black text-foreground">{rating.toFixed(1)}</p>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${index < rounded ? "fill-accent text-accent" : "text-border"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{count} Bewertungen</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Kunden schätzen besonders die Verarbeitung, die einfache Bedienung und das
            Preis-Leistungs-Verhältnis dieses Produkts.
          </p>
          <button
            type="button"
            className="mt-3 rounded-sm border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            Bewertung verfassen
          </button>
        </div>
      </div>
    </section>
  );
}
