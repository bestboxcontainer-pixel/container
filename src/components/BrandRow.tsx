import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/Reveal";
import { brandLogo } from "@/lib/brandLogos";
import type { BrandTeaser } from "@/types/home";

export async function BrandRow({ brands }: { brands: BrandTeaser[] }) {
  const t = await getTranslations("home");

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground">{t("brands")}</h2>
        <span className="text-sm text-muted-foreground">{t("brandsNote")}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((brand, index) => {
          const logo = brandLogo(brand.name);
          return (
            <Reveal key={brand.name} delay={Math.min(index * 40, 280)}>
              <Link
                href={brand.href}
                className="group flex h-full flex-col items-center justify-center gap-2 rounded-sm border border-border px-3 py-5 transition-colors hover:border-primary/40 hover:bg-muted"
              >
                {/* Le nom de marque ne se traduit jamais */}
                {logo ? (
                  // Le logo est appliqué en masque plutôt qu'en <img> : la
                  // couleur vient alors du fond, donc de la feuille de style.
                  // Un SVG chargé dans une balise <img> est isolé du document
                  // et son `currentColor` retombe au noir, ce qui interdirait
                  // le gris au repos et la transition au survol.
                  <span
                    role="img"
                    aria-label={brand.name}
                    className="h-8 w-full bg-muted-foreground transition-colors group-hover:bg-foreground"
                    style={{
                      maskImage: `url(${logo})`,
                      WebkitMaskImage: `url(${logo})`,
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center",
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                    }}
                  />
                ) : (
                  <span className="flex h-8 items-center text-sm font-black text-foreground">
                    {brand.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {t("brandItems", { count: brand.count })}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
