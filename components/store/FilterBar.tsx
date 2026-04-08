"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
    { label: "Most popular", value: "popularity_desc" },
    { label: "Price: low → high", value: "price_asc" },
    { label: "Price: high → low", value: "price_desc" },
    { label: "Newest", value: "date_desc" },
];

const SERIES_OPTIONS = [
    { label: "FDM Printers", value: "fdm-printers" },
    { label: "Resin Printers", value: "resin-printers" },
    { label: "K1 Series", value: "k1-series" },
    { label: "Ender Series", value: "ender-series" },
    { label: "Resin Series", value: "resin-series" },
];

export default function FilterBar({ totalCount }: { totalCount?: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    const currentSort = searchParams.get("sort") ?? "popularity_desc";
    const currentStock = searchParams.get("stock") ?? "";
    const currentSeries = searchParams.get("series") ?? "";

    // Active filter count for badge
    const activeCount = [currentStock, currentSeries].filter(Boolean).length;

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const clearAll = () => {
        router.replace(pathname, { scroll: false });
        setDrawerOpen(false);
    };

    // Close drawer on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                setDrawerOpen(false);
            }
        };
        if (drawerOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [drawerOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const sortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Sort";

    return (
        <div className="mb-5 flex items-center justify-between gap-3">
            {/* Left — filter button + count */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    Filters
                    {activeCount > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0b0b0b] px-1 text-[10px] font-semibold text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
                {totalCount !== undefined && (
                    <span className="text-sm text-gray-400">
                        {totalCount} {totalCount === 1 ? "product" : "products"}
                    </span>
                )}
            </div>

            {/* Right — sort dropdown */}
            <div className="relative">
                <label htmlFor="store-sort" className="sr-only">Sort products</label>
                <div className="relative">
                    <select
                        id="store-sort"
                        value={currentSort}
                        onChange={(e) => updateParam("sort", e.target.value)}
                        className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3.5 pr-9 text-sm font-semibold text-gray-700 transition hover:border-gray-400 focus:outline-none"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                    />
                </div>
            </div>

            {/* Filter Drawer overlay */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-200 ${drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                    }`}
                aria-hidden={!drawerOpen}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />

                {/* Slide panel */}
                <div
                    ref={drawerRef}
                    className={`absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out sm:bottom-auto sm:right-0 sm:top-0 sm:w-80 sm:rounded-l-2xl sm:rounded-r-none ${drawerOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
                        }`}
                    role="dialog"
                    aria-label="Filter products"
                >
                    {/* Drawer header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                        <div className="flex items-center gap-3">
                            {activeCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 transition"
                                aria-label="Close filters"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Drawer content */}
                    <div className="overflow-y-auto p-5" style={{ maxHeight: "70vh" }}>
                        {/* Sort — mirrored in drawer for mobile */}
                        <div className="mb-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Sort</p>
                            <div className="grid gap-1.5">
                                {SORT_OPTIONS.map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => updateParam("sort", o.value)}
                                        className={`w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition ${currentSort === o.value
                                                ? "bg-[#0b0b0b] text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stock status */}
                        <div className="mb-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                Availability
                            </p>
                            <div className="grid gap-1.5">
                                {[
                                    { label: "All products", value: "" },
                                    { label: "In stock only", value: "instock" },
                                ].map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => updateParam("stock", o.value)}
                                        className={`w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition ${currentStock === o.value
                                                ? "bg-[#0b0b0b] text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Series */}
                        <div className="mb-2">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                Series
                            </p>
                            <div className="grid gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => updateParam("series", "")}
                                    className={`w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition ${!currentSeries
                                            ? "bg-[#0b0b0b] text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    All series
                                </button>
                                {SERIES_OPTIONS.map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => updateParam("series", o.value)}
                                        className={`w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition ${currentSeries === o.value
                                                ? "bg-[#0b0b0b] text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Apply button on mobile */}
                    <div className="border-t border-gray-100 p-4 sm:hidden">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="w-full rounded-xl bg-[#0b0b0b] py-3 text-sm font-semibold text-white"
                        >
                            Show results
                        </button>
                    </div>
                </div>
            </div>

            {/* Active filter chips */}
            {activeCount > 0 && (
                <div className="absolute left-0 top-full mt-2 flex flex-wrap gap-2 px-4 sm:px-0 sm:static sm:mt-0 sm:ml-3">
                    {currentStock && (
                        <button
                            type="button"
                            onClick={() => updateParam("stock", "")}
                            className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-400"
                        >
                            In stock <X className="h-3 w-3" />
                        </button>
                    )}
                    {currentSeries && (
                        <button
                            type="button"
                            onClick={() => updateParam("series", "")}
                            className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-400"
                        >
                            {SERIES_OPTIONS.find((o) => o.value === currentSeries)?.label ?? currentSeries}{" "}
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
