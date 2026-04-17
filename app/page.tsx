import { Suspense } from "react";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import CategoryNavigation from "@/components/CategoryNavigation";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductGrid from "@/components/ProductGrid";
import FilterBar from "@/components/store/FilterBar";
import { fetchProducts } from "@/lib/api";
import { fetchCatalogProducts } from "@/lib/catalog";
import { filterProductsForSection } from "@/lib/productLogic";
import { fetchHomepageHeroSlides } from "@/lib/creality-cms";
import { getProductsRestData } from "@/lib/woo-client";
import CampaignHero from "@/components/CampaignHero";
import type { Product } from "@/lib/woocommerce-types";

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function enrichWithStockQuantity(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  try {
    const ids = products.map((p) => p.id);
    const restResult = await getProductsRestData(ids);
    if (!restResult.ok) return products;
    const byId = new Map(restResult.data.map((d) => [d.id, d]));
    return products.map((p) => {
      const extra = byId.get(p.id);
      if (!extra) return p;
      return {
        ...p,
        sku: p.sku ?? extra.sku ?? null,
        stock_quantity: p.stock_quantity ?? extra.stock_quantity ?? null,
      };
    });
  } catch {
    return products;
  }
}

// Cache the full hero + product fetches for 1 hour across Lambda invocations
const getCachedHeroSlides = unstable_cache(
  () => fetchHomepageHeroSlides(),
  ["homepage-hero"],
  { revalidate: 3600 }
);

const getCachedNewArrivals = unstable_cache(
  async (stock: string) => {
    try {
      const result = await fetchProducts({
        orderby: "date",
        order: "desc",
        perPage: 8,
        stock_status: stock || undefined,
      });
      const filtered = filterProductsForSection(result.data, "default").slice(0, 4);
      return await enrichWithStockQuantity(filtered);
    } catch {
      return [] as Product[];
    }
  },
  ["homepage-new-arrivals"],
  { revalidate: 3600 }
);

const getCachedFeaturedProducts = unstable_cache(
  async (sort: string, stock: string, series: string) => {
    const orderMap: Record<string, { orderby: string; order: "asc" | "desc" }> = {
      price_asc: { orderby: "price", order: "asc" },
      price_desc: { orderby: "price", order: "desc" },
      date_desc: { orderby: "date", order: "desc" },
    };
    const { orderby, order } = orderMap[sort] ?? { orderby: "popularity", order: "desc" as const };

    try {
      const result = series
        ? await fetchCatalogProducts({ categorySlug: series, sort: sort || undefined, stockStatus: stock || undefined })
        : await fetchProducts({ orderby, order, stock_status: stock || undefined });

      const products = filterProductsForSection(result.data, "default");
      const featured = products.filter((p) => p.featured);
      const display = series ? products : (featured.length ? featured : products);
      const enriched = await enrichWithStockQuantity(display);

      return {
        products: enriched,
        totalPages: result.totalPages,
        totalProducts: result.totalProducts,
      };
    } catch {
      return { products: [] as Product[], totalPages: 1, totalProducts: 0 };
    }
  },
  ["homepage-featured"],
  { revalidate: 3600 }
);

export const revalidate = 3600;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getString(p: RawSearchParams, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

// ─── Streaming: Hero ──────────────────────────────────────────────────────────

async function HeroSection() {
  const slides = await getCachedHeroSlides();
  return <CampaignHero initialSlides={slides} />;
}

function HeroSkeleton() {
  return (
    <div
      className="w-full animate-pulse bg-gray-200"
      style={{ aspectRatio: "16/5", minHeight: 220 }}
    />
  );
}

// ─── Streaming: New Arrivals ──────────────────────────────────────────────────

async function NewArrivalsProducts({ stock }: { stock?: string }) {
  const products = await getCachedNewArrivals(stock ?? "");
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} imagePriority={index < 2} />
      ))}
    </div>
  );
}

function NewArrivalsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

// ─── Streaming: Featured Products ────────────────────────────────────────────

type FeaturedProps = {
  sort?: string;
  stock?: string;
  series?: string;
};

async function FeaturedProducts({ sort, stock, series }: FeaturedProps) {
  const { products, totalPages, totalProducts } = await getCachedFeaturedProducts(
    sort ?? "",
    stock ?? "",
    series ?? ""
  );

  const apiQuery: Record<string, string | number | undefined> = {};
  if (sort) apiQuery.sort = sort;
  if (stock) apiQuery.stock_status = stock;
  if (series) apiQuery.category_slug = series;

  return (
    <>
      <Suspense fallback={null}>
        <FilterBar totalCount={totalProducts} />
      </Suspense>
      <ProductGrid
        initialProducts={products}
        initialPage={1}
        totalPages={totalPages}
        section="default"
        showSort={false}
        apiQuery={apiQuery}
      />
    </>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params: RawSearchParams = await (searchParams ?? Promise.resolve({}));
  const sort = getString(params, "sort");
  const stock = getString(params, "stock");
  const series = getString(params, "series");

  return (
    <main className="bg-[#f8f8f8] text-gray-900 pb-10">
      {/* Hero — streams in from server cache; skeleton shows immediately */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Pre-order banner — static, renders instantly */}
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

      {/* Category navigation — static, renders instantly */}
      <CategoryNavigation />

      {/* New Arrivals — streams in; skeleton shows immediately */}
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

          <Suspense fallback={<NewArrivalsSkeleton />}>
            <NewArrivalsProducts stock={stock} />
          </Suspense>

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

      {/* Featured Products — streams in; skeleton shows immediately */}
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

          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedProducts sort={sort} stock={stock} series={series} />
          </Suspense>
        </div>
      </section>

      {/* Newsletter — static */}
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
