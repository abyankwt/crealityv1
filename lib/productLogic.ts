import type { ProductOrderType } from "@/lib/woocommerce-types";

type ProductCategoryLike = {
  slug?: string | null;
  name?: string | null;
};

type ProductTagLike = {
  slug?: string | null;
  name?: string | null;
};

type ProductMetaLike = {
  key?: string | null;
  value?: unknown;
};

type ProductLike = {
  product_order_type?: ProductOrderType | null;
  order_type?: ProductOrderType | null;
  is_preorder?: boolean | null;
  is_in_stock?: boolean | null;
  stock_status?: string | null;
  stock_quantity?: number | null;
  category_slug?: string[] | null;
  categories?: ProductCategoryLike[] | null;
  tags?: ProductTagLike[] | null;
  meta_data?: ProductMetaLike[] | null;
  lead_time?: string | null;
};

const PRE_ORDER_DEFAULT_LEAD_TIME = "~45 days";
const USED_PRINTERS_CATEGORY_SLUG = "used-3d-printers";
const PRE_ORDER_META_KEYS = [
  "is_preorder",
  "preorder",
  "pre_order",
  "_is_preorder",
  "_preorder",
  "product_preorder",
];
const PRE_ORDER_LEAD_TIME_KEYS = [
  "lead_time",
  "preorder_lead_time",
  "pre_order_lead_time",
  "_preorder_lead_time",
  "_pre_order_lead_time",
];

function normalizePreOrderToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesPreOrderToken(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return normalizePreOrderToken(value).includes("preorder");
}

function matchesUsedPrintersToken(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return normalizePreOrderToken(value).includes("used3dprinters");
}

function readMetaValue(
  meta: ProductMetaLike[] | null | undefined,
  keys: string[]
): string | null {
  if (!meta?.length) {
    return null;
  }

  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const matched = meta.find((entry) =>
    entry.key ? normalizedKeys.has(entry.key.toLowerCase()) : false
  );

  if (!matched) {
    return null;
  }

  if (typeof matched.value === "string") {
    return matched.value.trim();
  }

  return String(matched.value).trim();
}

function isTruthyFlag(value: string | null) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function isPreOrderProduct(product: ProductLike | null | undefined) {
  if (!product) {
    return false;
  }

  if (typeof product.is_preorder === "boolean") {
    return product.is_preorder;
  }

  if (
    product.product_order_type === "pre_order" ||
    product.order_type === "pre_order"
  ) {
    return true;
  }

  if (product.category_slug?.some((slug) => matchesPreOrderToken(slug))) {
    return true;
  }

  if (
    product.categories?.some(
      (category) =>
        matchesPreOrderToken(category.slug) || matchesPreOrderToken(category.name)
    )
  ) {
    return true;
  }

  if (
    product.tags?.some(
      (tag) => matchesPreOrderToken(tag.slug) || matchesPreOrderToken(tag.name)
    )
  ) {
    return true;
  }

  return isTruthyFlag(readMetaValue(product.meta_data, PRE_ORDER_META_KEYS));
}

export function isPreOrderSectionProduct(
  product: ProductLike | null | undefined
) {
  if (!product) {
    return false;
  }

  if (product.category_slug?.some((slug) => matchesPreOrderToken(slug))) {
    return true;
  }

  if (
    product.categories?.some(
      (category) =>
        matchesPreOrderToken(category.slug) || matchesPreOrderToken(category.name)
    )
  ) {
    return true;
  }

  return Boolean(
    product.tags?.some(
      (tag) => matchesPreOrderToken(tag.slug) || matchesPreOrderToken(tag.name)
    )
  );
}

export function isUsedPrinterProduct(product: ProductLike | null | undefined) {
  if (!product) {
    return false;
  }

  if (
    product.category_slug?.some(
      (slug) =>
        slug?.toLowerCase() === USED_PRINTERS_CATEGORY_SLUG ||
        matchesUsedPrintersToken(slug)
    )
  ) {
    return true;
  }

  return Boolean(
    product.categories?.some(
      (category) =>
        category.slug?.toLowerCase() === USED_PRINTERS_CATEGORY_SLUG ||
        matchesUsedPrintersToken(category.slug) ||
        matchesUsedPrintersToken(category.name)
    )
  );
}

