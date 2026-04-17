import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import CatalogPage from "@/components/CatalogPage";
import CatalogPageSkeleton from "@/components/CatalogPageSkeleton";
import {
  buildCatalogApiQuery,
  fetchCatalogProducts,
  getCatalogParam,
  slugToTitle,
  type RawCatalogSearchParams,
} from "@/lib/catalog";

export const revalidate = 3600;

// Cache the computed all-products result in memory so repeated visits skip
// the heavy disk reads + filtering on every request. 30-min TTL; the store
// page always has products so empty-result caching is not a risk here.
const getCachedStoreProducts = unstable_cache(
  (sort: string, stock: string, promotion: string) =>
    fetchCatalogProducts({
      sort: sort || undefined,
      stockStatus: stock || undefined,
      tag: promotion || undefined,
    }),
  ["store-products"],
  { revalidate: 1800 }
);

type PageProps = {
  searchParams?: Promise<RawCatalogSearchParams>;
};

async function StoreProducts({
  sort,
  stock,
  promotion,
}: {
  sort?: string;
  stock?: string;
  promotion?: string;
}) {
  const { data: products, totalPages } = await getCachedStoreProducts(
    sort ?? "",
    stock ?? "",
    promotion ?? ""
  );
  const title = promotion ? slugToTitle(promotion) : "Shop All Products";

  return (
    <CatalogPage
      title={title}
      products={products}
      totalPages={totalPages}
      apiQuery={buildCatalogApiQuery({ sort, stockStatus: stock, tag: promotion })}
      emptyMessage={
        promotion
          ? `No products found for ${slugToTitle(promotion)}.`
          : "No products found."
      }
    />
  );
}

export default async function StorePage({ searchParams }: PageProps) {
  const params = await (searchParams ?? Promise.resolve({}));
  const sort = getCatalogParam(params, "sort");
  const stock =
    getCatalogParam(params, "stock") ??
    getCatalogParam(params, "stock_status");
  const promotion = getCatalogParam(params, "promotion");

  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <StoreProducts sort={sort} stock={stock} promotion={promotion} />
    </Suspense>
  );
}
