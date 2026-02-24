import { Suspense } from "react";
import PromoModal from "./promo-modal";
import Hero from "@/components/store/Hero";
import CategoryGrid from "@/components/store/CategoryGrid";
import FeaturedProducts from "@/components/store/FeaturedProducts";
import FilterBar from "@/components/store/FilterBar";
import { fetchProductsByCategory } from "@/lib/api";
import type { StoreProduct } from "@/components/store/ProductCard";

type RawParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<RawParams>;
};

/** Map sort shorthand (from URL) → WC orderby + order */
function resolveSort(sort?: string): { orderby: string; order: "asc" | "desc" } {
  switch (sort) {
    case "price_asc": return { orderby: "price", order: "asc" };
    case "price_desc": return { orderby: "price", order: "desc" };
    case "date_desc": return { orderby: "date", order: "desc" };
    default: return { orderby: "popularity", order: "desc" };
  }
}

function getString(params: RawParams, key: string): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export default async function StorePage({ searchParams }: PageProps) {
  const params: RawParams = await (searchParams ?? Promise.resolve({}));

  const sort = getString(params, "sort");
  const stock = getString(params, "stock");
  const series = getString(params, "series");

  const { orderby, order } = resolveSort(sort);

  const { data: raw, totalProducts } = await fetchProductsByCategory(
    "3d-printers",
    1,
    {
      orderby,
      order,
      stock_status: stock || undefined,
      seriesSlug: series || undefined,
    }
  );

  // Cast to the client card type — WCProduct is a superset
  const featured = raw.slice(0, 8) as unknown as StoreProduct[];

  return (
    <div className="bg-white">
      <PromoModal />
      <Hero />
      <CategoryGrid />

      {/* FilterBar needs Suspense because it uses useSearchParams (client) */}
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <FilterBar totalCount={totalProducts} />
        </Suspense>
      </div>

      <FeaturedProducts
        products={featured}
        totalCount={totalProducts}
        title={series ? slugToTitle(series) : "Featured printers"}
      />
    </div>
  );
}
