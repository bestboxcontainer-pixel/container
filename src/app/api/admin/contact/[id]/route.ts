import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { isContactMessageStatus, updateContactMessageStatus } from "@/server/contact";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || !isContactMessageStatus(payload.status)) {
    return NextResponse.json({ error: 'Status muss "new", "contacted" oder "closed" sein.' }, { status: 400 });
  }

  const record = await updateContactMessageStatus(id, payload.status);
  if (!record) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json(record);
}
