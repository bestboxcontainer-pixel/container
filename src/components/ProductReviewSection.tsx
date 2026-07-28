import { getLocale, getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { listReviews } from "@/server/reviews";
import { ReviewForm } from "@/components/ReviewForm";
import { formatRating } from "@/lib/formatRating";

// Format de date par langue : « 5. Januar 2026 » en allemand,
// « 5 January 2026 » en anglais britannique (le shop livre en Europe).
const DATE_LOCALES: Record<string, string> = { de: "de-DE", en: "en-GB" };

function dateFormatterFor(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Les barres de répartition sont figées par pas de 10 % : le design system
// interdit les styles inline, donc pas de largeur calculée à la volée.
const BAR_WIDTHS = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full",
] as const;

function barWidthClass(share: number): string {
  return BAR_WIDTHS[Math.min(10, Math.max(0, Math.round(share / 10)))];
}

function StarRating({ value, size, label }: { value: number; size: "sm" | "lg"; label: string }) {
  const starClass = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className="flex gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden
          className={`${starClass} ${index < Math.round(value) ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </span>
  );
}

export async function ProductReviewSection({
  productId,
  editorialRating,
}: {
  productId: string;
  editorialRating?: number;
}) {
  const t = await getTranslations("reviews");
  const locale = await getLocale();
  const dateFormatter = dateFormatterFor(locale);

  // Seuls les avis validés par la modération quittent la base pour la boutique.
  const reviews = await listReviews({ productId, status: "approved" });

  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return { star, count, share: total > 0 ? (count / total) * 100 : 0 };
  });

  return (
    <section id="bewertungen" className="mx-auto max-w-screen-xl px-3 py-6">
      <h2 className="mb-4 text-xl font-black text-foreground">{t("title")}</h2>

      {total > 0 ? (
        <div className="mb-6 flex flex-col gap-6 rounded-sm border border-border p-5 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1 sm:border-r sm:border-border sm:pr-8">
            <p className="text-4xl font-black text-foreground">{formatRating(average, locale)}</p>
            <StarRating
              value={average}
              size="lg"
              label={t("starsAria", { rating: formatRating(average, locale) })}
            />
            <p className="text-xs text-muted-foreground">{t("count", { count: total })}</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {distribution.map((entry) => (
              <div key={entry.star} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="w-14 shrink-0">{t("starsLabel", { star: entry.star })}</span>
                <span className="h-2 flex-1 rounded-sm bg-muted">
                  <span className={`block h-2 rounded-sm bg-accent ${barWidthClass(entry.share)}`} />
                </span>
                <span className="w-6 shrink-0 text-right">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-sm border border-border p-5">
          <p className="font-bold text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyHint")}</p>
          {typeof editorialRating === "number" && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("editorial", { rating: formatRating(editorialRating, locale) })}
            </p>
          )}
        </div>
      )}

      {total > 0 && (
        <ul className="mb-8 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-sm border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating
                  value={review.rating}
                  size="sm"
                  label={t("starsAria", { rating: formatRating(review.rating, locale) })}
                />
                <p className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(review.createdAt))}
                </p>
              </div>
              {review.title && (
                <h3 className="mt-2 text-sm font-black text-foreground">{review.title}</h3>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-xs font-semibold text-foreground">
                {review.authorName}
                {review.city ? `, ${review.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-3 text-lg font-black text-foreground">{t("writeTitle")}</h3>
      <ReviewForm productId={productId} />
    </section>
  );
}
