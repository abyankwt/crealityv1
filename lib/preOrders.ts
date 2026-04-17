import "server-only";

import { fetchProducts } from "@/lib/woocommerce";
import { getProductsRestData } from "@/lib/woo-client";
import { filterProductsForSection } from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

async function enrichPreOrdersWithRestData(products: Product[]): Promise<Product[]> {
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
        stock_quantity: typeof extra.stock_quantity === "number" ? extra.stock_quantity : p.stock_quantity,
        sku: extra.sku ?? p.sku,
      };
    });
  } catch {
    return products;
  }
}

const PRE_ORDER_SCAN_PAGE_SIZE = 12;
const PRE_ORDER_NAV_SCAN_MAX_PAGES = 5;

// Long revalidate for the nav check — pre-orders don't change every minute.
const PRE_ORDER_REVALIDATE = 3600;

async function scanCatalogForPreOrders(maxPages?: number) {
  try {
    // Fetch onbackorder products directly — the Store API returns only instock
    // products by default, so onbackorder products must be fetched explicitly.
    const [firstPage, backorderPage] = await Promise.all([
      fetchProducts({
        page: 1,
        perPage: PRE_ORDER_SCAN_PAGE_SIZE,
        revalidate: PRE_ORDER_REVALIDATE,
      }),
      fetchProducts({
        page: 1,
        perPage: 100,
        stock_status: "onbackorder",
        revalidate: PRE_ORDER_REVALIDATE,
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
        revalidate: PRE_ORDER_REVALIDATE,
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
  const pageSlice = preOrders.slice(startIndex, startIndex + perPage);
  const enriched = await enrichPreOrdersWithRestData(pageSlice);

  return {
    data: enriched,
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
