import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchaseBox } from "@/components/ProductPurchaseBox";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductGrid } from "@/components/ProductGrid";
import { getCategoryPages, getProductBySlug, getRelatedProducts } from "@/server/store";

type ProductPageParams = Promise<{ group: string; category: string; product: string }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategoryPages();
  return categories.flatMap((category) =>
    category.products.map((product) => ({
      group: category.group,
      category: category.slug,
      product: product.slug ?? "",
    })),
  );
}

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  const { group, category, product } = await params;
  const data = await getProductBySlug(group, category, product);
  if (!data) return {};

  return {
    title: `${data.product.brand} ${data.product.name} | Hausgeräte Pfeffer`,
    description: data.product.bullets.join(" · "),
  };
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { group, category, product } = await params;
  const data = await getProductBySlug(group, category, product);

  if (!data) {
    notFound();
  }

  const { category: categoryData, product: productData } = data;
  const relatedProducts = getRelatedProducts(categoryData, productData.slug ?? "", 6);

  const description = `Der ${productData.brand} ${productData.name} überzeugt in der Kategorie ${categoryData.label} durch ${productData.bullets
    .join(", ")
    .toLowerCase()}. Eine zuverlässige Wahl für alle, die Wert auf Qualität und ein gutes Preis-Leistungs-Verhältnis legen.`;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: "Start", href: "/" },
                { label: categoryData.groupLabel, href: `/${categoryData.group}` },
                { label: categoryData.label, href: `/${categoryData.group}/${categoryData.slug}` },
                { label: productData.name },
              ]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ProductGallery image={productData.image} alt={productData.alt} />

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {productData.brand}
                </p>
                <h1 className="text-2xl font-black text-foreground sm:text-3xl">{productData.name}</h1>
                {typeof productData.rating === "number" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    ⭐ {productData.rating.toFixed(1)} von 5 · Art.-Nr.: {productData.sku}
                  </p>
                )}
              </div>

              <ProductPurchaseBox product={productData} />
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-screen-xl px-3 py-8">
          <h2 className="mb-4 text-xl font-black text-foreground">Produktdetails &amp; Serviceinfos</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">Artikelbeschreibung</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">Ausstattung &amp; Merkmale</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {productData.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-primary">✓</span> {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="border-t border-border">
          <ProductReviews rating={productData.rating} sku={productData.sku} />
        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t border-border">
            <ProductGrid
              heading="Ähnliche Produkte"
              ctaLabel="Alle anzeigen"
              ctaHref={`/${categoryData.group}/${categoryData.slug}`}
              products={relatedProducts}
            />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
