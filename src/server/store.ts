import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { slugify } from "@/lib/slugify";
import type { CategoryGuide, CategoryRecord, ProductGroup, ProductRecord } from "@/server/types";
import type { Product } from "@/types/home";

const DATA_DIR = path.join(process.cwd(), "data", "store");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ---- Categories ----

export async function listCategories(): Promise<CategoryRecord[]> {
  return readJson<CategoryRecord>(CATEGORIES_FILE);
}

export async function getCategoryRecord(id: string): Promise<CategoryRecord | undefined> {
  const categories = await listCategories();
  return categories.find((category) => category.id === id);
}

export async function createCategory(
  input: Omit<CategoryRecord, "id">,
): Promise<CategoryRecord> {
  const categories = await listCategories();
  const id = `${input.group}/${input.slug}`;
  if (categories.some((category) => category.id === id)) {
    throw new Error(`Category already exists: ${id}`);
  }
  const record: CategoryRecord = { ...input, id };
  categories.push(record);
  await writeJson(CATEGORIES_FILE, categories);
  return record;
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<CategoryRecord, "id">>,
): Promise<CategoryRecord | undefined> {
  const categories = await listCategories();
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return undefined;

  const updated: CategoryRecord = { ...categories[index], ...patch, id };
  if (patch.group || patch.slug) {
    updated.id = `${updated.group}/${updated.slug}`;
  }
  categories[index] = updated;
  await writeJson(CATEGORIES_FILE, categories);
  return updated;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await listCategories();
  const next = categories.filter((category) => category.id !== id);
  if (next.length === categories.length) return false;
  await writeJson(CATEGORIES_FILE, next);

  const products = await listProducts();
  const remainingProducts = products.filter((product) => product.categoryId !== id);
  if (remainingProducts.length !== products.length) {
    await writeJson(PRODUCTS_FILE, remainingProducts);
  }
  return true;
}

// ---- Products ----

export async function listProducts(filter?: { categoryId?: string }): Promise<ProductRecord[]> {
  const products = await readJson<ProductRecord>(PRODUCTS_FILE);
  if (filter?.categoryId) {
    return products.filter((product) => product.categoryId === filter.categoryId);
  }
  return products;
}

export async function getProductRecord(id: string): Promise<ProductRecord | undefined> {
  const products = await listProducts();
  return products.find((product) => product.id === id);
}

export async function createProduct(input: Omit<ProductRecord, "id">): Promise<ProductRecord> {
  const products = await listProducts();
  const record: ProductRecord = { ...input, id: randomUUID() };
  products.push(record);
  await writeJson(PRODUCTS_FILE, products);
  return record;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<ProductRecord, "id">>,
): Promise<ProductRecord | undefined> {
  const products = await listProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return undefined;

  const updated: ProductRecord = { ...products[index], ...patch, id };
  products[index] = updated;
  await writeJson(PRODUCTS_FILE, products);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await listProducts();
  const next = products.filter((product) => product.id !== id);
  if (next.length === products.length) return false;
  await writeJson(PRODUCTS_FILE, next);
  return true;
}

// ---- Public view model (matches the shape the storefront pages consume) ----

export interface CategoryPageView {
  group: ProductGroup;
  slug: string;
  groupLabel: string;
  label: string;
  description: string;
  image: string;
  brands: string[];
  products: Product[];
  guide: CategoryGuide;
}

function groupLabelFor(group: ProductGroup): string {
  return group === "haushalt" ? "Haushalt" : "Multimedia";
}

function toViewProduct(
  product: ProductRecord,
  category: CategoryRecord,
): Product {
  const image = product.image ?? category.image;
  const slug = slugify(`${product.brand}-${product.name}`);
  const sku = slug.replace(/-/g, "").slice(0, 10).toUpperCase();
  return {
    slug,
    sku,
    brand: product.brand,
    name: product.name,
    bullets: product.bullets,
    image,
    alt: `${product.brand} ${product.name}`,
    oldPrice: product.oldPrice,
    price: product.price,
    badge: product.badge,
    rating: product.rating,
    inStock: product.inStock,
    href: `/${category.group}/${category.slug}/${slug}`,
  };
}

async function toViewCategory(category: CategoryRecord): Promise<CategoryPageView> {
  const products = await listProducts({ categoryId: category.id });
  const viewProducts = products.map((product) => toViewProduct(product, category));
  return {
    group: category.group,
    slug: category.slug,
    groupLabel: groupLabelFor(category.group),
    label: category.label,
    description: category.description,
    image: category.image,
    brands: products.map((product) => product.brand),
    products: viewProducts,
    guide: category.guide,
  };
}

export async function getCategoryPages(): Promise<CategoryPageView[]> {
  const categories = await listCategories();
  return Promise.all(categories.map(toViewCategory));
}

export async function getCategoryPage(
  group: string,
  slug: string,
): Promise<CategoryPageView | undefined> {
  const category = await getCategoryRecord(`${group}/${slug}`);
  if (!category) return undefined;
  return toViewCategory(category);
}

export async function getProductBySlug(
  group: string,
  categorySlug: string,
  productSlug: string,
): Promise<{ category: CategoryPageView; product: Product } | undefined> {
  const category = await getCategoryPage(group, categorySlug);
  const product = category?.products.find((item) => item.slug === productSlug);
  if (!category || !product) return undefined;
  return { category, product };
}

export function getRelatedProducts(
  category: CategoryPageView,
  excludeSlug: string,
  limit = 6,
): Product[] {
  return category.products.filter((product) => product.slug !== excludeSlug).slice(0, limit);
}
