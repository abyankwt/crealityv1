import "server-only";

import type { StoreProduct } from "./store-types";

type StoreProductResponse = StoreProduct[] | { products?: StoreProduct[] };

const getBaseUrl = () => {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  return baseUrl.replace(/\/$/, "");
};

export const fetchStoreProductBySlug = async (
  slug: string
): Promise<StoreProduct | null> => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/wp-json/wc/store/products`);
  url.searchParams.set("slug", slug);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as StoreProductResponse;
  const products = Array.isArray(data) ? data : data.products ?? [];

  return products[0] ?? null;
};
