import { prisma } from "@/server/prisma";

export type ContactMessageStatus = "new" | "contacted" | "closed";

export function isContactMessageStatus(value: unknown): value is ContactMessageStatus {
  return value === "new" || value === "contacted" || value === "closed";
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
}

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: Date;
}

function toRecord(row: ContactMessageRow): ContactMessageRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    message: row.message,
    // Un statut hors du trio connu est traité comme "new" : il reste visible
    // dans la file de travail plutôt que de disparaître silencieusement.
    status: isContactMessageStatus(row.status) ? row.status : "new",
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function createContactMessage(input: CreateContactMessageInput): Promise<ContactMessageRecord> {
  const row = await prisma.contactMessage.create({
    data: {
      name: input.name.trim(),
      email: input.email,
      phone: input.phone ?? null,
      message: input.message,
    },
  });
  return toRecord(row);
}

export async function listContactMessages(status?: ContactMessageStatus): Promise<ContactMessageRecord[]> {
  const rows = await prisma.contactMessage.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function countContactMessagesByStatus(): Promise<Record<ContactMessageStatus | "total", number>> {
  const [newCount, contacted, closed] = await Promise.all([
    prisma.contactMessage.count({ where: { status: "new" } }),
    prisma.contactMessage.count({ where: { status: "contacted" } }),
    prisma.contactMessage.count({ where: { status: "closed" } }),
  ]);
  return { new: newCount, contacted, closed, total: newCount + contacted + closed };
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessageRecord | undefined> {
  const current = await prisma.contactMessage.findUnique({ where: { id } });
  if (!current) return undefined;

  const row = await prisma.contactMessage.update({ where: { id }, data: { status } });
  return toRecord(row);
}
