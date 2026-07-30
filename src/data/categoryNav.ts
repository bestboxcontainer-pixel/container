// Structure de navigation mise en avant sur la page d'accueil (CategoryRow) et
// dans le menu du header (CategoryMenu). Ce module ne contient que des données :
// il est importé aussi bien côté serveur que côté client.
//
// Les libellés ne sont pas stockés ici : le slug sert de clé de traduction dans
// "common.groupNames" et "common.categoryNames".

export interface CategoryNavItem {
  slug: string;
  href: string;
  image: string;
}

export interface CategoryNavGroup {
  slug: string;
  href: string;
  items: CategoryNavItem[];
}

export const categoryGroups: CategoryNavGroup[] = [
  {
    slug: "haushalt",
    href: "/haushalt",
    items: [
      { slug: "kaffeemaschinen", href: "/haushalt/kaffeemaschinen", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785270056/hausgeraete-pfeffer/products/siemens-te657503de-kaffeevollautomat-eq-6-plus-s700-te657503-ctu3gk.jpg" },
      { slug: "waschmaschinen", href: "/haushalt/waschmaschinen", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785270225/hausgeraete-pfeffer/products/lg-f4wx808yc-waschmaschine-1-u293xu.avif" },
      { slug: "geschirrspueler", href: "/haushalt/geschirrspueler", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785322503/hausgeraete-pfeffer/products/bosch-smu4ecs31e-geschirrspueler-1-7q93ll.webp" },
      { slug: "staubsauger", href: "/haushalt/staubsauger", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785349820/hausgeraete-pfeffer/products/dreame-vc00127-nass-trocken-sauger-1-qsd2dq.webp" },
      { slug: "backoefen-herde", href: "/haushalt/backoefen-herde", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785327174/hausgeraete-pfeffer/products/neff-b64cs71g0k-backofen-1-veorlu.webp" },
      { slug: "kuechenmaschinen", href: "/haushalt/kuechenmaschinen", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785332086/hausgeraete-pfeffer/products/kitchenaid-5ksm50pkveft-kuechenmaschine-1-qicymz.webp" },
      { slug: "klimageraete", href: "/haushalt/klimageraete", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785357500/hausgeraete-pfeffer/products/midea-4122424-split-klimageraet-1-fajuip.jpg" },
    ],
  },
  {
    slug: "multimedia",
    href: "/multimedia",
    items: [
      { slug: "smartphones", href: "/multimedia/smartphones", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785272878/hausgeraete-pfeffer/products/motorola-razr-fold-512gb-1-2qb9zr.jpg" },
      { slug: "videospiele", href: "/multimedia/videospiele", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785351869/hausgeraete-pfeffer/products/sony-1000049749-1-08ggm2.webp" },
      { slug: "fernseher", href: "/multimedia/fernseher", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785322570/hausgeraete-pfeffer/products/samsung-gq83s95faexzg-83-zoll-1-pxknop.png" },
      { slug: "computer", href: "/multimedia/computer", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785351233/hausgeraete-pfeffer/products/asus-589153-notebook-1-7a0w1p.webp" },
      { slug: "smartwatches", href: "/multimedia/smartwatches", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785350922/hausgeraete-pfeffer/products/garmin-010-02582-01-smartwatch-1-fifozb.webp" },
      { slug: "drohnen", href: "/multimedia/drohnen", image: "https://res.cloudinary.com/kwve2yoq/image/upload/f_auto,q_auto/v1785353514/hausgeraete-pfeffer/products/dji-1976118350-drohne-1-gnxojg.jpg" },
    ],
  },
];
