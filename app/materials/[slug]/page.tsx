import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import {
  getCatalogParam,
  resolveCatalogSort,
  type RawCatalogSearchParams,
} from "@/lib/catalog";
import {
  findMaterialEntryBySlug,
  getMaterialsNavigation,
} from "@/lib/materials";
import { fetchProductsByCategory } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

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
  const materialsGroups = await getMaterialsNavigation({ cacheMode: "no-store" });
  const material = findMaterialEntryBySlug(materialsGroups, slug);

  if (!material) {
    notFound();
  }

  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");
  const { orderby, order } = resolveCatalogSort(sort);
  const { data: products, totalPages } = await fetchProductsByCategory(slug, 1, {
    orderby,
    order,
    stock_status: stock,
    cacheMode: "no-store",
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="rounded-[2rem] bg-[#f6f8f3] px-6 py-8 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6b52]">
          {material.group.label}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
          {material.category.label}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
          Live WooCommerce products filtered by the <strong>{material.category.label}</strong>{" "}
          category slug. In-stock items show Add to Cart, while out-of-stock items
          stay purchasable through Special Order.
        </p>
      </div>

      <div className="mt-6">
        <Link
          href="/materials"
          prefetch
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-black"
        >
          All Materials
        </Link>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {materialsGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-[1.5rem] border border-gray-200 bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {group.links.map((link) => {
                  const isActive = link.slug === slug;

                  return (
                    <Link
                      key={link.slug}
                      href={link.href}
                      prefetch
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-black text-white"
                          : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-black"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <ProductGrid
          initialProducts={products}
          initialPage={1}
          totalPages={totalPages}
          apiQuery={{
            category_slug: slug,
            sort,
            stock_status: stock,
            cache_mode: "no-store",
            strict_category: "1",
          }}
          emptyMessage={`No products found in ${material.category.label}.`}
        />
      </div>
    </section>
  );
}
