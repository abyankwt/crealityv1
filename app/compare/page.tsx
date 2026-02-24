"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import useCompare from "@/components/compare/useCompare";
import type { StoreProduct, StoreProductAttribute } from "@/lib/store-types";

const FALLBACK = "/images/product-placeholder.svg";

/* Spec keys we try to match from product attributes */
const SPEC_KEYS = [
    { label: "Price", key: "price" },
    { label: "Build Volume", key: "build volume" },
    { label: "Print Speed", key: "print speed" },
    { label: "Layer Resolution", key: "layer resolution" },
    { label: "Supported Materials", key: "supported materials" },
    { label: "Weight", key: "weight" },
    { label: "Dimensions", key: "dimensions" },
];

const getAttributeValues = (attribute: StoreProductAttribute): string => {
    if (attribute.options?.length) return attribute.options.join(", ");
    if (attribute.terms?.length)
        return attribute.terms
            .map((t) => t.name || t.slug || "")
            .filter(Boolean)
            .join(", ");
    return "—";
};

const findSpec = (product: StoreProduct, key: string): string => {
    const attr = (product.attributes ?? []).find(
        (a) => a.name?.toLowerCase().includes(key) || key.includes(a.name?.toLowerCase() ?? "")
    );
    if (attr) return getAttributeValues(attr);
    return "—";
};

const renderPrice = (product: StoreProduct): string => {
    const priceHtml = product.price_html?.replace(/<[^>]+>/g, "").trim();
    if (priceHtml) return priceHtml;
    if (product.prices?.price && product.prices?.currency_code) {
        const amount = Number(product.prices.price);
        if (Number.isFinite(amount)) {
            const unit = product.prices.currency_minor_unit ?? 2;
            const val = product.prices.price.includes(".") ? amount : amount / Math.pow(10, unit);
            return `${val.toFixed(unit)} ${product.prices.currency_code}`;
        }
    }
    return "—";
};

export default function ComparePage() {
    const { items, removeItem, clearAll } = useCompare();
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (items.length === 0) {
            setProducts([]);
            return;
        }

        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const ids = items.map((i) => i.id).join(",");
                const res = await fetch(`/api/store/products?include=${ids}&per_page=4`);
                if (!res.ok) throw new Error("Failed to fetch products");
                const data = await res.json();
                const arr: StoreProduct[] = Array.isArray(data) ? data : data?.products ?? [];
                if (active) setProducts(arr);
            } catch (err) {
                if (active) setError((err as Error).message ?? "Something went wrong");
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => { active = false; };
    }, [items]);

    /* Build rows */
    const specRows = SPEC_KEYS.map((spec) => ({
        label: spec.label,
        values: products.map((p) =>
            spec.key === "price" ? renderPrice(p) : findSpec(p, spec.key)
        ),
    }));

    return (
        <main className="min-h-screen bg-[#f8f8f8]">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                            Product Comparison
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                            Compare {products.length > 0 ? `(${products.length})` : ""}
                        </h1>
                    </div>
                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Empty state */}
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                        <p className="text-base font-semibold text-gray-700">
                            No products selected for comparison
                        </p>
                        <p className="text-sm text-gray-400">
                            Click "Add to compare" on any printer product card to get started.
                        </p>
                        <Link
                            href="/category/3d-printers"
                            className="mt-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
                        >
                            Browse 3D Printers
                        </Link>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-sm text-gray-500">Loading comparison data…</div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Comparison Table */}
                {!loading && products.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                        <table className="w-full min-w-[640px] border-collapse">
                            {/* Product header row */}
                            <thead>
                                <tr>
                                    {/* Sticky feature label column */}
                                    <th className="sticky left-0 z-10 w-40 border-b border-gray-100 bg-white px-5 py-4 text-left align-bottom">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                                            Specification
                                        </span>
                                    </th>
                                    {products.map((product) => (
                                        <th
                                            key={product.id}
                                            className="min-w-[200px] border-b border-gray-100 px-5 py-4 text-left align-top"
                                        >
                                            <div className="space-y-3">
                                                {/* Thumbnail */}
                                                <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gray-100">
                                                    <Image
                                                        src={product.images?.[0]?.src ?? FALLBACK}
                                                        alt={product.name}
                                                        fill
                                                        sizes="200px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-500">
                                                        {renderPrice(product)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/product/${product.slug}`}
                                                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 transition hover:border-gray-400"
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(product.id)}
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* Spec rows */}
                            <tbody>
                                {specRows.map((row, i) => {
                                    const unique = new Set(row.values.filter((v) => v !== "—"));
                                    const hasDiff = unique.size > 1;
                                    return (
                                        <tr
                                            key={row.label}
                                            className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                                        >
                                            {/* Sticky label */}
                                            <td className="sticky left-0 z-10 border-t border-gray-100 bg-inherit px-5 py-3.5">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {row.label}
                                                </span>
                                            </td>
                                            {row.values.map((val, idx) => (
                                                <td
                                                    key={idx}
                                                    className={`border-t border-gray-100 px-5 py-3.5 text-sm text-gray-700 ${hasDiff && val !== "—" ? "font-semibold text-gray-900" : ""
                                                        }`}
                                                >
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Nudge when only 1 item selected */}
                {items.length === 1 && !loading && (
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Add at least one more product to start comparing.
                    </p>
                )}
            </div>
        </main>
    );
}
