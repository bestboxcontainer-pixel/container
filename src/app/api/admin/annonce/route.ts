import { NextResponse } from "next/server";
import { invaliderCatalogue } from "@/server/cacheCatalogue";
import { requireAdminApi } from "@/lib/adminApi";
import { adminActorLabel } from "@/server/admins";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  normalizeAnnouncement,
  updateAnnouncement,
} from "@/server/announcement";

/**
 * Bandeaux d'annonce.
 *
 *   GET    …/annonce        liste complète, actifs et inactifs
 *   POST   …/annonce        crée un bandeau
 *   PUT    …/annonce?id=…   remplace un bandeau
 *   DELETE …/annonce?id=…   supprime un bandeau
 *
 * Le contrôle des valeurs est refait ici : le formulaire du back-office n'est
 * qu'une commodité, il ne fait pas autorité. Les couleurs finissent dans un
 * attribut de style, elles ne peuvent pas être reprises telles quelles.
 */

/** Le bandeau est monté dans la mise en page : toutes les pages le portent. */
function rafraichirBoutique() {
  invaliderCatalogue();
}

export async function GET() {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  return NextResponse.json({ announcements: await listAnnouncements() });
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const verdict = normalizeAnnouncement(await request.json().catch(() => null));
  if (!verdict.ok) return NextResponse.json({ error: verdict.error }, { status: 400 });

  const annonce = await createAnnouncement(verdict.input, await adminActorLabel(session));
  rafraichirBoutique();
  return NextResponse.json({ announcement: annonce }, { status: 201 });
}

export async function PUT(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const verdict = normalizeAnnouncement(await request.json().catch(() => null));
  if (!verdict.ok) return NextResponse.json({ error: verdict.error }, { status: 400 });

  const annonce = await updateAnnouncement(id, verdict.input, await adminActorLabel(session));
  if (!annonce) return NextResponse.json({ error: "Bandeau introuvable." }, { status: 404 });

  rafraichirBoutique();
  return NextResponse.json({ announcement: annonce });
}

export async function DELETE(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const supprime = await deleteAnnouncement(id);
  if (!supprime) return NextResponse.json({ error: "Bandeau introuvable." }, { status: 404 });

  rafraichirBoutique();
  return NextResponse.json({ ok: true });
}
