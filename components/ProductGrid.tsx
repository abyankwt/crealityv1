"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { getProductAvailability } from "@/lib/productAvailability";
import {
  filterProductsForSection,
  resolveProductSection,
  type ProductSection,
} from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

type ProductGridProps = {
  initialProducts: Product[];
  initialPage: number;
  totalPages: number;
  section?: ProductSection;
  productSectionOverride?: ProductSection;
  apiQuery?: Record<string, string | number | undefined>;
  emptyMessage?: string;
  showShortDescription?: boolean;
  filterBySection?: boolean;
};

type SortValue =
  | "popularity_desc"
  | "date_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc";

type CategoryFilterValue = "all" | "filaments" | "resins" | "accessories";

type FilterPanelProps = {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  categoryFilter: CategoryFilterValue;
  activeFilterCount: number;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  setInStockOnly: (value: boolean) => void;
  setCategoryFilter: (value: CategoryFilterValue) => void;
  clearFilters: () => void;
};

const CATEGORY_FILTER_OPTIONS: Array<{
  label: string;
  value: CategoryFilterValue;
}> = [
  { label: "All", value: "all" },
  { label: "Filaments", value: "filaments" },
  { label: "Resins", value: "resins" },
  { label: "Accessories", value: "accessories" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Most popular", value: "popularity_desc" },
  { label: "Newest", value: "date_desc" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
];

const stripHtml = (value?: string) => value?.replace(/<[^>]*>/g, " ") ?? "";

const matchesCategoryFilter = (
  product: Product,
  categoryFilter: CategoryFilterValue
) => {
  if (categoryFilter === "all") {
    return true;
  }

  const categories = product.categories.map((category) => ({
    slug: category.slug.toLowerCase(),
    name: category.name.toLowerCase(),
  }));

  switch (categoryFilter) {
    case "filaments":
      return categories.some(
        (category) =>
          category.slug.includes("filament") || category.name.includes("filament")
      );
    case "resins":
      return categories.some(
        (category) =>
          category.slug.includes("resin") || category.name.includes("resin")
      );
    case "accessories":
      return categories.some(
        (category) =>
          category.slug.includes("accessor") ||
          category.slug.includes("tool") ||
          category.name.includes("accessor") ||
          category.name.includes("tool")
      );
    default:
      return true;
  }
};

function FilterPanel({
  minPrice,
  maxPrice,
  inStockOnly,
  categoryFilter,
  activeFilterCount,
  setMinPrice,
  setMaxPrice,
  setInStockOnly,
  setCategoryFilter,
  clearFilters,
}: FilterPanelProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Filters</p>
          <p className="mt-1 text-xs text-gray-500">
            Narrow products by stock, price, and category.
          </p>
        </div>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-gray-400 transition hover:text-gray-700"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Price Range
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Min"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Availability
          </label>
          <label className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            />
            In Stock Only
          </label>
        </div>

        <div>
          <label
            htmlFor="category-filter"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400"
          >
            Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as CategoryFilterValue)
            }
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 focus:border-black focus:outline-none"
          >
            {CATEGORY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({
  initialProducts,
  initialPage,
  totalPages,
  section = "default",
  productSectionOverride,
  apiQuery,
  emptyMessage = "No products found.",
  showShortDescription = false,
  filterBySection = true,
}: ProductGridProps) {
  const defaultSort =
    typeof apiQuery?.sort === "string"
      ? (apiQuery.sort as SortValue)
      : "popularity_desc";

  const [products, setProducts] = useState<Product[]>(
    filterBySection ? filterProductsForSection(initialProducts, section) : initialProducts
  );
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState<SortValue>(defaultSort);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const loadingPlaceholders = Array.from({ length: 4 }, (_, index) => index);

  const showToastMessage = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 1600);
    },
    []
  );

  const handleAddedToCart = useCallback(
    (message?: string) => {
      showToastMessage(message ?? "Added to cart");
    },
    [showToastMessage]
  );

  const handleAddToCartError = useCallback(
    (message?: string) => {
      showToastMessage(message ?? "Unable to add item to cart", "error");
    },
    [showToastMessage]
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setProducts(
      filterBySection ? filterProductsForSection(initialProducts, section) : initialProducts
    );
    setPage(initialPage);
    setLoading(false);
    setHasMore(initialPage < totalPages);
    setToastMessage(null);
    setSortValue(defaultSort);
  }, [defaultSort, filterBySection, initialPage, initialProducts, section, totalPages]);

  const activeFilterCount = [
    search.trim(),
    minPrice,
    maxPrice,
    inStockOnly ? "instock" : "",
    categoryFilter !== "all" ? categoryFilter : "",
  ].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const parsedMinPrice = minPrice ? Number(minPrice) : null;
    const parsedMaxPrice = maxPrice ? Number(maxPrice) : null;

    const visibleProducts = products.filter((product) => {
      const productName = product.name.toLowerCase();
      const productDescription = `${stripHtml(product.short_description)} ${stripHtml(
        product.description
      )}`.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        productName.includes(normalizedSearch) ||
        productDescription.includes(normalizedSearch);
      const matchesMinPrice =
        parsedMinPrice === null ||
        Number.isNaN(parsedMinPrice) ||
        product.price >= parsedMinPrice;
      const matchesMaxPrice =
        parsedMaxPrice === null ||
        Number.isNaN(parsedMaxPrice) ||
        product.price <= parsedMaxPrice;
      const matchesStock =
        !inStockOnly ||
        getProductAvailability(
          product,
          productSectionOverride ??
            (filterBySection ? section : resolveProductSection(product))
        ).type === "available";

      return (
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock &&
        matchesCategoryFilter(product, categoryFilter)
      );
    });

    const sortedProducts = [...visibleProducts];

    if (sortValue === "price_asc") {
      sortedProducts.sort((left, right) => left.price - right.price);
    } else if (sortValue === "price_desc") {
      sortedProducts.sort((left, right) => right.price - left.price);
    } else if (sortValue === "name_asc") {
      sortedProducts.sort((left, right) => left.name.localeCompare(right.name));
    }

    return sortedProducts;
  }, [
    categoryFilter,
    inStockOnly,
    maxPrice,
    minPrice,
    productSectionOverride,
    products,
    search,
    section,
    sortValue,
  ]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("per_page", "12");

      Object.entries(apiQuery ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      });

      const res = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = (await res.json()) as {
        products: Product[];
        pagination: { totalPages: number };
      };
      const nextPageProducts = filterBySection
        ? filterProductsForSection(data.products, section)
        : data.products;

      setProducts((prev) => {
        const seenIds = new Set(prev.map((product) => product.id));
        const nextProducts = nextPageProducts.filter(
          (product) => !seenIds.has(product.id)
        );
        return [...prev, ...nextProducts];
      });
      setPage(nextPage);
      setHasMore(nextPage < data.pagination.totalPages);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoading(false);
    }
  }, [apiQuery, filterBySection, hasMore, loading, page, section]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setCategoryFilter("all");
  }, []);

  const resolvedEmptyMessage =
    activeFilterCount > 0 ? "No products found" : emptyMessage;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value as SortValue)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:border-black focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel
                minPrice={minPrice}
                maxPrice={maxPrice}
                inStockOnly={inStockOnly}
                categoryFilter={categoryFilter}
                activeFilterCount={activeFilterCount}
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
                setInStockOnly={setInStockOnly}
                setCategoryFilter={setCategoryFilter}
                clearFilters={clearFilters}
              />
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 px-1">
              <p className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} loaded
                products
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="hidden text-sm font-semibold text-gray-400 transition hover:text-gray-700 sm:block lg:hidden"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="px-3 sm:px-0">
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                  {resolvedEmptyMessage}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      section={productSectionOverride ?? (filterBySection ? section : undefined)}
                      onAddToCart={handleAddedToCart}
                      onAddToCartError={handleAddToCartError}
                      showShortDescription={showShortDescription}
                    />
                  ))}
                  {loading &&
                    loadingPlaceholders.map((placeholder) => (
                      <div key={`product-grid-skeleton-${placeholder}`} aria-hidden="true">
                        <ProductCardSkeleton />
                      </div>
                    ))}
                </div>
              )}
            </div>

            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="rounded-2xl border border-black px-8 py-3 text-sm font-semibold transition-all duration-300 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                      Loading...
                    </span>
                  ) : (
                    "Load more products"
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${mobileFiltersOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} lg:hidden`}
        aria-hidden={!mobileFiltersOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div className="absolute inset-y-0 right-0 w-full bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <p className="mt-1 text-xs text-gray-500">
                Search results update instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-full overflow-y-auto px-4 py-5">
            <FilterPanel
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStockOnly={inStockOnly}
              categoryFilter={categoryFilter}
              activeFilterCount={activeFilterCount}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              setInStockOnly={setInStockOnly}
              setCategoryFilter={setCategoryFilter}
              clearFilters={clearFilters}
            />

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white"
            >
              Show Results
            </button>
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition duration-200 ${
          toastMessage ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg ${
            toastType === "success" ? "bg-black" : "bg-red-600"
          }`}
        >
          {toastMessage}
        </div>
      </div>
    </>
  );
}
