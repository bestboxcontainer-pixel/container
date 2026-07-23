export interface NavLink {
  label: string;
  href: string;
}

export interface Category {
  label: string;
  href: string;
  image: string;
}

export interface Product {
  brand: string;
  name: string;
  bullets: string[];
  image: string;
  alt: string;
  oldPrice?: string;
  price: string;
  badge?: string;
  href: string;
}

export interface PromoBanner {
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  alt: string;
}
