"use client";

import Link from "next/link";
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
  showSort?: boolean;
};

type SortValue =
  | "popularity_desc"
  | "date_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc";

type CategoryFilterValue =
  | "all"
  | "3d-printers"
  | "3d-scanners"
  | "accessories"
  | "materials"
  | "washing-curing"
  | "laser-milling"
  | "spare-parts"
  | "used-printers";

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
  { label: "3D Printers", value: "3d-printers" },
  { label: "3D Scanners", value: "3d-scanners" },
  { label: "Accessories & Tools", value: "accessories" },
  { label: "Materials", value: "materials" },
  { label: "Washing & Curing", value: "washing-curing" },
  { label: "Laser & Milling", value: "laser-milling" },
  { label: "Spare Parts", value: "spare-parts" },
  { label: "Used 3D Printers", value: "used-printers" },
];

const PRINTER_SLUGS = new Set([
  "k-series", "k1", "k2", "k2-plus", "k-seies",
  "ender-series", "spark-i7", "hi-printer", "hi-series",
  "sermoon-series", "resin-series", "halot-series", "cr-series",
  "3d-printers", "fdm-printers", "resin-printers",
]);

const SCANNER_SLUGS = new Set([
  "3d-scanners", "3d-scanner-series", "3d-scanners-series",
]);

const ACCESSORY_SLUGS = new Set([
  "accessories", "filament-dryer", "tools", "wifi-upgrade-kits",
  "screen-kit", "auto-leveling", "silent-motherboard", "printer-enclosure",
]);

const MATERIAL_SLUGS = new Set([
  "materials", "pla-filaments", "petg-filaments", "tpu-filaments",
  "abs-filaments", "resin",
]);

const WASHING_CURING_SLUGS = new Set(["washing-curing", "washing-curing-series"]);

const LASER_MILLING_SLUGS = new Set(["laser-milling", "laser-milling-series"]);

const SPARE_PART_SLUGS = new Set([
  "spare-parts",
  "extruderkit", "filament-sensor", "nozzle", "bed", "hotend", "hotbid",
  "bearing", "motors", "power-supply-fdm", "gears", "belt-cable-tubes",
  "fan", "otherkits",
  "releasefilm", "protective_cover", "resin-vat-platform-kit",
  "print_screen", "power-supply-sla", "motherboard-sla",
  "cables-wires", "fans-sla", "toolkits",
]);

// Maps category filter values to API category_slug — used when fetching fresh
// products on pages that have no base category (Shop All).
const CATEGORY_FILTER_SLUG_MAP: Partial<Record<CategoryFilterValue, string>> = {
  "3d-printers": "3d-printers",
  "3d-scanners": "3d-scanners",
  "accessories": "accessories",
  "materials": "materials",
  "washing-curing": "washing-curing",
  "laser-milling": "laser-milling",
  "spare-parts": "spare-parts",
  "used-printers": "used-3d-printers",
};

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Most popular", value: "popularity_desc" },
  { label: "Newest", value: "date_desc" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
];

