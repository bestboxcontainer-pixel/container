import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { deleteQuoteRequest, isQuoteRequestStatus, updateQuoteRequestStatus } from "@/server/quotes";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || !isQuoteRequestStatus(payload.status)) {
    return NextResponse.json({ error: 'Status muss "new", "contacted" oder "closed" sein.' }, { status: 400 });
  }

  const record = await updateQuoteRequestStatus(id, payload.status);
  if (!record) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json(record);
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteQuoteRequest(id);
  if (!deleted) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json({ success: true });
}
