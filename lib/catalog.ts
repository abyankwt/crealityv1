import "server-only";

import {
  getWooPublishedProductsByCategorySlug,
  getWooPublishedProductsByCategorySlugs,
  getWooAllPublishedProducts,
  getProductsRestData,
  getSpecialOrderProductIds,
} from "@/lib/woo-client";
import { fetchProducts, fetchProductsByCategory } from "@/lib/woocommerce";
import { fetchPreOrderProducts } from "@/lib/preOrders";
import {
  filterProductsByCategorySlugs,
  filterProductsForSection,
  isPreOrderSectionProduct,
  isServiceListingProduct,
  isUsedPrinterProduct,
  resolveProductSectionFromSlug,
} from "@/lib/productLogic";
import {
  getPrinterSubmenuCategoryBySlug,
} from "@/lib/categories";
import { productMatchesAnyToken } from "@/lib/productLogic";
import { fetchUsedPrinterProducts } from "@/lib/usedPrinters";
import { normalizeWooRestProduct } from "@/lib/wooRestProducts";
import type { FetchProductsResult } from "@/lib/woocommerce";
import type { Product } from "@/lib/woocommerce-types";
import type { ProductOrderType } from "@/lib/woocommerce-types";
import type { ProductSection } from "@/lib/productLogic";

type SortOrder = "asc" | "desc";

export type RawCatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type CatalogRequest = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  orderType?: ProductOrderType;
  sort?: string;
  stockStatus?: string;
  tag?: string;
  cacheMode?: "default" | "no-store";
};

type FetchPrinterSubmenuProductsRequest = {
  submenuSlug: string;
  page?: number;
  perPage?: number;
  sort?: string;
  stockStatus?: string;
  cache?: RequestCache;
};

type GroupedCategoryConfig = {
  routeSlugs: string[];
  productCategorySlugs: string[];
  productMatchTokens?: string[];
  cache?: RequestCache;
  filterBySection: boolean;
  productSectionOverride?: ProductSection;
  dataSource?: "store" | "woo-rest";
};

