import "server-only";

import { fetchProducts, fetchProductsByCategory } from "@/lib/woocommerce";
import {
  getDefaultMockProducts,
  getMockProductsByCategorySlug,
} from "@/lib/mockCategoryProducts";
import { fetchPreOrderProducts } from "@/lib/preOrders";
import {
  filterProductsForSection,
  resolveProductSectionFromSlug,
} from "@/lib/productLogic";
import { fetchUsedPrinterProducts } from "@/lib/usedPrinters";
import type { FetchProductsResult } from "@/lib/woocommerce";
import type { Product } from "@/lib/woocommerce-types";
import type { ProductOrderType } from "@/lib/woocommerce-types";

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
};

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

export async function fetchCatalogProducts({
  page = 1,
  perPage = 12,
  categorySlug,
  orderType,
  sort,
  stockStatus,
  tag,
}: CatalogRequest): Promise<FetchProductsResult> {
  if (orderType === "pre_order") {
    return fetchPreOrderProducts({ page, perPage });
  }

  const { orderby, order } = resolveCatalogSort(sort);
  const categorySection = resolveProductSectionFromSlug(categorySlug);

  if (categorySlug) {
    if (categorySection === "used_printers") {
      return fetchUsedPrinterProducts({ page, perPage });
    }

    const result = await fetchProductsByCategory(categorySlug, page, {
      orderby,
      order,
      stock_status: stockStatus,
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
