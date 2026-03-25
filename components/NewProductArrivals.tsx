import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { WCProduct } from "@/lib/api";

type NewProductArrivalsProps = {
    products: WCProduct[];
};

export default function NewProductArrivals({ products }: NewProductArrivalsProps) {
    if (!products || products.length === 0) return null;

    return (
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
                        className="hidden text-sm font-semibold text-[#6BBE45] hover:underline sm:block uppercase tracking-wider"
                    >
                        View all new →
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                <div className="mt-6 flex justify-center sm:hidden">
                    <Link
                        href="/store?sort=date_desc"
                        className="rounded-xl border border-gray-200 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                        View all new
                    </Link>
                </div>
            </div>
        </section>
    );
}
