import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { parseMerchantSelectionInput } from "@/lib/merchantSelection";
import { loadSelectableCatalog, saveMerchantSelection } from "@/server/merchantSelection";

// Choix des produits transmis au flux Google Merchant, enregistré depuis
// /admin/merchant.
//
// Les identifiants reçus sont confrontés au catalogue réel : une catégorie
// supprimée entre l'affichage de l'écran et l'envoi est écartée sans faire
// échouer l'enregistrement. En revanche, restreindre à zéro catégorie est
// refusé — le flux se viderait, et la boutique disparaîtrait de Google sans
// que personne ne l'ait voulu.

export async function PUT(request: Request) {
  const { session, unauthorized } = await requireAdminApi();
  if (unauthorized || !session) {
    return unauthorized ?? NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const catalogue = await loadSelectableCatalog();
  const known = {
    categoryIds: catalogue.map((category) => category.id),
    productIds: catalogue.flatMap((category) => category.products.map((product) => product.id)),
  };

  const parsed = parseMerchantSelectionInput(
    {
      restricted: body.restricted,
      categoryIds: body.categoryIds,
      excludedProductIds: body.excludedProductIds,
    },
    known,
  );

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const saved = await saveMerchantSelection(parsed.value);

  // Le nombre transmis est renvoyé pour que l'écran l'affiche sans recharger :
  // c'est le seul chiffre qui dit vraiment ce que Google va lire.
  const count = catalogue
    .filter((category) => !saved.restricted || saved.categoryIds.includes(category.id))
    .flatMap((category) => category.products)
    .filter((product) => product.active && !saved.excludedProductIds.includes(product.id)).length;

  return NextResponse.json({ ok: true, selection: saved, count });
}
