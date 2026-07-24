import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryRecord } from "@/server/store";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const category = await getCategoryRecord(id.join("/"));
  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-foreground">Kategorie bearbeiten</h1>
      <CategoryForm mode="edit" initialData={category} />
    </div>
  );
}
