import { prisma } from "@/server/prisma";
import type { ReviewEdit } from "@/lib/reviewEdit";
import type { ReviewRecord, ReviewStatus } from "@/server/types";

// Les avis en attente sont toujours remontés en premier dans les listes mixtes :
// c'est la file de travail du modérateur.
const STATUS_ORDER: Record<ReviewStatus, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

const reviewInclude = {
  product: { select: { brand: true, name: true } },
} as const;

interface ReviewRow {
  id: string;
  productId: string;
  authorName: string;
  authorEmail: string | null;
  city: string | null;
  rating: number;
  title: string;
  body: string;
  status: string;
  moderatorNote: string | null;
  moderatedAt: Date | null;
  createdAt: Date;
  product?: { brand: string; name: string } | null;
}

function toReviewRecord(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product ? `${row.product.brand} ${row.product.name}` : undefined,
    authorName: row.authorName,
    authorEmail: row.authorEmail ?? undefined,
    city: row.city ?? undefined,
    rating: row.rating,
    title: row.title,
    body: row.body,
    // Le statut est un String côté base : tout ce qui sort du trio connu est traité
    // comme "pending", donc jamais visible dans la boutique.
    status: isReviewStatus(row.status) ? row.status : "pending",
    moderatorNote: row.moderatorNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
    moderatedAt: row.moderatedAt ? row.moderatedAt.toISOString() : undefined,
  };
}

export interface ReviewFilter {
  status?: ReviewStatus;
  productId?: string;
}

/**
 * Marque portée par la note de modération des avis de démonstration.
 *
 * Elle vit ici, et non dans le script qui les crée, parce que la boutique doit
 * pouvoir les reconnaître pour refuser de les montrer. Le script l'importe.
 */
export const MARQUE_DEMONSTRATION = "[DEMO]";

/**
 * Les avis de démonstration ne sortent que si on le demande explicitement.
 *
 * Le défaut est l'invisibilité : publier de faux avis est déloyal au sens de
 * l'annexe au § 3 Abs. 3 UWG (n° 23b et 23c), et alimente en outre la note
 * agrégée du balisage : donc les étoiles affichées par Google. Un oubli de
 * purge avant mise en ligne ne doit pas suffire à les faire apparaître : il
 * faut poser la variable, ce qu'on ne fait que sur un poste de travail.
 */
function demonstrationVisible(): boolean {
  return process.env.AVIS_DEMONSTRATION_VISIBLES === "1";
}

/**
 * Fragment de condition qui écarte les avis de démonstration.
 *
 * Le `NOT … contains` employé seul ne suffit pas : en SQL, une comparaison
 * portant sur une colonne à NULL ne vaut ni vrai ni faux, et la ligne tombe.
 * Un avis authentique dont la note de modération est vide, le cas ordinaire,
 * un modérateur n'écrit une note que s'il a quelque chose à dire, disparaîtra
 * donc avec les faux. Les deux cas sont énoncés séparément pour cette raison.
 *
 * Exporté parce que la fiche produit et le comptage des cartes de liste
 * doivent trancher pareil : c'est leur désaccord qui a fait afficher « 6 avis »
 * sur une vignette et « aucun avis » sur la fiche correspondante.
 */
export function sansAvisDemonstration(): ReviewWhereFragment {
  if (demonstrationVisible()) return {};
  return {
    OR: [
      { moderatorNote: null },
      { NOT: { moderatorNote: { contains: MARQUE_DEMONSTRATION } } },
    ],
  };
}

/** Forme minimale du fragment, pour ne pas dépendre des types générés. */
type ReviewWhereFragment = {
  OR?: Array<{ moderatorNote: null } | { NOT: { moderatorNote: { contains: string } } }>;
};

/**
 * Avis tels que la boutique a le droit de les montrer : validés par la
 * modération, et débarrassés des avis de démonstration.
 *
 * C'est le seul point d'entrée de la partie publique du site. La fiche produit
 * et son balisage JSON-LD lisent la même liste, si bien que la note annoncée à
 * Google reste celle que le visiteur voit.
 */
