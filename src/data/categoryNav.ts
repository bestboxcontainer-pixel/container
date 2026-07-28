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
      { slug: "kaffeemaschinen", href: "/haushalt/kaffeemaschinen", image: "/images/products/coffee-machine.jpg" },
      { slug: "waschmaschinen", href: "/haushalt/waschmaschinen", image: "/images/products/washing-machine.jpg" },
      { slug: "geschirrspueler", href: "/haushalt/geschirrspueler", image: "/images/products/dishwasher.jpg" },
      { slug: "staubsauger", href: "/haushalt/staubsauger", image: "/images/products/vacuum.jpg" },
      { slug: "backoefen-herde", href: "/haushalt/backoefen-herde", image: "/images/products/oven.jpg" },
      { slug: "klimageraete", href: "/haushalt/klimageraete", image: "/images/products/aircon-unit.png" },
    ],
  },
  {
    slug: "multimedia",
    href: "/multimedia",
    items: [
      { slug: "smartphones", href: "/multimedia/smartphones", image: "/images/products/smartphone.jpg" },
      { slug: "videospiele", href: "/multimedia/videospiele", image: "/images/products/game-controller.jpg" },
      { slug: "fernseher", href: "/multimedia/fernseher", image: "/images/products/tv.jpg" },
      { slug: "computer", href: "/multimedia/computer", image: "/images/products/computer.jpg" },
      { slug: "smartwatches", href: "/multimedia/smartwatches", image: "/images/products/smartwatch.jpg" },
      { slug: "drohnen", href: "/multimedia/drohnen", image: "/images/products/drone.jpg" },
    ],
  },
];
