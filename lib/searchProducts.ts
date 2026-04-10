import type { Product } from "@/lib/woocommerce-types";

export async function searchProducts(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  // Route through the server-side /api/search endpoint so all search logic
  // (normalization, filtering) is handled server-side consistently.
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(trimmed)}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  return (await response.json()) as Product[];
}
