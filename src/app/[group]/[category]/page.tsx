import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryProductBrowser } from "@/components/CategoryProductBrowser";
import { CategoryGuide } from "@/components/CategoryGuide";
import { getCategoryPage, listCategories } from "@/server/store";

type CategoryPageParams = Promise<{ group: string; category: string }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ group: category.group, category: category.slug }));
}

export async function generateMetadata({ params }: { params: CategoryPageParams }): Promise<Metadata> {
  const { group, category } = await params;
  const data = await getCategoryPage(group, category);
  if (!data) return {};

  return {
    title: `${data.label} | Hausgeräte Pfeffer`,
    description: data.description,
  };
}

export default async function CategoryPage({ params }: { params: CategoryPageParams }) {
  const { group, category } = await params;
  const data = await getCategoryPage(group, category);

  if (!data) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: "Start", href: "/" },
                { label: data.groupLabel, href: `/${data.group}` },
                { label: data.label },
              ]}
            />
          </div>
        </div>

        <div id="produkte" className="mx-auto max-w-screen-xl scroll-mt-20 px-3 py-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border sm:h-24 sm:w-24">
              <Image src={data.image} alt={data.label} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground sm:text-3xl">{data.label}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{data.description}</p>
            </div>
          </div>

          <CategoryProductBrowser products={data.products} />
        </div>

        <CategoryGuide label={data.label} guide={data.guide} />
      </main>
      <Footer />
    </>
  );
}
