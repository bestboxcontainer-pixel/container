import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { parseBankTransferInput } from "@/lib/bankTransfer";
import { saveBankTransferSettings } from "@/server/bankTransfer";

// Coordonnées du virement, saisies depuis /admin/payments.
//
// Rien de secret ici — ces données sont destinées à être lues par le client —,
// mais elles sont le seul endroit du site où il envoie de l'argent : la saisie
// est refusée si l'IBAN ou le BIC ne tiennent pas la route, plutôt que
// d'enregistrer une coquille que personne ne rattrapera.

export async function PUT(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized || !session) {
    return unauthorized ?? NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const parsed = parseBankTransferInput({
    holder: text(body.holder),
    iban: text(body.iban),
    bic: text(body.bic),
    bank: text(body.bank),
    transferType: text(body.transferType),
    instructionsDe: text(body.instructionsDe),
    instructionsEn: text(body.instructionsEn),
  });

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const saved = await saveBankTransferSettings(parsed.value);
  return NextResponse.json({ ok: true, settings: saved });
}
