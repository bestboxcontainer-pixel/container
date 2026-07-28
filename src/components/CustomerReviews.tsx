import { getLocale, getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { formatRating } from "@/lib/formatRating";

// Témoignages de la page d'accueil : le contenu vit dans les messages, sous
// "reviews.customers.<clé>". Seule la note reste ici, elle n'est pas du texte.
const testimonials = [
  { key: "sandra", rating: 5 },
  { key: "tobias", rating: 5 },
  { key: "kerstin", rating: 4 },
] as const;

export async function CustomerReviews({
  average,
  productCount,
}: {
  average: number;
  productCount: number;
}) {
  const t = await getTranslations("home");
  const tReviews = await getTranslations("reviews");
  const locale = await getLocale();
  const rounded = Math.round(average);

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black text-foreground">{t("reviews")}</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${index < rounded ? "fill-accent text-accent" : "text-border"}`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground">
            {t("reviewsAverage", { rating: formatRating(average, locale) })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("reviewsBasis", { count: productCount })}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.key}
            className="flex h-full flex-col gap-3 rounded-sm border border-border p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${index < testimonial.rating ? "fill-accent text-accent" : "text-border"}`}
                />
              ))}
            </div>
            <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
              {tReviews(`customers.${testimonial.key}.text`)}
            </blockquote>
            <figcaption className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                {tReviews(`customers.${testimonial.key}.author`)},{" "}
                {tReviews(`customers.${testimonial.key}.city`)}
              </span>
              <span className="mt-0.5 block">
                {t("purchased", { product: tReviews(`customers.${testimonial.key}.purchase`) })}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
