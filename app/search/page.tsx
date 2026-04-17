import { Suspense } from "react";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { fetchProducts } from "@/lib/api";
import { isServiceListingProduct } from "@/lib/productLogic";

export const revalidate = 60;

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type FetchProductsParams = Parameters<typeof fetchProducts>[0];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query
      ? `Search results for "${query}" | Creality Kuwait`
      : "Search | Creality Kuwait",
    description: query
      ? `Search results for ${query} at Creality Kuwait.`
      : "Search Creality Kuwait products.",
  };
}

async function SearchResults({ query }: { query: string }) {
  const { data: products } = await fetchProducts(
    { search: query, perPage: 100 } as FetchProductsParams
  );
  const visibleProducts = products.filter((p) => !isServiceListingProduct(p));

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        {visibleProducts.length} result{visibleProducts.length === 1 ? "" : "s"}
      </p>
      {visibleProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center text-sm text-gray-500">
          No products found for &quot;{query}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:py-16">
      <div className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Search</p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
          {query ? <>Search results for &quot;{query}&quot;</> : "Search"}
        </h1>
      </div>

      {!query ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-sm text-gray-500">Enter a product name to start searching.</p>
        </div>
      ) : (
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      )}
    </div>
  );
}
