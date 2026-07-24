export interface NavLink {
  label: string;
  href: string;
}

export interface Category {
  label: string;
  href: string;
  image: string;
}

export interface CategoryGroup {
  label: string;
  href: string;
  items: Category[];
}

export interface Product {
  slug?: string;
  sku?: string;
  brand: string;
  name: string;
  bullets: string[];
  image: string;
  alt: string;
  oldPrice?: string;
  price: string;
  badge?: string;
  href: string;
  rating?: number;
  inStock?: boolean;
}

export interface PromoBanner {
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  alt: string;
}
