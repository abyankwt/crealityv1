// TEMPORARY DEMO NAVIGATION - replace with dynamic WooCommerce categories later
import "server-only";

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  children: CategoryNode[];
};

const DEMO_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 1,
    name: "3D Printers",
    slug: "3d-printers",
    image: null,
    children: [
      {
        id: 101,
        name: "K Series",
        slug: "k-series",
        image: null,
        children: [],
      },
      {
        id: 102,
        name: "Ender Series",
        slug: "ender-series",
        image: null,
        children: [],
      },
      {
        id: 103,
        name: "Spark i7",
        slug: "spark-i7",
        image: null,
        children: [],
      },
      {
        id: 104,
        name: "Hi Printer",
        slug: "hi-printer",
        image: null,
        children: [],
      },
      {
        id: 105,
        name: "Sermoon Series",
        slug: "sermoon-series",
        image: null,
        children: [],
      },
      {
        id: 106,
        name: "Resin Series",
        slug: "resin-series",
        image: null,
        children: [],
      },
    ],
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
        id: 301,
        name: "Filament Dryer",
        slug: "filament-dryer",
        image: null,
        children: [],
      },
      {
        id: 302,
        name: "Tools",
        slug: "tools",
        image: null,
        children: [],
      },
      {
        id: 303,
        name: "Auto Leveling",
        slug: "auto-leveling",
        image: null,
        children: [],
      },
      {
        id: 304,
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
  return DEMO_CATEGORY_TREE;
}
