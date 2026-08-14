import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/server/checkoutRecovery";

// Enregistrement du refus de recevoir d'autres messages.
//
// Uniquement en POST. Un désabonnement en GET serait déclenché par les
// antivirus et les proxys de messagerie, qui préchargent les URL contenues dans
// les messages : des clients seraient désabonnés sans avoir rien demandé.
// Le clic natif de Gmail arrive lui aussi en POST, grâce à l'en-tête
// List-Unsubscribe-Post que portent les quatre messages.

export async function POST(request: Request) {
  let token = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null);
    if (payload && typeof payload === "object") {
      const value = (payload as Record<string, unknown>).token;
      if (typeof value === "string") token = value;
    }
  } else {
    // Gmail poste un corps de formulaire ; notre page aussi.
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    if (typeof value === "string") token = value;
    if (!token) token = new URL(request.url).searchParams.get("token") ?? "";
  }

  const done = await unsubscribeByToken(token);
  if (!done) {
    return NextResponse.json({ error: "unknown_token" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
