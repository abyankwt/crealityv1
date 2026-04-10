import { formatPrice } from "@/lib/price";
import { decodeHtmlEntities } from "@/lib/decodeHtml";
import {
  isPreOrderProduct,
  resolveProductLeadTime,
  resolveProductOrderType,
} from "@/lib/productLogic";
import type {
  Product,
  ProductAttribute,
  ProductCategory,
  ProductImage,
  ProductMeta,
  ProductTag,
} from "@/lib/woocommerce-types";

const DEFAULT_CURRENCY_CODE = "KWD";
const DEFAULT_CURRENCY_SYMBOL = "KWD";

export type WooRestImage = {
  id: number;
  src: string;
  alt?: string | null;
  name?: string | null;
};

export type WooRestCategory = {
  id: number;
  name: string;
  slug: string;
  parent?: number;
};

export type WooRestTag = {
  id: number;
  name: string;
  slug: string;
};

export type WooRestAttribute = {
  id: number;
  name: string;
  options?: string[];
  visible?: boolean;
  variation?: boolean;
};

export type WooRestProduct = {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  permalink?: string;
  description?: string;
  short_description?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  price_html?: string;
  images?: WooRestImage[];
  categories?: WooRestCategory[];
  tags?: WooRestTag[];
  attributes?: WooRestAttribute[];
  meta_data?: ProductMeta[];
  stock_status?: string;
  stock_quantity?: number | null;
  purchasable?: boolean;
  status?: string;
  average_rating?: string | number;
  rating_count?: number;
  related_ids?: number[];
  weight?: string | number | null;
  dimensions?: {
    length?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
  } | null;
  in_stock?: boolean;
  featured?: boolean;
};

function normalizeImage(image: WooRestImage): ProductImage {
  return {
    id: image.id,
    src: image.src,
    alt: image.alt ?? null,
    name: image.name ?? null,
    thumbnail: null,
  };
}

function normalizeCategory(category: WooRestCategory): ProductCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent ?? 0,
    image: null,
  };
}

function normalizeTag(tag: WooRestTag): ProductTag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

function normalizeAttribute(attribute: WooRestAttribute): ProductAttribute {
  return {
    id: attribute.id,
    name: attribute.name,
    options: attribute.options ?? [],
    visible: Boolean(attribute.visible ?? true),
    variation: Boolean(attribute.variation),
  };
}

function parsePrice(value?: string) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function normalizeWooRestProduct(product: WooRestProduct): Product {
  const categories = (product.categories ?? []).map(normalizeCategory);
  const isPreOrder = isPreOrderProduct(product);
  const resolvedOrderType = resolveProductOrderType({
    product_order_type: undefined,
    is_preorder: isPreOrder,
    stock_status: product.stock_status,
    is_in_stock: product.in_stock ?? product.stock_status === "instock",
    categories,
    meta_data: product.meta_data,
    tags: product.tags,
  });
  const price = parsePrice(product.price);
  const regularPrice = parsePrice(product.regular_price);
  const salePrice = parsePrice(product.sale_price);

  return {
    id: product.id,
    name: decodeHtmlEntities(product.name),
    slug: product.slug,
    sku: product.sku ? decodeHtmlEntities(product.sku) : null,
    permalink: product.permalink,
    description: product.description,
    short_description: product.short_description,
    price_html: product.price_html,
    prices: {
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      currency_code: DEFAULT_CURRENCY_CODE,
      currency_symbol: DEFAULT_CURRENCY_SYMBOL,
      currency_minor_unit: 2,
    },
    price,
    regular_price: regularPrice,
    sale_price: salePrice,
    formatted_price: formatPrice(price),
    currency_code: DEFAULT_CURRENCY_CODE,
    currency_symbol: DEFAULT_CURRENCY_SYMBOL,
    currency_minor_unit: 2,
    images: (product.images ?? []).map(normalizeImage),
    attributes: (product.attributes ?? []).map(normalizeAttribute),
    category_slug: categories.map((category) => category.slug),
    categories,
    tags: (product.tags ?? []).map(normalizeTag),
    is_preorder: isPreOrder,
    lead_time: resolveProductLeadTime(product),
    order_type: resolvedOrderType,
    meta_data: product.meta_data ?? [],
    product_order_type: resolvedOrderType,
    is_in_stock: product.in_stock ?? product.stock_status === "instock",
    stock_status: product.stock_status
      ?? (product.in_stock === true ? "instock" : "outofstock"),
    stock_quantity: typeof product.stock_quantity === "number"
      ? product.stock_quantity
      : typeof product.stock_quantity === "string" && product.stock_quantity !== ""
      ? (Number.isFinite(Number(product.stock_quantity)) ? Number(product.stock_quantity) : null)
      : null,
    weight: product.weight ?? null,
    dimensions: product.dimensions ?? null,
    purchasable: Boolean(product.purchasable),
    average_rating:
      typeof product.average_rating === "string"
        ? Number(product.average_rating)
        : product.average_rating,
    review_count: product.rating_count,
    featured: product.featured,
    related_ids: product.related_ids,
  };
}
