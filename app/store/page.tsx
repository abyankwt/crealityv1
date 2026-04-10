import CatalogPage from "@/components/CatalogPage";
import {
  buildCatalogApiQuery,
  fetchCatalogProducts,
  getCatalogParam,
  slugToTitle,
  type RawCatalogSearchParams,
} from "@/lib/catalog";

export const revalidate = 300;

type PageProps = {
  searchParams?: Promise<RawCatalogSearchParams>;
};

export default async function StorePage({ searchParams }: PageProps) {
  const params = await (searchParams ?? Promise.resolve({}));
  const sort = getCatalogParam(params, "sort");
  const stock =
    getCatalogParam(params, "stock") ??
    getCatalogParam(params, "stock_status");
  const promotion = getCatalogParam(params, "promotion");
  const { data: products, totalPages } = await fetchCatalogProducts({
    sort,
    stockStatus: stock,
    tag: promotion,
  });
  const title = promotion ? slugToTitle(promotion) : "Shop All Products";

  return (
    <CatalogPage
      title={title}
      products={products}
      totalPages={totalPages}
      apiQuery={buildCatalogApiQuery({
        sort,
        stockStatus: stock,
        tag: promotion,
      })}
      emptyMessage={
        promotion
          ? `No products found for ${slugToTitle(promotion)}.`
          : "No products found."
      }
    />
  );
}
