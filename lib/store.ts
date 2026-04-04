import "server-only";

import { isUsedPrinterProduct, isVisibleUsedPrinterProduct } from "@/lib/productLogic";
import { fetchProductBySlug } from "@/lib/woocommerce";
import { fetchUsedPrinterProductBySlug } from "@/lib/usedPrinters";

export async function fetchStoreProductBySlug(slug: string) {
  const product = await fetchProductBySlug(slug);
  if (product) {
    if (isUsedPrinterProduct(product) && !isVisibleUsedPrinterProduct(product)) {
      return null;
    }

    return product;
  }

  return fetchUsedPrinterProductBySlug(slug);
}
