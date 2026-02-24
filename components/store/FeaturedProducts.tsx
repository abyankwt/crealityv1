import Link from "next/link";
import StoreProductCard, { type StoreProduct } from "./ProductCard";

type FeaturedProductsProps = {
  title?: string;
  products: StoreProduct[];
  totalCount?: number;
};

export default function FeaturedProducts({
  title = "Featured printers",
  products,
  totalCount,
}: FeaturedProductsProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Featured
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[#0b0b0b] sm:text-[28px]">
            {title}
          </h2>
        </div>
        <Link
          href="/category/3d-printers"
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[#0b0b0b]"
        >
          View all →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">
          No products found.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
          {products.map((product) => (
            <StoreProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
