import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { createCategory, listCategories } from "@/server/store";

export async function GET() {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  if (!body?.group || !body?.slug || !body?.label) {
    return NextResponse.json({ error: "group, slug und label sind erforderlich." }, { status: 400 });
  }

  try {
    const category = await createCategory({
      group: body.group,
      slug: body.slug,
      label: body.label,
      description: body.description ?? "",
      image: body.image ?? "",
      guide: body.guide ?? { intro: "", sections: [], closing: "" },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
