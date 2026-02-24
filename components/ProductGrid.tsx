"use client";

import { useState, useCallback } from "react";
import ProductCard from "./ProductCard";

type ProductImage = {
    id: number;
    src: string;
    alt?: string | null;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    price: string;
    purchasable: boolean;
    stock_status: string;
    images: ProductImage[];
};

type ProductGridProps = {
    initialProducts: Product[];
    initialPage: number;
    totalPages: number;
};

export default function ProductGrid({
    initialProducts,
    initialPage,
    totalPages,
}: ProductGridProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialPage < totalPages);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const nextPage = page + 1;

        try {
            const res = await fetch(`/api/products?page=${nextPage}&per_page=12`);
            if (!res.ok) throw new Error("Failed to fetch products");

            const data = await res.json();
            setProducts((prev) => [...prev, ...data.products]);
            setPage(nextPage);
            setHasMore(nextPage < data.pagination.totalPages);
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page]);

    return (
        <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={{
                            id: product.id,
                            images: product.images,
                            purchasable: product.purchasable,
                            stock_status: product.stock_status,
                        }}
                        imageUrl={product.images?.[0]?.src ?? ""}
                        title={product.name}
                        price={parseFloat(product.price)}
                        slug={product.slug}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="rounded-2xl border border-black px-10 py-4 text-sm font-semibold transition-all duration-300 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Loading…
                            </span>
                        ) : (
                            "Load more products"
                        )}
                    </button>
                </div>
            )}
        </>
    );
}
