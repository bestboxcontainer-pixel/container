import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { deleteProduct, getProductRecord, updateProduct } from "@/server/store";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const product = await getProductRecord(id);
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });

  const updated = await updateProduct(id, body);
  if (!updated) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteProduct(id);
  if (!deleted) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ success: true });
}
