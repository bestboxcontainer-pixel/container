import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/dal";

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  return { session, unauthorized: null };
}
