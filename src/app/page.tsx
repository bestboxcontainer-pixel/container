import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryRow } from "@/components/CategoryRow";
import { ProductGrid } from "@/components/ProductGrid";
import { PromoGrid } from "@/components/PromoGrid";
import { getCategoryPage } from "@/server/store";
import type { Product } from "@/types/home";

async function pickProduct(
  group: string,
  categorySlug: string,
  index: number,
): Promise<Product | undefined> {
  const category = await getCategoryPage(group, categorySlug);
  return category?.products[index];
}

export default async function Home() {
  const [highlights, deals] = await Promise.all([
    Promise.all([
      pickProduct("haushalt", "kaffeemaschinen", 0),
      pickProduct("haushalt", "waschmaschinen", 0),
      pickProduct("haushalt", "geschirrspueler", 0),
      pickProduct("multimedia", "fernseher", 0),
      pickProduct("haushalt", "staubsauger", 0),
      pickProduct("multimedia", "smartphones", 0),
    ]),
    Promise.all([
      pickProduct("haushalt", "backoefen-herde", 0),
      pickProduct("haushalt", "geschirrspueler", 4),
      pickProduct("haushalt", "klimageraete", 0),
      pickProduct("multimedia", "videospiele", 0),
      pickProduct("multimedia", "computer", 0),
      pickProduct("multimedia", "smartwatches", 0),
    ]),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <CategoryRow />
        <ProductGrid
          heading="Highlights"
          ctaLabel="Alle Highlights anzeigen"
          ctaHref="/highlights"
          products={highlights.filter((product) => product !== undefined)}
        />
        <PromoGrid />
        <ProductGrid
          heading="Aktuelle Deals"
          ctaLabel="Alle Angebote anzeigen"
          ctaHref="/angebote"
          products={deals.filter((product) => product !== undefined)}
        />
      </main>
      <Footer />
    </>
  );
}