export function isVisibleUsedPrinterProduct(
  product: ProductLike | null | undefined
) {
  if (!isUsedPrinterProduct(product)) {
    return false;
  }

  return typeof product?.stock_quantity === "number" && product.stock_quantity > 0;
}

export type ProductSection = "default" | "preorders" | "used_printers";

export function resolveProductSection(
  product: ProductLike | null | undefined
): ProductSection {
  if (isUsedPrinterProduct(product)) {
    return "used_printers";
  }

  if (isPreOrderSectionProduct(product)) {
    return "preorders";
  }

  return "default";
}

export function resolveProductSectionFromSlug(slug: string | null | undefined) {
  if (!slug) {
    return "default" as const;
  }

  if (slug.toLowerCase() === USED_PRINTERS_CATEGORY_SLUG) {
    return "used_printers" as const;
  }

  return matchesPreOrderToken(slug) ? ("preorders" as const) : ("default" as const);
}

export function filterProductsForSection<T extends ProductLike>(
  products: T[],
  section: ProductSection
) {
  return products.filter((product) => {
    if (section === "preorders") {
      return isPreOrderSectionProduct(product);
    }

    if (section === "used_printers") {
      return isVisibleUsedPrinterProduct(product);
    }

    return !isPreOrderSectionProduct(product) && !isUsedPrinterProduct(product);
  });
}

export function resolveProductLeadTime(
  product: ProductLike | null | undefined
) {
  if (!product) {
    return null;
  }

  if (product.lead_time?.trim()) {
    return product.lead_time.trim();
  }

  const leadTimeMeta = readMetaValue(product.meta_data, PRE_ORDER_LEAD_TIME_KEYS);
  if (leadTimeMeta) {
    return leadTimeMeta;
  }

  return isPreOrderProduct(product) ? PRE_ORDER_DEFAULT_LEAD_TIME : null;
}

export function resolveProductOrderType(
  product: ProductLike | null | undefined
): ProductOrderType {
  if (isPreOrderProduct(product)) {
    return "pre_order";
  }

  if (product?.product_order_type) {
    return product.product_order_type;
  }

  if (product?.order_type) {
    return product.order_type;
  }

  if (product?.stock_status === "instock") {
    return "in_stock";
  }

  if (
    product?.stock_status === "outofstock" ||
    product?.stock_status === "onbackorder"
  ) {
    return "special_order";
  }

  return product?.is_in_stock === true ? "in_stock" : "special_order";
}

export function resolveDisplayProductOrderType(
  product: ProductLike | null | undefined,
  section: ProductSection = resolveProductSection(product)
): ProductOrderType {
  if (section === "used_printers") {
    return "in_stock";
  }

  if (section === "preorders" && isPreOrderSectionProduct(product)) {
    return "pre_order";
  }

  return product?.stock_status === "instock" ? "in_stock" : "special_order";
}

export type ProductAvailability = {
  type: "preorder" | "available" | "special" | "unavailable";
  label: "Pre-Order" | "Add to Cart" | "Special Order" | "Out of Stock";
  badge: "Pre-Order" | "In Stock" | "Special Order" | "Out of Stock";
  leadTime: string | null;
};

export function getProductAvailability(
  product: ProductLike | null | undefined,
  section: ProductSection = resolveProductSection(product)
): ProductAvailability {
  if (!product) {
    return {
      type: "unavailable",
      label: "Out of Stock",
      badge: "Out of Stock",
      leadTime: null,
    };
  }

  const orderType = resolveDisplayProductOrderType(product, section);

  if (orderType === "in_stock") {
    return {
      type: "available",
      label: "Add to Cart",
      badge: "In Stock",
      leadTime: null,
    };
  }

  if (orderType === "pre_order") {
    return {
      type: "preorder",
      label: "Pre-Order",
      badge: "Pre-Order",
      leadTime: resolveProductLeadTime(product) ?? PRE_ORDER_DEFAULT_LEAD_TIME,
    };
  }

  if (orderType === "special_order") {
    return {
      type: "special",
      label: "Special Order",
      badge: "Special Order",
      leadTime: null,
    };
  }

  return {
    type: "unavailable",
    label: "Out of Stock",
    badge: "Out of Stock",
    leadTime: null,
  };
}
