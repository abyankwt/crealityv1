export interface FeaturedProduct {
  name: string;
  image: string;
  href: string;
  price?: string;
}

export interface NavGroup {
  title: string;
  categories?: string[];
  groups?: NavGroup[];
  /** Mark a top-level group as the featured column (renders column 4 of mega menu) */
  featured?: boolean;
  featuredProduct?: FeaturedProduct;
}

export const STORE_NAVIGATION: NavGroup[] = [
  {
    title: "3D Printers",
    groups: [
      {
        title: "FDM Series",
        categories: ["fdm-printers", "k1-series", "ender-series", "cr-series"],
      },
      {
        title: "Resin Series",
        categories: ["resin-printers", "halot-series"],
      },
      {
        title: "Laser & Milling",
        categories: ["laser-engravers", "cnc-milling"],
      },
    ],
  },
  {
    title: "Materials",
    groups: [
      {
        title: "Filament",
        categories: ["pla", "abs", "petg"],
      },
      {
        title: "Resin Types",
        categories: ["resin", "water-washable-resin", "abs-like-resin"],
      },
    ],
  },
  {
    title: "Spare Parts",
    groups: [
      {
        title: "FDM Parts",
        categories: ["nozzles", "hotends", "extruders"],
      },
      {
        title: "Resin Parts",
        categories: ["fep-film", "build-plate"],
      },
      {
        title: "Accessories",
        categories: ["accessories", "tools", "upgrades"],
      },
    ],
  },
  {
    title: "Featured",
    featured: true,
    featuredProduct: {
      name: "Creality K1 Max",
      image: "/images/printers.jpg",
      href: "/category/3d-printers",
      price: "From KWD 149.00",
    },
  },
];
