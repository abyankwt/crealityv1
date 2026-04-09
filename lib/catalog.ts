import "server-only";

import {
  getWooPublishedProductsByCategorySlug,
} from "@/lib/woo-client";
import { fetchProducts, fetchProductsByCategory } from "@/lib/woocommerce";
import {
  getDefaultMockProducts,
  getMockProductsByCategorySlug,
} from "@/lib/mockCategoryProducts";
import { fetchPreOrderProducts } from "@/lib/preOrders";
import {
  filterProductsByCategorySlugs,
  filterProductsForSection,
  isPreOrderSectionProduct,
  productMatchesAnyToken,
  resolveProductSectionFromSlug,
} from "@/lib/productLogic";
import {
  getPrinterSubmenuProductCategorySlugs,
  getPrinterSubmenuProductMatchTokens,
} from "@/lib/categories";
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
  cache?: RequestCache;
  filterBySection: boolean;
  productSectionOverride?: ProductSection;
  dataSource?: "store" | "woo-rest";
};

const GROUPED_CATEGORY_CONFIGS: GroupedCategoryConfig[] = [
  {
    routeSlugs: ["3d-scanner-series", "3d-scanners-series"],
    productCategorySlugs: ["3d-scanners-series"],
    cache: "no-store",
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

export function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sortMockProducts(products: Product[], sort?: string): Product[] {
  const sorted = [...products];

  if (sort === "price_asc") {
    sorted.sort((left, right) => left.price - right.price);
  }

  if (sort === "price_desc") {
    sorted.sort((left, right) => right.price - left.price);
  }

  return sorted;
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

function getMockCategoryFallback(
  categorySlug: string,
  page: number,
  perPage: number,
  sort?: string
): FetchProductsResult {
  const categoryProducts = getMockProductsByCategorySlug(categorySlug);
  const fallbackProducts =
    categoryProducts.length > 0 ? categoryProducts : getDefaultMockProducts();
  const section = resolveProductSectionFromSlug(categorySlug);

  return paginateProducts(
    sortMockProducts(filterProductsForSection(fallbackProducts, section), sort),
    page,
    perPage
  );
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
    const categoryResults = await Promise.all(
      config.productCategorySlugs.map((productCategorySlug) =>
        getWooPublishedProductsByCategorySlug(productCategorySlug, {
          orderby,
          order,
        })
      )
    );

    const failedResult = categoryResults.find((result) => !result.ok);
    if (failedResult && !failedResult.ok) {
      return {
        data: [],
        totalPages: 0,
        totalProducts: 0,
      };
    }

    const normalizedProducts = categoryResults.flatMap((result) =>
      result.ok
        ? result.data
            .filter((product) => product.status === "publish")
            .map(normalizeWooRestProduct)
        : []
    );
    const filteredProducts = filterProductsByCategorySlugs(
      normalizedProducts,
      config.productCategorySlugs
    );

    return paginateProducts(filteredProducts, page, perPage);
  }

  const allProducts = await fetchAllProductsForFiltering({
    perPage: 100,
    orderby,
    order,
    stockStatus,
    cache: config.cache,
  });

  const filteredProducts = filterProductsByCategorySlugs(
    allProducts,
    config.productCategorySlugs
  );

  return paginateProducts(filteredProducts, page, perPage);
}

export async function fetchPrinterSubmenuProducts({
  submenuSlug,
  page = 1,
  perPage = 12,
  sort,
  stockStatus,
  cache = "no-store",
}: FetchPrinterSubmenuProductsRequest): Promise<FetchProductsResult> {
  const matchedSlugs = getPrinterSubmenuProductCategorySlugs(submenuSlug);
  const matchedTokens = getPrinterSubmenuProductMatchTokens(submenuSlug);

  if (matchedSlugs.length === 0 && matchedTokens.length === 0) {
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

  const filteredProducts = allProducts.filter((product) => {
    if (filterProductsByCategorySlugs([product], matchedSlugs).length > 0) {
      return true;
    }

    return (
      isPreOrderSectionProduct(product) &&
      productMatchesAnyToken(product, matchedTokens)
    );
  });

  return paginateProducts(filteredProducts, page, perPage);
}

export async function fetchCatalogProducts({
  page = 1,
  perPage = 12,
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

    const result = await fetchProductsByCategory(categorySlug, page, {
      orderby,
      order,
      stock_status: stockStatus,
      cache: cacheMode,
    });

    if (result.data.length > 0) {
      return {
        ...result,
        data: filterProductsForSection(result.data, categorySection),
      };
    }

    return getMockCategoryFallback(categorySlug, page, perPage, sort);
  }

  const result = await fetchProducts({
    page,
    perPage,
    orderby,
    order,
    stock_status: stockStatus,
    tag,
    cache: cacheMode,
  });

  return {
    ...result,
    data: filterProductsForSection(result.data, "default"),
  };
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
