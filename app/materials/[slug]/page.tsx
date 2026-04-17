import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import MaterialsNav from "@/components/MaterialsNav";
import {
  fetchCatalogProducts,
  getCatalogParam,
  type RawCatalogSearchParams,
} from "@/lib/catalog";
import {
  findMaterialEntryBySlug,
  getMaterialsNavigation,
} from "@/lib/materials";
import type { Product } from "@/lib/woocommerce-types";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = findMaterialEntryBySlug(await getMaterialsNavigation(), slug);

  return {
    title: material?.category.label ?? "Materials",
  };
}

const getCachedLeafProducts = unstable_cache(
  (slug: string, sort: string, stock: string) =>
    fetchCatalogProducts({
      categorySlug: slug,
      sort: sort || undefined,
      stockStatus: stock || undefined,
    }),
  ["materials-leaf-products"],
  { revalidate: 3600 }
);

const getCachedParentProducts = unstable_cache(
  async (childSlugs: string[], sort: string, stock: string) => {
    const results = await Promise.all(
      childSlugs.map((childSlug) =>
        fetchCatalogProducts({
          categorySlug: childSlug,
          sort: sort || undefined,
          stockStatus: stock || undefined,
        })
      )
    );
    const seenIds = new Set<number>();
    const products: Product[] = [];
    for (const result of results) {
      for (const product of result.data) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          products.push(product);
        }
      }
    }
    return { products, totalPages: 1 };
  },
  ["materials-parent-products"],
  { revalidate: 3600 }
);

async function MaterialProducts({
  slug,
  sort,
  stock,
  childSlugs,
  isParentCategory,
  materialLabel,
}: {
  slug: string;
  sort?: string;
  stock?: string;
  childSlugs: string[];
  isParentCategory: boolean;
  materialLabel: string;
}) {
  let products: Product[];
  let totalPages: number;

  if (isParentCategory) {
    const result = await getCachedParentProducts(childSlugs, sort ?? "", stock ?? "");
    products = result.products;
    totalPages = result.totalPages;
  } else {
    const result = await getCachedLeafProducts(slug, sort ?? "", stock ?? "");
    products = result.data;
    totalPages = result.totalPages;
  }

  return (
    <ProductGrid
      initialProducts={products}
      initialPage={1}
      totalPages={totalPages}
      apiQuery={
        isParentCategory
          ? undefined
          : { category_slug: slug, sort, stock_status: stock, strict_category: "1" }
      }
      emptyMessage={`No products found in ${materialLabel}.`}
    />
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function MaterialCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}) {
  const [{ slug }, resolvedSearchParams, materialsGroups] = await Promise.all([
    params,
    searchParams,
    getMaterialsNavigation(),
  ]);

  const material = findMaterialEntryBySlug(materialsGroups, slug);
  if (!material) notFound();

  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");

  const childSlugs = material.category.children?.map((c) => c.slug) ?? [];
  const isParentCategory = childSlugs.length > 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="rounded-[2rem] bg-[#f6f8f3] px-6 py-8 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6b52]">
          {material.group.label}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
          {material.category.label}
        </h1>
      </div>

      <MaterialsNav
        groups={materialsGroups}
        activeSlug={slug}
        allHref="/materials"
        activeGroupId={material.group.id}
        activeLabel={material.category.label}
      />

      <div className="mt-8">
        <Suspense fallback={<ProductsSkeleton />}>
          <MaterialProducts
            slug={slug}
            sort={sort}
            stock={stock}
            childSlugs={childSlugs}
            isParentCategory={isParentCategory}
            materialLabel={material.category.label}
          />
        </Suspense>
      </div>
    </section>
  );
}