export async function listPublicReviews(productId: string): Promise<ReviewRecord[]> {
  const rows = await prisma.review.findMany({
    where: {
      productId,
      status: "approved",
      ...sansAvisDemonstration(),
    },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toReviewRecord);
}

export async function listReviews(filter?: ReviewFilter): Promise<ReviewRecord[]> {
  const rows = await prisma.review.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.productId ? { productId: filter.productId } : {}),
    },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });

  // Le tri est stable : à statut égal, l'ordre antéchronologique est conservé.
  return rows
    .map(toReviewRecord)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export interface ReviewStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export async function countReviewsByStatus(): Promise<ReviewStatusCounts> {
  const [pending, approved, rejected] = await Promise.all([
    prisma.review.count({ where: { status: "pending" } }),
    prisma.review.count({ where: { status: "approved" } }),
    prisma.review.count({ where: { status: "rejected" } }),
  ]);

  return { pending, approved, rejected, total: pending + approved + rejected };
}

export async function getReview(id: string): Promise<ReviewRecord | undefined> {
  const row = await prisma.review.findUnique({ where: { id }, include: reviewInclude });
  return row ? toReviewRecord(row) : undefined;
}

export interface CreateReviewInput {
  productId: string;
  authorName: string;
  authorEmail?: string;
  city?: string;
  rating: number;
  title?: string;
  body: string;
}

export async function createReview(input: CreateReviewInput): Promise<ReviewRecord> {
  const row = await prisma.review.create({
    data: {
      productId: input.productId,
      authorName: input.authorName,
      authorEmail: input.authorEmail ?? null,
      city: input.city ?? null,
      rating: input.rating,
      title: input.title ?? "",
      body: input.body,
      // Le statut est imposé ici et jamais repris de l'appelant : un visiteur ne
      // peut en aucun cas publier directement.
      status: "pending",
    },
    include: reviewInclude,
  });

  return toReviewRecord(row);
}

export async function moderateReview(
  id: string,
  status: ReviewStatus,
  moderatorEmail: string,
  note?: string,
): Promise<ReviewRecord | undefined> {
  const current = await prisma.review.findUnique({ where: { id } });
  if (!current) return undefined;

  const trimmedNote = note?.trim();
  const row = await prisma.review.update({
    where: { id },
    data: {
      status,
      moderatorNote: trimmedNote ? trimmedNote : null,
      moderatedAt: new Date(),
      moderatedBy: moderatorEmail,
    },
    include: reviewInclude,
  });

  return toReviewRecord(row);
}

/**
 * Modifie le contenu d'un avis depuis le back-office.
 *
 * Distinct de `moderateReview`, qui ne touche qu'au statut : ici on retouche
 * ce que le visiteur lit. Le statut, la note de modération et l'auteur de la
 * décision ne bougent pas : corriger une faute d'orthographe n'est pas
 * remodérer, et un avis publié le reste.
 *
 * La date de dépôt n'est écrite que si l'écran en a envoyé une : sans cela,
 * une simple correction ferait remonter l'avis en tête de la fiche.
 */
export async function updateReview(
  id: string,
  edit: ReviewEdit,
): Promise<ReviewRecord | undefined> {
  const current = await prisma.review.findUnique({ where: { id } });
  if (!current) return undefined;

  const row = await prisma.review.update({
    where: { id },
    data: {
      authorName: edit.authorName,
      city: edit.city,
      rating: edit.rating,
      title: edit.title,
      body: edit.body,
      ...(edit.createdAt ? { createdAt: edit.createdAt } : {}),
    },
    include: reviewInclude,
  });

  return toReviewRecord(row);
}

export async function deleteReview(id: string): Promise<boolean> {
  const current = await prisma.review.findUnique({ where: { id } });
  if (!current) return false;

  await prisma.review.delete({ where: { id } });
  return true;
}

/** Contrôle d'existence léger utilisé par la route publique de dépôt d'avis. */
export async function productExists(productId: string): Promise<boolean> {
  const row = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  return row !== null;
}
