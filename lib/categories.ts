// TEMPORARY DEMO NAVIGATION - replace with dynamic WooCommerce categories later
import "server-only";

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  children: CategoryNode[];
  productCategorySlugs?: string[];
  routeAliases?: string[];
  productMatchTokens?: string[];
};

export const PRINTER_SUBMENU_CATEGORIES: CategoryNode[] = [
  {
    id: 410,
    name: "K Series",
    slug: "k-series",
    image: null,
    children: [],
    routeAliases: ["k-seies"],
    productCategorySlugs: [
      "k-series",
      "k1",
      "k2",
      "k2-plus",
      "k-seies",
    ],
    productMatchTokens: ["k1", "k2", "k2-plus", "k2plus"],
  },
  {
    id: 102,
    name: "Ender Series",
    slug: "ender-series",
    image: null,
    children: [],
    productCategorySlugs: ["ender-series"],
  },
  {
    id: 412,
    name: "Spark i7",
    slug: "spark-i7",
    image: null,
    children: [],
    productCategorySlugs: ["spark-i7"],
  },
  {
    id: 104,
    name: "Hi Printer",
    slug: "hi-printer",
    image: null,
    children: [],
    productCategorySlugs: ["hi-printer", "hi-series", "hi"],
  },
  {
    id: 23,
    name: "Sermoon Series",
    slug: "sermoon-series",
    image: null,
    children: [],
    productCategorySlugs: ["sermoon-series"],
  },
  {
    id: 106,
    name: "Resin Series",
    slug: "resin-series",
    image: null,
    children: [],
    routeAliases: ["halot-series"],
    productCategorySlugs: ["resin-series", "halot-series"],
  },
];

export function getPrinterSubmenuCategoryBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  return (
    PRINTER_SUBMENU_CATEGORIES.find(
      (category) =>
        category.slug === normalizedSlug ||
        category.routeAliases?.includes(normalizedSlug)
    ) ?? null
  );
}

export function getPrinterSubmenuProductCategorySlugs(slug: string) {
  return getPrinterSubmenuCategoryBySlug(slug)?.productCategorySlugs ?? [];
}

export function getPrinterSubmenuProductMatchTokens(slug: string) {
  return getPrinterSubmenuCategoryBySlug(slug)?.productMatchTokens ?? [];
}

const FIXED_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 1,
    name: "3D Printers",
    slug: "3d-printers",
    image: null,
    children: PRINTER_SUBMENU_CATEGORIES,
  },
  {
    id: 2,
    name: "3D Scanners",
    slug: "3d-scanners",
    image: null,
    children: [
      {
        id: 201,
        name: "3D Scanner Series",
        slug: "3d-scanner-series",
        image: null,
        children: [],
      },
    ],
  },
  {
    id: 3,
    name: "Accessories",
    slug: "accessories",
    image: null,
    children: [
      {
        id: 302,
        name: "Tools",
        slug: "tools",
        image: null,
        children: [],
      },
      {
        id: 303,
        name: "Wifi Upgrade Kits",
        slug: "wifi-upgrade-kits",
        image: null,
        children: [],
      },
      {
        id: 304,
        name: "Screen Kit",
        slug: "screen-kit",
        image: null,
        children: [],
      },
      {
        id: 305,
        name: "Auto Leveling",
        slug: "auto-leveling",
        image: null,
        children: [],
      },
      {
        id: 306,
        name: "Silent Motherboard",
        slug: "silent-motherboard",
        image: null,
        children: [],
      },
      {
        id: 307,
        name: "Printer Enclosure",
        slug: "printer-enclosure",
        image: null,
        children: [],
      },
    ],
  },
  {
    id: 4,
    name: "Materials",
    slug: "materials",
    image: null,
    children: [
      {
        id: 401,
        name: "PLA Filaments",
        slug: "pla-filaments",
        image: null,
        children: [],
      },
      {
        id: 402,
        name: "PETG Filaments",
        slug: "petg-filaments",
        image: null,
        children: [],
      },
      {
        id: 403,
        name: "TPU Filaments",
        slug: "tpu-filaments",
        image: null,
        children: [],
      },
      {
        id: 404,
        name: "ABS Filaments",
        slug: "abs-filaments",
        image: null,
        children: [],
      },
      {
        id: 405,
        name: "Resin",
        slug: "resin",
        image: null,
        children: [],
      },
    ],
  },
  {
    id: 5,
    name: "Washing & Curing",
    slug: "washing-curing",
    image: null,
    children: [
      {
        id: 501,
        name: "Washing & Curing Series",
        slug: "washing-curing-series",
        image: null,
        children: [],
      },
    ],
  },

  {
    id: 6,
    name: "Laser & Milling",
    slug: "laser-milling",
    image: null,
    children: [
      {
        id: 601,
        name: "Laser & Milling Series",
        slug: "laser-milling-series",
        image: null,
        children: [],
      },
    ],
  },
  {
    id: 7,
    name: "Spare Parts",
    slug: "spare-parts",
    image: null,
    children: [],
  },
];

export async function getCategoryTree(): Promise<CategoryNode[]> {
  return FIXED_CATEGORY_TREE;
}
