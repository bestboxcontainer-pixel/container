export interface CategoryGuideSection {
  heading: string;
  body: string;
}

export interface CategoryGuide {
  intro: string;
  sections: CategoryGuideSection[];
  closing: string;
}

export type ProductGroup = "haushalt" | "multimedia";

export interface CategoryRecord {
  id: string;
  group: ProductGroup;
  slug: string;
  label: string;
  description: string;
  image: string;
  guide: CategoryGuide;
}

export interface ProductRecord {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  bullets: string[];
  image?: string;
  oldPrice?: string;
  price: string;
  badge?: string;
  rating?: number;
  inStock?: boolean;
}
