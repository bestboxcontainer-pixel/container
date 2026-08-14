import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { prisma } from "@/server/prisma";
import { setRecoveryEnabled, stopRecoveryForEmail } from "@/server/checkoutRecovery";

// Actions du back-office sur les relances de panier.
//
// Deux actions, et deux seulement :
//   { action: "toggle", enabled: boolean }  -> interrupteur global
//   { action: "stop", id: string }          -> arrêt d'une séquence
//
// Pas d'action « envoyer maintenant » : la séquence est automatique, et un
// bouton d'envoi manuel ouvrirait la porte à des messages vers des adresses qui
// n'ont rien demandé.

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (payload.action === "toggle") {
    if (typeof payload.enabled !== "boolean") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    await setRecoveryEnabled(payload.enabled);
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "stop") {
    if (typeof payload.id !== "string") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const row = await prisma.checkoutRecovery.findUnique({
      where: { id: payload.id },
      select: { email: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Séquence introuvable." }, { status: 404 });
    }
    // Arrêt décidé par un administrateur : ce n'est ni une conversion ni un
    // désabonnement du client, donc « failed », le seul motif qui reste juste.
    await stopRecoveryForEmail(row.email, "failed");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