const GROUPED_CATEGORY_CONFIGS: GroupedCategoryConfig[] = [
  {
    // "View All" for Spare Parts — aggregates all FDM + Resin spare part categories
    routeSlugs: ["spare-parts"],
    productCategorySlugs: [
      // FDM Printers spare parts
      "extruderkit", "filament-sensor", "nozzle", "bed", "hotend", "hotbid",
      "bearing", "motors", "power-supply-fdm", "gears", "belt-cable-tubes",
      "fan", "otherkits",
      // Resin Printers spare parts
      "releasefilm", "protective_cover", "resin-vat-platform-kit",
      "print_screen", "power-supply-sla", "motherboard-sla",
      "cables-wires", "fans-sla", "toolkits",
    ],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    // "View All" for Accessories & Tools — aggregates all submenu categories
    routeSlugs: ["accessories", "accessories-tools"],
    productCategorySlugs: [
      "tools",
      "wifi-upgrade-kits",
      "screen-kit",
      "auto-leveling",
      "mother-board",       // WooCommerce slug for "Silent Motherboard"
      "printer-enclosure",
    ],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    // Individual Silent Motherboard category page — WC slug is "mother-board"
    routeSlugs: ["silent-motherboard"],
    productCategorySlugs: ["mother-board"],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    routeSlugs: ["3d-scanner-series", "3d-scanners-series", "3d-scanners"],
    productCategorySlugs: ["3d-scanners-series", "3d-scanner-series"],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    routeSlugs: ["fdm-printers"],
    productCategorySlugs: ["cr-series"],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    routeSlugs: ["resin-printers"],
    productCategorySlugs: ["resin-series", "halot-series"],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
  {
    // "View All" for Washing & Curing — products may be categorised under
    // "resin-series" in WooCommerce so token matching catches them by name.
    routeSlugs: ["washing-curing", "washing-curing-series"],
    productCategorySlugs: ["washing-curing", "washing-curing-series", "uw"],
    productMatchTokens: ["washing", "curing", "uw-0"],
    filterBySection: false,
    productSectionOverride: "default",
  },
  {
    // "View All" for 3D Printers — matches only products whose WooCommerce
    // category slug is one of the printer series slugs. Token matching was
    // removed because it incorrectly pulled in accessories/spare-parts whose
    // names contain printer model words (e.g. "Ender-5 Thermistor").
    routeSlugs: ["3d-printers"],
    productCategorySlugs: [
      "k-series", "k1", "k2", "k2-plus", "k-seies",
      "ender-series",
      "spark-i7",
      "hi-printer", "hi-series",
      "sermoon-series",
      "resin-series", "halot-series",
      "cr-series",
    ],
    filterBySection: false,
    productSectionOverride: "default",
    dataSource: "woo-rest",
  },
];

export function getCatalogParam(
  params: RawCatalogSearchParams,
  key: string
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export function resolveCatalogSort(sort?: string): {
  orderby: string;
  order: SortOrder;
} {
  switch (sort) {
    case "price_asc":
      return { orderby: "price", order: "asc" };
    case "price_desc":
      return { orderby: "price", order: "desc" };
    case "date_desc":
      return { orderby: "date", order: "desc" };
    default:
      return { orderby: "popularity", order: "desc" };
  }
}

const SLUG_ACRONYMS = new Set(["fdm", "3d"]);

export function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w+/g, (word) => {
      const lower = word.toLowerCase();
      if (SLUG_ACRONYMS.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

function paginateProducts(
  products: Product[],
  page: number,
  perPage: number
): FetchProductsResult {
  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const startIndex = Math.max(0, (page - 1) * perPage);

  return {
    data: products.slice(startIndex, startIndex + perPage),
    totalPages,
    totalProducts,
  };
}

async function fetchAllProductsForFiltering({
  perPage,
  orderby,
  order,
  stockStatus,
  cache,
}: {
  perPage: number;
  orderby: string;
  order: SortOrder;
  stockStatus?: string;
  cache?: RequestCache;
}) {
  const firstPage = await fetchProducts({
    page: 1,
    perPage,
    orderby,
    order,
    stock_status: stockStatus,
    cache,
  });

  const products = [...firstPage.data];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await fetchProducts({
      page,
      perPage,
      orderby,
      order,
      stock_status: stockStatus,
      cache,
    });
    products.push(...result.data);
  }

  return products;
}


function getGroupedCategoryConfig(categorySlug: string | undefined) {
  if (!categorySlug) {
    return null;
  }

  const normalizedSlug = categorySlug.trim().toLowerCase();

  return (
    GROUPED_CATEGORY_CONFIGS.find((config) =>
      config.routeSlugs.includes(normalizedSlug)
    ) ?? null
  );
}

export function shouldBypassSectionFilteringForCategory(
  categorySlug: string | undefined
) {
  return getGroupedCategoryConfig(categorySlug)?.filterBySection === false;
}

export function getCategoryProductSectionOverride(
  categorySlug: string | undefined
) {
  return getGroupedCategoryConfig(categorySlug)?.productSectionOverride;
}

async function fetchGroupedCategoryProducts({
  categorySlug,
  page = 1,
  perPage = 12,
  sort,
  stockStatus,
}: {
  categorySlug: string;
  page?: number;
  perPage?: number;
  sort?: string;
  stockStatus?: string;
}): Promise<FetchProductsResult> {
  const config = getGroupedCategoryConfig(categorySlug);

  if (!config) {
    return {
      data: [],
      totalPages: 0,
      totalProducts: 0,
    };
  }

  const { orderby, order } = resolveCatalogSort(sort);
  if (config.dataSource === "woo-rest") {
    // Single batched request: resolve all category IDs in one API call,
    // then fetch products per category ID in parallel — far fewer round-trips.
    const batchResult = await getWooPublishedProductsByCategorySlugs(
      config.productCategorySlugs,
      { orderby, order }
    );

    if (!batchResult.ok) {
      console.error(`[fetchGroupedCategoryProducts] Batch REST fetch failed for "${categorySlug}".`);
    }

    const allNormalized = batchResult.ok
      ? batchResult.data
          .filter((product) => product.status === "publish")
          .map(normalizeWooRestProduct)
      : [];

    // Deduplicate by product ID (products can belong to multiple categories)
    const seenIds = new Set<number>();
    const normalizedProducts = allNormalized.filter((p) => {
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    // Exclude service listings and used printers. Pre-orders are intentionally
    // kept so they appear on their sub-category pages alongside in-stock products.
    const filteredProducts = normalizedProducts.filter(
      (p) => !isServiceListingProduct(p) && !isUsedPrinterProduct(p)
    );

    // Only show out-of-stock products that are either in the "specialorder"
    // WooCommerce category or are pre-order products.
    const specialOrderIds = await getSpecialOrderProductIds();
    const visibleProducts = filteredProducts.filter(
      (p) => p.stock_status === "instock" || specialOrderIds.has(p.id) || isPreOrderSectionProduct(p)
    );

    return paginateProducts(visibleProducts, page, perPage);
  }

  const allProducts = await fetchAllProductsForFiltering({
    perPage: 100,
    orderby,
    order,
    stockStatus,
    cache: config.cache,
  });

  const matchTokens = config.productMatchTokens ?? [];
  const filteredProducts = allProducts.filter((product) => {
    // Exclude pre-orders — they belong on the dedicated pre-order page only.
    if (isPreOrderSectionProduct(product)) return false;
    if (filterProductsByCategorySlugs([product], config.productCategorySlugs).length > 0) {
      return true;
    }
    // Token fallback: catch products whose WooCommerce category slug doesn't exactly
    // match but whose name/slug matches a configured token (e.g. washing-curing products
    // that are also categorised under resin-series in WooCommerce).
    return matchTokens.length > 0 && productMatchesAnyToken(product, matchTokens);
  });

  const paginated = paginateProducts(filteredProducts, page, perPage);
  const enriched = await enrichWithRestData(paginated.data);
  return { ...paginated, data: enriched };
}

export async function fetchPrinterSubmenuProducts({
  submenuSlug,
  page = 1,
  perPage = 12,
  sort,
  stockStatus,
  cache = "default",
}: FetchPrinterSubmenuProductsRequest): Promise<FetchProductsResult> {
  const matchedCategory = getPrinterSubmenuCategoryBySlug(submenuSlug);
  const matchedSlugs = matchedCategory?.productCategorySlugs ?? [];
  const excludeNameTokens = matchedCategory?.excludeNameTokens ?? [];

  if (matchedSlugs.length === 0) {
    return {
      data: [],
      totalPages: 0,
      totalProducts: 0,
    };
  }

  const { orderby, order } = resolveCatalogSort(sort);
  const allProducts = await fetchAllProductsForFiltering({
    perPage: 100,
    orderby,
    order,
    stockStatus,
    cache,
  });

  const candidateProducts = allProducts.filter((product) => {
    // Exclude products whose name matches a disqualifying token (e.g. exclude
    // washing/curing machines from the Halot Series page).
    if (excludeNameTokens.length > 0) {
      const nameLower = product.name.toLowerCase();
      if (excludeNameTokens.some((t) => nameLower.includes(t.toLowerCase()))) {
        return false;
      }
    }
    return filterProductsByCategorySlugs([product], matchedSlugs).length > 0;
  });

  const specialOrderIds = await getSpecialOrderProductIds();
  const filteredProducts = candidateProducts.filter(
    (p) => p.stock_status === "instock" || specialOrderIds.has(p.id) || isPreOrderSectionProduct(p)
  );

  const paginated = paginateProducts(filteredProducts, page, perPage);
  const enriched = await enrichWithRestData(paginated.data);
  return { ...paginated, data: enriched };
}

async function enrichWithRestData(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  const ids = products.map((p) => p.id).filter(Boolean);
  if (ids.length === 0) return products;

  try {
    const restResult = await getProductsRestData(ids);
    if (!restResult.ok || !restResult.data?.length) return products;

    const byId = new Map(restResult.data.map((d) => [d.id, d]));
    return products.map((p) => {
      const extra = byId.get(p.id);
      if (!extra) return p;
      return {
        ...p,
        sku: p.sku ?? extra.sku ?? null,
        stock_quantity: extra.stock_quantity ?? p.stock_quantity ?? null,
      };
    });
  } catch (err) {
    console.error("[enrichWithRestData] failed:", err);
    return products;
  }
}

export async function fetchCatalogProducts({
  page = 1,
  perPage = 16,
  categorySlug,
  orderType,
  sort,
  stockStatus,
  tag,
  cacheMode,
}: CatalogRequest): Promise<FetchProductsResult> {
  if (orderType === "pre_order") {
    return fetchPreOrderProducts({ page, perPage });
  }

  const { orderby, order } = resolveCatalogSort(sort);
  const categorySection = resolveProductSectionFromSlug(categorySlug);
  const groupedCategoryConfig = getGroupedCategoryConfig(categorySlug);

  if (categorySlug) {
    if (categorySection === "used_printers") {
      return fetchUsedPrinterProducts({ page, perPage });
    }

    if (groupedCategoryConfig) {
      return fetchGroupedCategoryProducts({
        categorySlug,
        page,
        perPage,
        sort,
        stockStatus,
      });
    }

    // Use WooCommerce REST API directly for all individual category pages.
    // The Store API's products/categories endpoint often omits subcategories,
    // causing fetchProductsByCategory to silently return 0 results and fall
    // through to mock data. The REST API is authoritative and already used by
    // all grouped category configs (Accessories, Spare Parts, etc.).
    // Pass revalidate: 60 to match the page's ISR interval and avoid stale
    // empty-result caches from the default 5-minute revalidate window.
    const restResult = await getWooPublishedProductsByCategorySlug(categorySlug, {
      orderby,
      order,
      revalidate: 60,
    });

    if (restResult.ok && restResult.data.length > 0) {
      const normalized = restResult.data
        .filter((p) => p.status === "publish")
        .map(normalizeWooRestProduct);
      const filtered = filterProductsForSection(normalized, categorySection);

      // Only show out-of-stock products that are either in the "specialorder"
      // WooCommerce category or are pre-order products.
      const specialOrderIds = await getSpecialOrderProductIds();
      const visible = filtered.filter(
        (p) => p.stock_status === "instock" || specialOrderIds.has(p.id) || isPreOrderSectionProduct(p)
      );

      return paginateProducts(visible, page, perPage);
    }

    // REST API returned nothing — try the Store API as a secondary source.
    const result = await fetchProductsByCategory(categorySlug, page, {
      orderby,
      order,
      stock_status: stockStatus,
      cache: cacheMode,
    });

    if (result.data.length > 0) {
      const filtered = filterProductsForSection(result.data, categorySection);
      const enriched = await enrichWithRestData(filtered);
      return { ...result, data: enriched };
    }

    return { data: [], totalPages: 0, totalProducts: 0 };
  }

  // Use the REST API for the store-all page so out-of-stock special order
  // products are included — the Store API hides them when the WooCommerce
  // "hide out of stock items" setting is on.
  if (!tag) {
    const restResult = await getWooAllPublishedProducts({
      orderby,
      order,
      revalidate: 300,
    });

    if (restResult.ok && restResult.data.length > 0) {
      const normalized = restResult.data
        .filter((p) => p.status === "publish")
        .map(normalizeWooRestProduct);
      const filtered = filterProductsForSection(normalized, "default");
      const specialOrderIds = await getSpecialOrderProductIds();
      const visible = filtered.filter(
        (p) => p.stock_status === "instock" || specialOrderIds.has(p.id) || isPreOrderSectionProduct(p)
      );
      return paginateProducts(visible, page, perPage);
    }
  }

  // Fallback to Store API (used when a tag/promotion filter is active).
  const result = await fetchProducts({
    page,
    perPage,
    orderby,
    order,
    stock_status: stockStatus,
    tag,
    cache: cacheMode,
  });

  const filtered = filterProductsForSection(result.data, "default");
  const enriched = await enrichWithRestData(filtered);
  return { ...result, data: enriched };
}

export function buildCatalogApiQuery({
  categorySlug,
  orderType,
  sort,
  stockStatus,
  tag,
}: Omit<CatalogRequest, "page" | "perPage">): Record<
  string,
  string | number | undefined
> {
  return {
    category_slug: categorySlug,
    product_order_type: orderType,
    sort,
    stock_status: stockStatus,
    tag,
  };
}
