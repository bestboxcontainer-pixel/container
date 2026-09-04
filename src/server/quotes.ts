import { prisma } from "@/server/prisma";

export type QuoteRequestStatus = "new" | "contacted" | "closed";

export function isQuoteRequestStatus(value: unknown): value is QuoteRequestStatus {
  return value === "new" || value === "contacted" || value === "closed";
}

/** "herr" | "frau" ; absent = « keine Angabe ». */
export type QuoteRequestSalutation = "herr" | "frau";

export function isQuoteRequestSalutation(value: unknown): value is QuoteRequestSalutation {
  return value === "herr" || value === "frau";
}

export interface QuoteRequestRecord {
  id: string;
  productId?: string;
  productName: string;
  productSku?: string;
  productPriceCents?: number;
  productUrl: string;
  salutation?: QuoteRequestSalutation;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: QuoteRequestStatus;
  createdAt: string;
}

interface QuoteRequestRow {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  productPriceCents: number | null;
  productUrl: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: Date;
}

function toRecord(row: QuoteRequestRow): QuoteRequestRecord {
  return {
    id: row.id,
    productId: row.productId ?? undefined,
    productName: row.productName,
    productSku: row.productSku ?? undefined,
    productPriceCents: row.productPriceCents ?? undefined,
    productUrl: row.productUrl,
    salutation: isQuoteRequestSalutation(row.salutation) ? row.salutation : undefined,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    message: row.message,
    // Un statut hors du trio connu est traité comme "new" : il reste visible
    // dans la file de travail plutôt que de disparaître silencieusement.
    status: isQuoteRequestStatus(row.status) ? row.status : "new",
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreateQuoteRequestInput {
  productId?: string;
  productName: string;
  productSku?: string;
  productPriceCents?: number;
  productUrl: string;
  salutation?: QuoteRequestSalutation;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
}

export async function createQuoteRequest(input: CreateQuoteRequestInput): Promise<QuoteRequestRecord> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const row = await prisma.quoteRequest.create({
    data: {
      productId: input.productId ?? null,
      productName: input.productName,
      productSku: input.productSku ?? null,
      productPriceCents: input.productPriceCents ?? null,
      productUrl: input.productUrl,
      salutation: input.salutation ?? null,
      firstName,
      lastName,
      // Nom complet dénormalisé, recomposé ici une bonne fois pour l'affichage.
      name: `${firstName} ${lastName}`.trim(),
      email: input.email,
      phone: input.phone ?? null,
      message: input.message ?? "",
    },
  });
  return toRecord(row);
}

export async function listQuoteRequests(status?: QuoteRequestStatus): Promise<QuoteRequestRecord[]> {
  const rows = await prisma.quoteRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function countQuoteRequestsByStatus(): Promise<Record<QuoteRequestStatus | "total", number>> {
  const [newCount, contacted, closed] = await Promise.all([
    prisma.quoteRequest.count({ where: { status: "new" } }),
    prisma.quoteRequest.count({ where: { status: "contacted" } }),
    prisma.quoteRequest.count({ where: { status: "closed" } }),
  ]);
  return { new: newCount, contacted, closed, total: newCount + contacted + closed };
}

export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequestStatus,
): Promise<QuoteRequestRecord | undefined> {
  const current = await prisma.quoteRequest.findUnique({ where: { id } });
  if (!current) return undefined;

  const row = await prisma.quoteRequest.update({ where: { id }, data: { status } });
  return toRecord(row);
}
