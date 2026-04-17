import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import CatalogPage from "@/components/CatalogPage";
import CatalogPageSkeleton from "@/components/CatalogPageSkeleton";
import {
  fetchCatalogProducts,
  getCategoryProductSectionOverride,
  getCatalogParam,
  shouldBypassSectionFilteringForCategory,
  slugToTitle,
  type RawCatalogSearchParams,
} from "@/lib/catalog";
import { resolveProductSectionFromSlug } from "@/lib/productLogic";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: slugToTitle(slug) };
}

const getCachedCategoryProducts = unstable_cache(
  (slug: string, sort: string, stock: string) =>
    fetchCatalogProducts({
      categorySlug: slug,
      sort: sort || undefined,
      stockStatus: stock || undefined,
    }),
  ["category-products"],
  { revalidate: 3600 }
);

async function CategoryProducts({
  slug,
  sort,
  stock,
}: {
  slug: string;
  sort?: string;
  stock?: string;
}) {
  const title = slugToTitle(slug);
  const section = resolveProductSectionFromSlug(slug);
  const filterBySection = !shouldBypassSectionFilteringForCategory(slug);
  const productSectionOverride = getCategoryProductSectionOverride(slug);

  const { data: products, totalPages } = await getCachedCategoryProducts(
    slug,
    sort ?? "",
    stock ?? ""
  );

  const apiQuery =
    section === "used_printers"
      ? { category_slug: slug, used_printers: "1", sort, stock_status: stock }
      : { category_slug: slug, sort, stock_status: stock };

  return (
    <CatalogPage
      title={title}
      products={products}
      totalPages={totalPages}
      section={section}
      productSectionOverride={productSectionOverride}
      apiQuery={apiQuery}
      emptyMessage={`No products found in ${title}.`}
      filterBySection={filterBySection}
    />
  );
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

  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CategoryProducts slug={slug} sort={sort} stock={stock} />
    </Suspense>
  );
}
