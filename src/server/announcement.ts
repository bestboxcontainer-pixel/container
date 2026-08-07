/**
 * Bandeau d'annonce affiché tout en haut de la boutique.
 *
 * La boutique ne lit que le bandeau actif et n'échoue jamais dessus : une base
 * indisponible doit coûter une annonce, pas la page d'accueil. D'où le
 * `try/catch` qui rend `null` plutôt que de laisser remonter l'erreur.
 *
 * La lecture est mémorisée pour la durée du rendu : le bandeau est monté dans
 * la mise en page, donc interrogé sur chaque page.
 */

import { cache } from "react";
import { prisma } from "@/server/prisma";

export interface AnnouncementRecord {
  id: string;
  messageDe: string;
  messageEn: string;
  linkUrl: string;
  linkLabel: string;
  backgroundColor: string;
  textColor: string;
  scrolling: boolean;
  scrollSeconds: number;
  fullWidth: boolean;
  dismissible: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  enabled: boolean;
  position: number;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Bandeau à afficher maintenant, ou null.
 *
 * Un bandeau actif mais programmé pour plus tard, ou déjà échu, ne paraît pas :
 * la fenêtre de dates est le moyen de préparer une annonce à l'avance sans
 * risquer de la publier trop tôt.
 */
export const getActiveAnnouncement = cache(async (): Promise<AnnouncementRecord | null> => {
  try {
    const maintenant = new Date();
    const row = await prisma.announcementBar.findFirst({
      where: {
        enabled: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: maintenant } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: maintenant } }] },
        ],
      },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    });
    return row;
  } catch (error) {
    console.error("[annonce] lecture impossible, aucun bandeau affiché", error);
    return null;
  }
});

// ---- Administration ----

export async function listAnnouncements(): Promise<AnnouncementRecord[]> {
  return prisma.announcementBar.findMany({ orderBy: [{ position: "asc" }, { updatedAt: "desc" }] });
}

export interface AnnouncementInput {
  messageDe: string;
  messageEn: string;
  linkUrl: string;
  linkLabel: string;
  backgroundColor: string;
  textColor: string;
  scrolling: boolean;
  scrollSeconds: number;
  fullWidth: boolean;
  dismissible: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  enabled: boolean;
  position: number;
}

export type AnnouncementResult =
  | { ok: true; input: AnnouncementInput }
  | { ok: false; error: string };

/** Couleur CSS acceptée : notation hexadécimale à trois, six ou huit chiffres. */
const COULEUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Contrôle une annonce soumise.
 *
 * Les couleurs sont bornées à la notation hexadécimale : elles finissent dans
 * un attribut `style`, et accepter n'importe quelle chaîne y ferait entrer
 * autre chose qu'une couleur.
 */
export function normalizeAnnouncement(raw: unknown): AnnouncementResult {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Requête illisible." };
  const input = raw as Record<string, unknown>;

  const texte = (valeur: unknown, max: number) =>
    typeof valeur === "string" ? valeur.trim().slice(0, max) : "";

  const messageDe = texte(input.messageDe, 300);
  const messageEn = texte(input.messageEn, 300);
  if (!messageDe && !messageEn) {
    return { ok: false, error: "Saisissez au moins un message, en allemand ou en anglais." };
  }

  const backgroundColor = texte(input.backgroundColor, 9) || "#e3000e";
  const textColor = texte(input.textColor, 9) || "#ffffff";
  if (!COULEUR.test(backgroundColor) || !COULEUR.test(textColor)) {
    return { ok: false, error: "Les couleurs doivent être au format hexadécimal, par exemple #e3000e." };
  }

  const linkUrl = texte(input.linkUrl, 500);
  // Une adresse ouverte au clic : on écarte tout ce qui n'est ni un chemin
  // interne ni une adresse http(s), pour qu'un « javascript: » ne s'y glisse pas.
  if (linkUrl && !/^(https?:\/\/|\/)/.test(linkUrl)) {
    return { ok: false, error: "Le lien doit commencer par « / », « http:// » ou « https:// »." };
  }

  const secondes = Number(input.scrollSeconds);
  const scrollSeconds = Number.isFinite(secondes) ? Math.min(Math.max(Math.round(secondes), 5), 120) : 20;

  const position = Number(input.position);

  const date = (valeur: unknown): Date | null => {
    if (typeof valeur !== "string" || !valeur.trim()) return null;
    const d = new Date(valeur);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const startsAt = date(input.startsAt);
  const endsAt = date(input.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) {
    return { ok: false, error: "La fin ne peut pas précéder le début." };
  }

  return {
    ok: true,
    input: {
      messageDe,
      messageEn,
      linkUrl,
      linkLabel: texte(input.linkLabel, 80),
      backgroundColor,
      textColor,
      scrolling: input.scrolling === true,
      scrollSeconds,
      fullWidth: input.fullWidth !== false,
      dismissible: input.dismissible !== false,
      startsAt,
      endsAt,
      enabled: input.enabled === true,
      position: Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0,
    },
  };
}

export async function createAnnouncement(
  input: AnnouncementInput,
  actor: string,
): Promise<AnnouncementRecord> {
  return prisma.announcementBar.create({ data: { ...input, updatedBy: actor } });
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
  actor: string,
): Promise<AnnouncementRecord | null> {
  const existe = await prisma.announcementBar.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return null;
  return prisma.announcementBar.update({ where: { id }, data: { ...input, updatedBy: actor } });
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    await prisma.announcementBar.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
