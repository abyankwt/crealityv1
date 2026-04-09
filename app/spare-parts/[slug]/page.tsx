import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import {
  getSparePartBySlug,
  SPARE_PARTS_CATEGORY_HREF,
  SPARE_PARTS_GROUPS,
} from "@/config/spare-parts";
import {
  getCatalogParam,
  resolveCatalogSort,
  type RawCatalogSearchParams,
} from "@/lib/catalog";
import { fetchProductsByCategory } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

type SparePartPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
};

export async function generateMetadata(
  { params }: SparePartPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const sparePart = getSparePartBySlug(slug);

  if (!sparePart) {
    return { title: "Spare Parts | Creality Kuwait" };
  }

  return {
    title: `${sparePart.label} | Spare Parts | Creality Kuwait`,
  };
}

export default async function SparePartPage({
  params,
  searchParams,
}: SparePartPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const sparePart = getSparePartBySlug(slug);

  if (!sparePart) {
    notFound();
  }

  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");
  const { orderby, order } = resolveCatalogSort(sort);

  const { data: products, totalPages } = await fetchProductsByCategory(
    sparePart.wooSlug,
    1,
    { orderby, order, stock_status: stock, cache: "no-store" }
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="rounded-4xl bg-[#f6f8f3] px-6 py-8 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6b52]">
          Spare Parts / {sparePart.groupLabel}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
          {sparePart.label}
        </h1>
      </div>

      {/* Category navigation */}
      <div className="mt-6">
        <Link
          href={SPARE_PARTS_CATEGORY_HREF}
          prefetch
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-black"
        >
          All Spare Parts
        </Link>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {SPARE_PARTS_GROUPS.map((group) => (
            <div
              key={group.id}
              className="rounded-3xl border border-gray-200 bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {group.items.map((item) => {
                  const isActive = item.slug === sparePart.slug;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-black text-white"
                          : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-black"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="mt-8">
        <ProductGrid
          initialProducts={products}
          initialPage={1}
          totalPages={totalPages}
          apiQuery={{
            category_slug: sparePart.wooSlug,
            sort,
            stock_status: stock,
            cache: "no-store",
            strict_category: "1",
          }}
          emptyMessage={`No products found in ${sparePart.label}.`}
        />
      </div>
    </section>
  );
}
