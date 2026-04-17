import { Suspense } from "react";
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
  const { data: products, totalPages } = await fetchCatalogProducts({
    sort: sort || undefined,
    stockStatus: stock || undefined,
    tag: promotion || undefined,
  });
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
