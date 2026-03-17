import "server-only";

import { mockPreOrders } from "@/lib/mockPreOrders";
import { fetchProducts } from "@/lib/woocommerce";
import type { Product } from "@/lib/woocommerce-types";

const PRE_ORDER_SCAN_PAGE_SIZE = 100;
const PRE_ORDER_SCAN_MAX_PAGES = 5;

function isPreOrderProduct(product: Product) {
  return product.product_order_type === "pre_order";
}

async function scanCatalogForPreOrders() {
  try {
    const firstPage = await fetchProducts({
      page: 1,
      perPage: PRE_ORDER_SCAN_PAGE_SIZE,
    });
    const hasBackendData =
      firstPage.totalProducts > 0 || firstPage.data.length > 0;
    const preOrders = firstPage.data.filter(isPreOrderProduct);

    if (preOrders.length > 0) {
      return { hasBackendData, preOrders };
    }

    // Cap the scan so the navigation check stays cheap on layout renders.
    const totalPagesToScan = Math.min(
      firstPage.totalPages,
      PRE_ORDER_SCAN_MAX_PAGES
    );

    for (let page = 2; page <= totalPagesToScan; page += 1) {
      const pageResult = await fetchProducts({
        page,
        perPage: PRE_ORDER_SCAN_PAGE_SIZE,
      });
      preOrders.push(...pageResult.data.filter(isPreOrderProduct));

      if (preOrders.length > 0) {
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

export async function hasPreOrderProducts() {
  const { preOrders } = await scanCatalogForPreOrders();

  // Keep the nav item visible in demo environments whenever mock pre-orders exist.
  return preOrders.length > 0 || mockPreOrders.length > 0;
}
