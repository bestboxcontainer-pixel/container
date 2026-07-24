import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { deleteCategory, getCategoryRecord, updateCategory } from "@/server/store";

type Params = Promise<{ id: string[] }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const category = await getCategoryRecord(id.join("/"));
  if (!category) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });

  const updated = await updateCategory(id.join("/"), body);
  if (!updated) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteCategory(id.join("/"));
  if (!deleted) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ success: true });
}
