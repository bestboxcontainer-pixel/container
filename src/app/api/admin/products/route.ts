import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { createProduct, listProducts } from "@/server/store";

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const products = await listProducts(categoryId ? { categoryId } : undefined);
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  if (!body?.categoryId || !body?.brand || !body?.name || !body?.price) {
    return NextResponse.json(
      { error: "categoryId, brand, name und price sind erforderlich." },
      { status: 400 },
    );
  }

  const product = await createProduct({
    categoryId: body.categoryId,
    brand: body.brand,
    name: body.name,
    bullets: Array.isArray(body.bullets) ? body.bullets : [],
    image: body.image,
    oldPrice: body.oldPrice,
    price: body.price,
    badge: body.badge,
    rating: typeof body.rating === "number" ? body.rating : undefined,
    inStock: typeof body.inStock === "boolean" ? body.inStock : true,
  });
  return NextResponse.json(product, { status: 201 });
}
