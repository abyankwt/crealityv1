import { Suspense } from "react";
import Link from "next/link";
import CategoryNavigation from "@/components/CategoryNavigation";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import FilterBar from "@/components/store/FilterBar";
import { fetchProducts } from "@/lib/api";
import { filterProductsForSection } from "@/lib/productLogic";
import { getProductsRestData } from "@/lib/woo-client";
import { fetchHomepageHeroSlides } from "@/lib/creality-cms";
import CampaignHero from "@/components/CampaignHero";

export const revalidate = 60;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getString(p: RawSearchParams, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

function resolveSort(sort?: string): { orderby: string; order: "asc" | "desc" } {
  switch (sort) {
    case "price_asc": return { orderby: "price", order: "asc" };
    case "price_desc": return { orderby: "price", order: "desc" };
    case "date_desc": return { orderby: "date", order: "desc" };
    default: return { orderby: "popularity", order: "desc" };
  }
}

type PageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params: RawSearchParams = await (searchParams ?? Promise.resolve({}));
  const sort = getString(params, "sort");
  const stock = getString(params, "stock");
  const { orderby, order } = resolveSort(sort);
  const shouldReusePrimaryProductsForNewArrivals =
    !stock && orderby === "date" && order === "desc";

  const [productResult, newProductsResult, heroSlides] = await Promise.all([
    fetchProducts({
      orderby,
      order,
      stock_status: stock || undefined,
    }),
    shouldReusePrimaryProductsForNewArrivals
      ? Promise.resolve(null)
      : fetchProducts({
          orderby: "date",
          order: "desc",
          perPage: 8,
        }),
    fetchHomepageHeroSlides(),
  ]);

  const { data: rawProducts, totalPages, totalProducts } = productResult;
  const rawNewProducts = shouldReusePrimaryProductsForNewArrivals
    ? rawProducts.slice(0, 8)
    : newProductsResult?.data ?? [];

  // Enrich all unique products with stock_quantity + sku from REST API (one batch call)
  const allIds = [...new Set([...rawProducts, ...rawNewProducts].map((p) => p.id))];
  const restDataResult = await getProductsRestData(allIds);
  const restById = new Map(
    restDataResult.ok ? restDataResult.data.map((d) => [d.id, d]) : []
  );
  const enrich = <T extends { id: number; sku?: string | null; stock_quantity?: number | null }>(
    list: T[]
  ): T[] =>
    list.map((p) => {
      const extra = restById.get(p.id);
      if (!extra) return p;
      return { ...p, sku: p.sku ?? extra.sku ?? null, stock_quantity: p.stock_quantity ?? extra.stock_quantity ?? null };
    });

  const products = enrich(rawProducts);
  const newProducts = enrich(rawNewProducts);
  const visibleProducts = filterProductsForSection(products, "default");
  const visibleNewProducts = filterProductsForSection(newProducts, "default");

  const featuredProducts = visibleProducts.filter(
    (p) => p.featured
  );

  const displayProducts = featuredProducts.length ? featuredProducts : visibleProducts;

  return (
    <main className="bg-[#f8f8f8] text-gray-900 pb-10">
      <CampaignHero initialSlides={heroSlides} />

      <section className="bg-[#f8f8f8] py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-[#d9e8d2] bg-gradient-to-r from-[#f4faef] via-white to-[#eef6e6] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6BBE45]">
                  Early Access
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Reserve upcoming Creality releases
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
                  Explore the dedicated pre-orders page for launch items and
                  early reservation availability without interrupting the main
                  shopping flow.
                </p>
              </div>

              <Link
                href="/pre-orders"
                prefetch
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-gray-800"
              >
                View Pre-Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CategoryNavigation />

      <section className="bg-[#eef0f2] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                New & Upcoming Products
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Discover the latest releases and upcoming innovations.
              </p>
            </div>
            <Link
              href="/store?sort=date_desc"
              prefetch
              className="hidden text-sm font-semibold uppercase tracking-wider text-[#6BBE45] hover:underline sm:block"
            >
              View all new
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleNewProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 flex justify-center sm:hidden">
            <Link
              href="/store?sort=date_desc"
              prefetch
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
            >
              View all new
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f8f8] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ready-to-ship systems and essentials for professionals.
            </p>
          </div>

          <Suspense fallback={null}>
            <FilterBar totalCount={totalProducts} />
          </Suspense>

          <ProductGrid
            initialProducts={displayProducts}
            initialPage={1}
            totalPages={totalPages}
            section="default"
          />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f8f8f8] pt-2 pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-lg mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900">Be the First to Know</h2>
            <p className="mt-1 text-sm text-gray-500">
              Hardware updates and community drops.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <button
                type="button"
                className="w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold tracking-wide text-white transition duration-150 hover:bg-gray-800 uppercase"
                aria-label="Subscribe to newsletter"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
