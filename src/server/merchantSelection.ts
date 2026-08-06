/**
 * Lecture et écriture du choix des produits transmis au flux Google Merchant.
 *
 * Le réglage tient dans une ligne de la table générique `Setting`, comme les
 * coordonnées bancaires : pas de table dédiée pour une valeur unique qui n'est
 * jamais interrogée autrement qu'en entier.
 *
 * La logique de filtrage vit dans `src/lib/merchantSelection.ts`, sans accès à
 * la base, pour se tester seule.
 */

import { prisma } from "@/server/prisma";
import {
  MERCHANT_SELECTION_DEFAULT,
  parseMerchantSelection,
  type MerchantSelection,
} from "@/lib/merchantSelection";

const SETTING_KEY = "merchant_feed_selection";

/**
 * Réglage enregistré, ou le catalogue entier à défaut.
 *
 * Une base injoignable rend le défaut plutôt que de lever : le flux doit
 * répondre à Google même en incident, quitte à transmettre tout le catalogue.
 */
export async function getMerchantSelection(): Promise<MerchantSelection> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!row) return { ...MERCHANT_SELECTION_DEFAULT };
    return parseMerchantSelection(JSON.parse(row.value));
  } catch {
    return { ...MERCHANT_SELECTION_DEFAULT };
  }
}

export async function saveMerchantSelection(
  selection: MerchantSelection,
): Promise<MerchantSelection> {
  const value = JSON.stringify(selection);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value },
  });
  return selection;
}

/** Catégorie proposée dans l'écran de sélection, avec ses produits. */
export interface SelectableCategory {
  id: string;
  slug: string;
  label: string;
  groupLabel: string;
  products: Array<{ id: string; name: string; brand: string; active: boolean }>;
}

/**
 * Arborescence groupe > catégorie > produits, telle que l'écran l'affiche.
 * Les produits inactifs sont inclus mais signalés : ils ne partent jamais dans
 * le flux, et les cacher ferait croire à un catalogue amputé.
 */
export async function loadSelectableCatalog(): Promise<SelectableCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ group: { position: "asc" } }, { position: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      group: { select: { label: true } },
      products: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, brand: true, active: true },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    groupLabel: category.group.label,
    products: category.products,
  }));
}
