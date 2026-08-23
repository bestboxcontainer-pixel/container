/**
 * Lecture et écriture des coordonnées de virement (Vorkasse).
 *
 * Ces quatre lignes et les deux textes d'instruction sont ce que le client lit
 * après avoir commandé, sur la page de confirmation comme dans son e-mail. Ils
 * étaient écrits en dur dans la page ; ils vivent maintenant dans une ligne de
 * la table générique `Setting`, modifiable depuis /admin/payments, même
 * mécanique que la configuration du prestataire de paiement, pas de modèle
 * dédié pour six champs.
 *
 * Tant que rien n'a été enregistré, ce sont les coordonnées de démonstration
 * qui sortent, accompagnées d'un avertissement affiché au client : mieux vaut
 * un avertissement visible qu'un IBAN de test pris pour argent comptant.
 *
 * Les règles de saisie et de rendu sont dans `src/lib/bankTransfer.ts`.
 */

import { cache } from "react";
import { prisma } from "@/server/prisma";
import {
  BANK_TRANSFER_DEFAULTS,
  coerceBankTransfer,
  type BankTransferSettings,
  type BankTransferState,
} from "@/lib/bankTransfer";

const SETTING_KEY = "bank_transfer";

export type { BankTransferSettings, BankTransferState } from "@/lib/bankTransfer";

/** Coordonnées enregistrées, mémorisées pour la durée du rendu. */
export const getBankTransferSettings = cache(async (): Promise<BankTransferState> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!row) return { ...BANK_TRANSFER_DEFAULTS, configured: false };
    return coerceBankTransfer(JSON.parse(row.value));
  } catch {
    // Réglage illisible ou base absente : on retombe sur la démonstration,
    // avertissement compris. La page de confirmation continue de s'afficher.
    return { ...BANK_TRANSFER_DEFAULTS, configured: false };
  }
});

export async function saveBankTransferSettings(
  settings: BankTransferSettings,
): Promise<BankTransferState> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(settings) },
    create: { key: SETTING_KEY, value: JSON.stringify(settings) },
  });

  return { ...settings, configured: true };
}
