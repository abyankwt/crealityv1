import CatalogPage from "@/components/CatalogPage";
import {
  fetchCatalogProducts,
  getCatalogParam,
  slugToTitle,
  type RawCatalogSearchParams,
} from "@/lib/catalog";
import { resolveProductSectionFromSlug } from "@/lib/productLogic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: slugToTitle(slug),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");
  const title = slugToTitle(slug);
  const section = resolveProductSectionFromSlug(slug);
  const { data: products, totalPages } = await fetchCatalogProducts({
    categorySlug: slug,
    sort,
    stockStatus: stock,
  });
  const apiQuery =
    section === "used_printers"
      ? {
          category_slug: slug,
          used_printers: "1",
          sort,
          stock_status: stock,
        }
      : {
          category_slug: slug,
          sort,
          stock_status: stock,
        };

  return (
    <CatalogPage
      title={title}
      products={products}
      totalPages={totalPages}
      section={section}
      apiQuery={apiQuery}
      emptyMessage={`No products found in ${title}.`}
    />
  );
}
