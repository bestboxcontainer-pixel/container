import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-foreground">Neue Kategorie</h1>
      <CategoryForm mode="new" />
    </div>
  );
}
