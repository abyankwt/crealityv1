import Link from "next/link";
import CategorySort from "@/components/CategorySort";
import ProductCard from "@/components/ProductCard";
import { fetchProductsByCategory, type WCProduct } from "@/lib/api";

const PAGE_SIZE = 12;

const getCategoryName = (products: WCProduct[], slug: string) => {
  const match = products
    .flatMap((product) => product.categories)
    .find((category) => category.slug === slug);
  return match?.name ?? slug.replace(/-/g, " ");
};

const sortProducts = (products: WCProduct[], sort: string) => {
  const sorted = [...products];
  if (sort === "price-asc") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (sort === "price-desc") {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
  }
  return sorted;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: slug.replace("-", " "),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort, page } = await searchParams;
  const resolvedSort = sort ?? "price-asc";
  const resolvedPage = Math.max(1, Number(page ?? 1));
  const { data: products, totalPages } = await fetchProductsByCategory(slug, resolvedPage);
  const categoryName = getCategoryName(products, slug);

  // Sorting could be done via API if supported, or client side on the current page
  const sortedProducts = sortProducts(products, resolvedSort);

  const handleAddToCart = async () => {
    "use server";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Category
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text sm:text-4xl">
            {categoryName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm text-gray-500">
            Sort by
          </label>
          <form>
            <CategorySort currentSort={resolvedSort} />
          </form>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-white p-12 text-center text-sm text-gray-500">
          No products found in this category.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              imageUrl={product.images?.[0]?.src ?? ""}
              product={{ id: product.id, images: product.images }}
              title={product.name}
              price={Number(product.price)}
              slug={product.slug}
              inStock={product.in_stock}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between text-sm text-gray-500">
          <Link
            href={{
              pathname: `/category/${slug}`,
              query: {
                sort: resolvedSort,
                page: Math.max(1, resolvedPage - 1),
              },
            }}
            className={`rounded-2xl border border-gray-200 px-4 py-2 transition hover:text-text ${resolvedPage === 1 ? "pointer-events-none opacity-50" : ""
              }`}
          >
            Previous
          </Link>
          <span>
            Page {resolvedPage} of {totalPages}
          </span>
          <Link
            href={{
              pathname: `/category/${slug}`,
              query: {
                sort: resolvedSort,
                page: Math.min(totalPages, resolvedPage + 1),
              },
            }}
            className={`rounded-2xl border border-gray-200 px-4 py-2 transition hover:text-text ${resolvedPage === totalPages ? "pointer-events-none opacity-50" : ""
              }`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
