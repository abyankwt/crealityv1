import "server-only";

import { fetchProducts } from "@/lib/woocommerce";
import { filterProductsForSection } from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

const PRE_ORDER_SCAN_PAGE_SIZE = 12;
const PRE_ORDER_NAV_SCAN_MAX_PAGES = 5;

async function scanCatalogForPreOrders(maxPages?: number) {
  try {
    const firstPage = await fetchProducts({
      page: 1,
      perPage: PRE_ORDER_SCAN_PAGE_SIZE,
    });
    const hasBackendData =
      firstPage.totalProducts > 0 || firstPage.data.length > 0;
    const preOrders = filterProductsForSection(firstPage.data, "preorders");

    if (maxPages && preOrders.length > 0) {
      return { hasBackendData, preOrders };
    }

    // Cap the scan so the navigation check stays cheap on layout renders.
    const totalPagesToScan = maxPages
      ? Math.min(firstPage.totalPages, maxPages)
      : firstPage.totalPages;

    for (let page = 2; page <= totalPagesToScan; page += 1) {
      const pageResult = await fetchProducts({
        page,
        perPage: PRE_ORDER_SCAN_PAGE_SIZE,
      });
      preOrders.push(...filterProductsForSection(pageResult.data, "preorders"));

      if (maxPages && preOrders.length > 0) {
        break;
      }
    }

    return { hasBackendData, preOrders };
  } catch {
    return {
      hasBackendData: false,
      preOrders: [] as Product[],
    };
  }
}

export async function fetchPreOrderProducts({
  page = 1,
  perPage = 12,
}: {
  page?: number;
  perPage?: number;
}) {
  const { preOrders } = await scanCatalogForPreOrders();
  const totalProducts = preOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const startIndex = Math.max(0, (page - 1) * perPage);

  return {
    data: preOrders.slice(startIndex, startIndex + perPage),
    totalPages,
    totalProducts,
  };
}

export async function hasPreOrderProducts() {
  const { preOrders } = await scanCatalogForPreOrders(
    PRE_ORDER_NAV_SCAN_MAX_PAGES
  );

  return preOrders.length > 0;
}
