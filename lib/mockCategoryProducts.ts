import type {
  Product,
  ProductCategory,
  ProductOrderType,
} from "@/lib/woocommerce-types";

function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

type MockProductInput = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  stockStatus?: Product["stock_status"];
  orderType?: ProductOrderType;
  featured?: boolean;
};

function buildCategory(slug: string): ProductCategory {
  return {
    id: Math.abs(
      slug.split("").reduce((acc, character) => acc + character.charCodeAt(0), 0)
    ),
    name: slugToTitle(slug),
    slug,
    parent: 0,
    description: `${slugToTitle(slug)} demo category`,
    image: null,
  };
}

function createMockProduct({
  id,
  name,
  slug,
  price,
  image,
  categorySlug,
  description,
  shortDescription,
  stockStatus = "instock",
  orderType = "in_stock",
  featured = false,
}: MockProductInput): Product {
  const category = buildCategory(categorySlug);

  return {
    id,
    name,
    slug,
    permalink: `/product/${slug}`,
    description,
    short_description: shortDescription,
    price_html: "",
    prices: {
      price: String(Math.round(price * 1000)),
      regular_price: String(Math.round(price * 1000)),
      sale_price: String(Math.round(price * 1000)),
      currency_code: "KWD",
      currency_symbol: "KWD",
      currency_minor_unit: 3,
    },
    price,
    regular_price: price,
    sale_price: price,
    formatted_price: `${price.toFixed(2)} KWD`,
    currency_code: "KWD",
    currency_symbol: "KWD",
    currency_minor_unit: 3,
    images: [
      {
        id,
        src: image,
        alt: name,
        name,
      },
    ],
    attributes: [],
    category_slug: [categorySlug],
    categories: [category],
    tags: [],
    is_preorder: orderType === "pre_order",
    lead_time: orderType === "pre_order" ? "~45 days" : null,
    order_type: orderType,
    meta_data: [],
    product_order_type: orderType,
    is_in_stock: stockStatus === "instock",
    stock_status: stockStatus,
    stock_quantity: stockStatus === "instock" ? 12 : 0,
    purchasable: true,
    average_rating: 0,
    review_count: 0,
    featured,
    related_ids: [],
  };
}

export const mockCategoryProducts: Product[] = [
  createMockProduct({
    id: 910001,
    name: "Creality K1C",
    slug: "creality-k1c-demo",
    price: 189,
    image: "/images/printers.jpg",
    categorySlug: "k1",
    description: "Demo K Series printer for manager walkthroughs.",
    shortDescription: "Fast enclosed K Series printer for the showroom demo.",
    featured: true,
  }),
  createMockProduct({
    id: 910002,
    name: "Creality K1 Max",
    slug: "creality-k1-max-demo",
    price: 249,
    image: "/images/store-hero.jpg",
    categorySlug: "k1",
    description: "Large-format K Series printer for demo catalog coverage.",
    shortDescription: "High-volume K Series machine with larger build area.",
  }),
  createMockProduct({
    id: 910003,
    name: "Creality K2 Plus Combo",
    slug: "creality-k2-plus-combo-demo",
    price: 329,
    image: "/images/store-hero-new.jpg",
    categorySlug: "k2-plus",
    description: "Premium K Series hardware demo product.",
    shortDescription: "Advanced K Series setup for production-focused teams.",
  }),
  createMockProduct({
    id: 910101,
    name: "Ender 3 V3 KE",
    slug: "ender-3-v3-ke-demo",
    price: 129,
    image: "/images/printers.jpg",
    categorySlug: "ender-series",
    description: "Demo Ender Series printer for category showcase pages.",
    shortDescription: "Reliable Ender Series printer with updated motion system.",
  }),
  createMockProduct({
    id: 910102,
    name: "Ender 3 V3 Plus",
    slug: "ender-3-v3-plus-demo",
    price: 159,
    image: "/images/store-hero.jpg",
    categorySlug: "ender-series",
    description: "Expanded Ender Series demo item for category coverage.",
    shortDescription: "Larger Ender Series configuration for wider use cases.",
  }),
  createMockProduct({
    id: 910103,
    name: "Ender 5 S1",
    slug: "ender-5-s1-demo",
    price: 199,
    image: "/images/store-hero-new.jpg",
    categorySlug: "ender-series",
    description: "Cube-frame Ender Series machine for demo pages.",
    shortDescription: "Rigid Ender Series printer built for dependable output.",
  }),
  createMockProduct({
    id: 910201,
    name: "Hyper PLA White 1kg",
    slug: "hyper-pla-white-demo",
    price: 9.5,
    image: "/images/materials.jpg",
    categorySlug: "pla-filaments",
    description: "Demo PLA filament spool for materials category coverage.",
    shortDescription: "Fast-printing PLA filament tuned for clean surfaces.",
  }),
  createMockProduct({
    id: 910202,
    name: "Hyper PLA Black 1kg",
    slug: "hyper-pla-black-demo",
    price: 9.5,
    image: "/images/materials.jpg",
    categorySlug: "pla-filaments",
    description: "Black PLA spool for category demo pages.",
    shortDescription: "General-purpose PLA filament for prototypes and parts.",
  }),
  createMockProduct({
    id: 910203,
    name: "Hyper PLA Grey 1kg",
    slug: "hyper-pla-grey-demo",
    price: 10.0,
    image: "/images/materials.jpg",
    categorySlug: "pla-filaments",
    description: "Grey PLA spool to keep category grids populated.",
    shortDescription: "Balanced PLA material for everyday printing workflows.",
  }),
  createMockProduct({
    id: 910301,
    name: "Creality Space Pi Filament Dryer",
    slug: "space-pi-dryer-demo",
    price: 34,
    image: "/images/materials.jpg",
    categorySlug: "accessories",
    description: "Accessory demo product for the storefront walkthrough.",
    shortDescription: "Compact dryer for moisture-sensitive filament storage.",
  }),
  createMockProduct({
    id: 910302,
    name: "Nozzle Kit Set",
    slug: "nozzle-kit-set-demo",
    price: 7.5,
    image: "/images/spareparts.jpg",
    categorySlug: "accessories",
    description: "Accessory kit used to demonstrate spare setup essentials.",
    shortDescription: "Replacement nozzle assortment for routine maintenance.",
  }),
  createMockProduct({
    id: 910303,
    name: "Tool Wrap Essentials",
    slug: "tool-wrap-essentials-demo",
    price: 14,
    image: "/images/spareparts.jpg",
    categorySlug: "accessories",
    description: "Accessory demo bundle for setup and maintenance tasks.",
    shortDescription: "Core tool set for printer setup and service routines.",
    stockStatus: "outofstock",
    orderType: "special_order",
  }),
];

export function getMockProductsByCategorySlug(categorySlug: string): Product[] {
  return mockCategoryProducts.filter(
    (product) => product.category_slug.includes(categorySlug)
  );
}

export function getDefaultMockProducts(): Product[] {
  return mockCategoryProducts.slice(0, 8);
}
