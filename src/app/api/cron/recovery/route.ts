import { NextResponse } from "next/server";
import { runRecoveryTick } from "@/server/checkoutRecovery";

// Déclenchement manuel du répartiteur.
//
// Le planificateur interne suffit en exploitation normale ; cette route sert
// aux tests et resterait le point d'entrée d'un cron externe si l'hébergement
// passait un jour en serverless.

export async function POST(request: Request) {
  const secret = process.env.RECOVERY_CRON_SECRET?.trim();
  if (!secret) {
    // Pas de secret configuré : la route reste fermée plutôt que d'offrir un
    // déclencheur ouvert à tous.
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runRecoveryTick();
  return NextResponse.json(result);
}
