import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import SparePartsNav from "@/components/SparePartsNav";
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

export const revalidate = 300;

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

const getCachedSparePartProducts = unstable_cache(
  (wooSlug: string, orderby: string, order: string, stock: string) =>
    fetchProductsByCategory(wooSlug, 1, {
      orderby,
      order: order as "asc" | "desc",
      stock_status: stock || undefined,
    }),
  ["spare-parts-products"],
  { revalidate: 3600 }
);

async function SparePartProducts({
  wooSlug,
  orderby,
  order,
  stock,
  sort,
  label,
}: {
  wooSlug: string;
  orderby: string;
  order: string;
  stock?: string;
  sort?: string;
  label: string;
}) {
  const { data: products, totalPages } = await getCachedSparePartProducts(
    wooSlug,
    orderby,
    order,
    stock ?? ""
  );

  return (
    <ProductGrid
      initialProducts={products}
      initialPage={1}
      totalPages={totalPages}
      apiQuery={{
        category_slug: wooSlug,
        sort,
        stock_status: stock,
        strict_category: "1",
      }}
      emptyMessage={`No products found in ${label}.`}
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
      <SparePartsNav
        groups={SPARE_PARTS_GROUPS}
        activeSlug={sparePart.slug}
        allHref={SPARE_PARTS_CATEGORY_HREF}
        activeItem={sparePart}
      />

      {/* Products */}
      <div className="mt-8">
        <Suspense fallback={<ProductsSkeleton />}>
          <SparePartProducts
            wooSlug={sparePart.wooSlug}
            orderby={orderby}
            order={order}
            stock={stock}
            sort={sort}
            label={sparePart.label}
          />
        </Suspense>
      </div>
    </section>
  );
}
