import "server-only";

import { fetchProducts } from "@/lib/woocommerce";
import { filterProductsForSection } from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

const PRE_ORDER_SCAN_PAGE_SIZE = 12;
const PRE_ORDER_NAV_SCAN_MAX_PAGES = 5;

async function scanCatalogForPreOrders(maxPages?: number) {
  try {
    // Fetch onbackorder products directly — the Store API returns only instock
    // products by default, so onbackorder products must be fetched explicitly.
    const [firstPage, backorderPage] = await Promise.all([
      fetchProducts({
        page: 1,
        perPage: PRE_ORDER_SCAN_PAGE_SIZE,
      }),
      fetchProducts({
        page: 1,
        perPage: 100,
        stock_status: "onbackorder",
      }),
    ]);

    const hasBackendData =
      firstPage.totalProducts > 0 || firstPage.data.length > 0;

    const seen = new Set<number>();
    const preOrders: Product[] = [];

    const addIfNew = (products: Product[]) => {
      for (const p of filterProductsForSection(products, "preorders")) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          preOrders.push(p);
        }
      }
    };

    addIfNew(firstPage.data);
    addIfNew(backorderPage.data);

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
      addIfNew(pageResult.data);

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
