import "server-only";

import { cache } from "react";
import { getProductAvailability } from "@/lib/productAvailability";
import {
  filterProductsForSection,
  isUsedPrinterProduct,
  isVisibleUsedPrinterProduct,
  resolveProductSection,
} from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";
import { fetchProducts, fetchProductBySlug } from "@/lib/woocommerce";
import { fetchUsedPrinterProductBySlug, fetchUsedPrinterProducts } from "@/lib/usedPrinters";

async function fetchStoreProduct(slug: string, cacheMode?: RequestCache) {
  const product = await fetchProductBySlug(slug, {
    cache: cacheMode,
  });
  if (product) {
    if (isUsedPrinterProduct(product) && !isVisibleUsedPrinterProduct(product)) {
      return null;
    }

    return product;
  }

  return fetchUsedPrinterProductBySlug(slug);
}

export const fetchStoreProductBySlug = cache(async (slug: string) =>
  fetchStoreProduct(slug)
);

export async function fetchStoreProductBySlugNoStore(slug: string) {
  return fetchStoreProduct(slug, "no-store");
}

export async function fetchRelatedStoreProducts(
  product: Product,
  limit = 4
) {
  const section = resolveProductSection(product);
  const categoryId = product.categories?.[0]?.id;

  if (section !== "used_printers" && !categoryId) {
    return [];
  }

  try {
    const result =
      section === "used_printers"
        ? await fetchUsedPrinterProducts({ page: 1, perPage: 8 })
        : await fetchProducts({
            page: 1,
            perPage: 8,
            category: categoryId,
          });

    const relatedSection = section === "used_printers" ? "used_printers" : section;

    return filterProductsForSection(result.data, relatedSection)
      .filter(
        (item) =>
          item.id !== product.id &&
          getProductAvailability(item, relatedSection).type !== "unavailable" &&
          item.purchasable
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}
