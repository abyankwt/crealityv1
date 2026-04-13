import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
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

export default async function MaterialCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const materialsGroups = await getMaterialsNavigation();
  const material = findMaterialEntryBySlug(materialsGroups, slug);

  if (!material) {
    notFound();
  }

  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");

  const childSlugs = material.category.children?.map((c) => c.slug) ?? [];
  const isParentCategory = childSlugs.length > 0;

  let products: Product[] = [];
  let totalPages = 1;

  if (isParentCategory) {
    // Parent category (e.g. "Special Filaments"): fetch from each child slug
    // separately and combine, so only products in those specific subcategories show.
    const results = await Promise.all(
      childSlugs.map((childSlug) =>
        fetchCatalogProducts({ categorySlug: childSlug, sort, stockStatus: stock })
      )
    );

    const seenIds = new Set<number>();
    for (const result of results) {
      for (const product of result.data) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          products.push(product);
        }
      }
    }
    // All loaded at once — no pagination needed for combined parent view
    totalPages = 1;
  } else {
    // Leaf category (e.g. "Carbon Filaments"): fetch normally via REST path
    // which includes special order products automatically.
    const result = await fetchCatalogProducts({
      categorySlug: slug,
      sort,
      stockStatus: stock,
    });
    products = result.data;
    totalPages = result.totalPages;
  }

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
        <ProductGrid
          initialProducts={products}
          initialPage={1}
          totalPages={totalPages}
          apiQuery={
            isParentCategory
              ? undefined
              : {
                  category_slug: slug,
                  sort,
                  stock_status: stock,
                  strict_category: "1",
                }
          }
          emptyMessage={`No products found in ${material.category.label}.`}
        />
      </div>
    </section>
  );
}