const matchesCategoryFilter = (
  product: Product,
  categoryFilter: CategoryFilterValue
) => {
  if (categoryFilter === "all") return true;

  const slugs = [
    ...(product.category_slug ?? []),
    ...product.categories.map((c) => c.slug),
  ].map((s) => s.toLowerCase());

  switch (categoryFilter) {
    case "3d-printers":
      // Must be in a printer category AND not in laser/milling, accessories or spare parts
      return (
        slugs.some((s) => PRINTER_SLUGS.has(s)) &&
        !slugs.some((s) => LASER_MILLING_SLUGS.has(s)) &&
        !slugs.some((s) => ACCESSORY_SLUGS.has(s)) &&
        !slugs.some((s) => SPARE_PART_SLUGS.has(s))
      );
    case "3d-scanners":
      return slugs.some((s) => SCANNER_SLUGS.has(s));
    case "accessories":
      return (
        slugs.some((s) => ACCESSORY_SLUGS.has(s)) &&
        !slugs.some((s) => LASER_MILLING_SLUGS.has(s))
      );
    case "materials":
      return slugs.some((s) => MATERIAL_SLUGS.has(s));
    case "washing-curing":
      return slugs.some((s) => WASHING_CURING_SLUGS.has(s));
    case "laser-milling":
      return slugs.some((s) => LASER_MILLING_SLUGS.has(s));
    case "spare-parts":
      return slugs.some((s) => SPARE_PART_SLUGS.has(s));
    case "used-printers":
      return slugs.some((s) => s.includes("used-3d-printers") || s.includes("used3dprinters"));
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
  showSort = true,
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
  // True when products[] was fetched specifically for a category via the API.
  // In that case the products are already correctly scoped — skip matchesCategoryFilter.
  const [isCategoryFetched, setIsCategoryFetched] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const activeCategoryRef = useRef<CategoryFilterValue>("all");
  // Tracks whether the most recent sortValue change came from a user interaction.
  const userChangedSortRef = useRef(false);
  // True when this grid is on a page with no pre-set category (Shop All).
  // Category pages pass category_slug in apiQuery; shop-all does not.
  const isShopAll = !apiQuery?.category_slug;
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

  // On Shop All: when the user selects a specific category, fetch products for
  // that category from the API instead of filtering the already-loaded batch.
  useEffect(() => {
    activeCategoryRef.current = categoryFilter;

    if (!isShopAll) return; // Category pages filter client-side — nothing to do.

    if (categoryFilter === "all") {
      // Reset back to the server-rendered products.
      setIsCategoryFetched(false);
      setProducts(
        filterBySection
          ? filterProductsForSection(initialProducts, section)
          : initialProducts
      );
      setPage(initialPage);
      setHasMore(initialPage < totalPages);
      return;
    }

    const categorySlug = CATEGORY_FILTER_SLUG_MAP[categoryFilter];
    if (!categorySlug) return;

    setLoading(true);
    const params = new URLSearchParams({
      category_slug: categorySlug,
      page: "1",
      per_page: "16",
      cache: "no-store",
    });

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { products: Product[]; pagination: { totalPages: number } }) => {
        if (activeCategoryRef.current !== categoryFilter) return; // stale response
        setIsCategoryFetched(true);
        setProducts(data.products ?? []);
        setPage(1);
        setHasMore(1 < (data.pagination?.totalPages ?? 1));
      })
      .catch((err: unknown) => {
        console.error("Category fetch failed:", err);
      })
      .finally(() => {
        if (activeCategoryRef.current === categoryFilter) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, isShopAll]);

  // Re-fetch page 1 from API when user changes to a server-side sort (popularity/date).
  // Client-side sorts (price/name) are applied in filteredProducts without a re-fetch.
  useEffect(() => {
    if (!userChangedSortRef.current) return;
    userChangedSortRef.current = false;

    if (sortValue !== "popularity_desc" && sortValue !== "date_desc") return;

    setLoading(true);
    const params = new URLSearchParams({ page: "1", per_page: "16", sort: sortValue, cache: "no-store" });

    if (isShopAll && categoryFilter !== "all") {
      const catSlug = CATEGORY_FILTER_SLUG_MAP[categoryFilter];
      if (catSlug) params.set("category_slug", catSlug);
    } else {
      Object.entries(apiQuery ?? {}).forEach(([key, val]) => {
        if (key === "sort") return;
        if (val !== undefined && val !== "") params.set(key, String(val));
      });
    }

    let active = true;
    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { products: Product[]; pagination: { totalPages: number } }) => {
        if (!active) return;
        const nextProducts = filterBySection
          ? filterProductsForSection(data.products, section)
          : data.products;
        setProducts(nextProducts);
        setPage(1);
        setIsCategoryFetched(false);
        setHasMore(1 < (data.pagination?.totalPages ?? 1));
      })
      .catch((err: unknown) => console.error("Sort re-fetch failed:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortValue]);

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
      const matchesSearch =
        !normalizedSearch ||
        productName.includes(normalizedSearch);
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

      // Skip client-side category check when products were fetched from the
      // API specifically for this category — they are already correctly scoped.
      const matchesCategory =
        isCategoryFetched || matchesCategoryFilter(product, categoryFilter);

      return (
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock &&
        matchesCategory
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
    isCategoryFetched,
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
      params.set("per_page", "16");

      // Always include the user's current sort so paginated pages match the displayed order.
      params.set("sort", sortValue);

      // When on Shop All with a category filter active, paginate that category.
      if (isShopAll && categoryFilter !== "all") {
        const catSlug = CATEGORY_FILTER_SLUG_MAP[categoryFilter];
        if (catSlug) params.set("category_slug", catSlug);
        params.set("cache", "no-store");
      } else {
        Object.entries(apiQuery ?? {}).forEach(([key, value]) => {
          if (key === "sort") return; // already set above
          if (value !== undefined && value !== "") {
            params.set(key, String(value));
          }
        });
      }

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
  }, [apiQuery, categoryFilter, filterBySection, hasMore, isShopAll, loading, page, section, sortValue]);

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
            {search.trim() && (
              <Link
                href={`/search?q=${encodeURIComponent(search.trim())}`}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
              >
                Search all →
              </Link>
            )}
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

            {showSort && (
              <select
                value={sortValue}
                onChange={(event) => {
                  userChangedSortRef.current = true;
                  setSortValue(event.target.value as SortValue);
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:border-black focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
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
