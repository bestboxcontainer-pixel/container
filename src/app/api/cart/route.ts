import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getActivePromotions } from "@/server/promotions";
import { MAX_CART_LINES } from "@/lib/cart";
import type { CartLine } from "@/lib/cart";

// Revalidation du panier.
//
// Le panier vit dans le localStorage du visiteur : son contenu peut dater de
// plusieurs semaines. Avant de l'afficher, la boutique redemande ici les prix,
// les libellés et les stocks réels. Sans cela un prix périmé serait affiché,
// ce que la Preisangabenverordnung interdit.
//
// Les promotions de campagne suivent la même règle que le reste du prix : c'est
// ici qu'un article ajouté avant le début d'une campagne prend son prix remisé,
// et qu'un article ajouté pendant reprend son prix de base une fois la campagne
// terminée. Le montant renvoyé est celui que src/server/orders.ts facturera.

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const rawIds = Array.isArray(payload?.productIds) ? payload.productIds : [];

  const productIds = rawIds
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, MAX_CART_LINES);

  if (productIds.length === 0) {
    return NextResponse.json({ lines: [] });
  }

  const [products, promotions] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: {
        id: true,
        brand: true,
        name: true,
        slug: true,
        image: true,
        priceCents: true,
        stock: true,
        category: { select: { slug: true, image: true, group: { select: { slug: true } } } },
      },
    }),
    getActivePromotions(productIds),
  ]);

  // Le prix et le stock sont ceux de la base ; la quantité reste au client.
  const lines: Omit<CartLine, "quantity">[] = products.map((product) => {
    const promotion = promotions.get(product.id);
    return {
      productId: product.id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      image: product.image || product.category.image,
      path: `/${product.category.group.slug}/${product.category.slug}/${product.slug}`,
      // Jamais au-dessus du prix catalogue : le prix de référence d'une campagne
      // est figé et peut avoir été dépassé par une baisse de tarif.
      priceCents: promotion
        ? Math.min(product.priceCents, promotion.priceCents)
        : product.priceCents,
      stock: product.stock,
    };
  });

  return NextResponse.json({ lines });
}
