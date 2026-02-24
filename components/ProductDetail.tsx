"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type {
  StoreProduct,
  StoreProductAttribute,
  StoreProductPrices,
} from "@/lib/store-types";

const FALLBACK_IMAGE = "/images/product-placeholder.svg";

type ProductDetailProps = {
  product: StoreProduct;
};

type RelatedProduct = StoreProduct;

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const extractVideoUrl = (meta: StoreProduct["meta_data"]) => {
  const entry = meta?.find(
    (item) => item.key === "video_url" || item.key === "video"
  );
  return entry?.value ?? "";
};

const getEmbedUrl = (url: string) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const match =
      url.match(/v=([^&]+)/) ||
      url.match(/youtu\.be\/([^?]+)/) ||
      url.match(/embed\/([^?]+)/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : "";
  }
  return "";
};

const getAttributeValues = (attribute: StoreProductAttribute) => {
  if (attribute.options && attribute.options.length > 0) {
    return attribute.options;
  }
  if (attribute.terms && attribute.terms.length > 0) {
    return attribute.terms
      .map((term) => term.name || term.slug || "")
      .filter(Boolean);
  }
  return [];
};

const getPriceNumber = (price: string, minorUnit?: number) => {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return null;
  const isMinorUnit = minorUnit !== undefined && !price.includes(".");
  return isMinorUnit ? numeric / Math.pow(10, minorUnit) : numeric;
};

const formatPrice = (prices?: StoreProductPrices) => {
  if (!prices?.price || !prices.currency_code) return "";
  const minorUnit = prices.currency_minor_unit ?? 2;
  const amount = getPriceNumber(prices.price, minorUnit);
  if (amount === null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: prices.currency_code,
      minimumFractionDigits: minorUnit,
      maximumFractionDigits: minorUnit,
    }).format(amount);
  } catch {
    return `${amount.toFixed(minorUnit)} ${prices.currency_code}`;
  }
};

const renderPrice = (product: StoreProduct) => {
  const priceHtml = product.price_html?.trim();
  if (priceHtml) {
    return <span dangerouslySetInnerHTML={{ __html: priceHtml }} />;
  }
  const formatted = formatPrice(product.prices);
  if (formatted) {
    return <span>{formatted}</span>;
  }
  if (product.prices?.price && product.prices?.currency_code) {
    return (
      <span>
        {product.prices.price} {product.prices.currency_code}
      </span>
    );
  }
  return <span>Unavailable</span>;
};

const getStockLabel = (status?: string) => {
  if (status === "instock") return "In stock";
  if (status === "onbackorder") return "Backorder";
  return "Out of stock";
};

const truncate = (value: string, max = 32) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className={`h-4 w-4 ${filled ? "text-amber-500" : "text-gray-300"}`}
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.956a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.447a1 1 0 00-.364 1.118l1.287 3.956c.3.921-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.175 0L5.17 17.02c-.784.57-1.838-.197-1.539-1.118l1.287-3.956a1 1 0 00-.364-1.118L1.188 9.383c-.783-.57-.38-1.81.588-1.81H5.94a1 1 0 00.95-.69l1.286-3.956z" />
  </svg>
);

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem, refreshCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0]?.src ?? FALLBACK_IMAGE
  );
  const [imageFade, setImageFade] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const primaryActionsRef = useRef<HTMLDivElement | null>(null);

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: 0, src: FALLBACK_IMAGE, alt: product.name }];

  const mainImage = selectedImage || galleryImages[0]?.src || FALLBACK_IMAGE;
  const stockLabel = getStockLabel(product.stock_status);
  const isOutOfStock = product.stock_status === "outofstock";
  const isAvailable = Boolean(product.purchasable && !isOutOfStock);
  const videoUrl = extractVideoUrl(product.meta_data);
  const embedUrl = getEmbedUrl(videoUrl);
  const thumbImage = product.images?.[0]?.src ?? FALLBACK_IMAGE;

  const ratingValue = Number(product.average_rating ?? 0);
  const reviewCount = Number(product.review_count ?? 0);
  const showRating = ratingValue > 0 && reviewCount > 0;

  const attributes = useMemo(
    () =>
      (product.attributes ?? []).filter(
        (attribute) => getAttributeValues(attribute).length > 0
      ),
    [product.attributes]
  );

  const highlightAttributes = attributes.slice(0, 6);
  const isLowStock =
    typeof product.stock_quantity === "number" &&
    product.stock_quantity > 0 &&
    product.stock_quantity <= 5;

  useEffect(() => {
    const categoryId = product.categories?.[0]?.id;

    if (!categoryId) {
      setRelatedProducts([]);
      return;
    }

    let isActive = true;
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const params = new URLSearchParams();
        params.set("per_page", "8");
        params.set("category", String(categoryId));
        params.set("exclude", String(product.id));

        const response = await fetch(`/api/store/products?${params.toString()}`);
        const data = await response.json();
        const products = Array.isArray(data) ? data : data?.products ?? [];
        const filtered = products.filter(
          (item: StoreProduct) =>
            item.id !== product.id &&
            item.stock_status === "instock" &&
            item.purchasable
        );

        if (isActive) {
          setRelatedProducts(filtered.slice(0, 4));
        }
      } catch {
        if (isActive) {
          setRelatedProducts([]);
        }
      } finally {
        if (isActive) {
          setRelatedLoading(false);
        }
      }
    };

    void fetchRelated();
    return () => {
      isActive = false;
    };
  }, [product.categories, product.id]);

  useEffect(() => {
    const target = primaryActionsRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addItem(product.id, quantity);
      await refreshCart();
      setToast({ message: "Added to cart.", type: "success" });
    } catch {
      setToast({ message: "Unable to add to cart.", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleStickyAddToCart = async () => {
    try {
      setAdding(true);
      await addItem(product.id, 1);
      await refreshCart();
      setToast({ message: "Added to cart.", type: "success" });
    } catch {
      setToast({ message: "Unable to add to cart.", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleImageSelect = (src: string) => {
    if (src === selectedImage) return;
    setImageFade(true);
    window.setTimeout(() => {
      setSelectedImage(src);
      setImageFade(false);
    }, 160);
  };

  const priceAriaLabel =
    product.prices?.price && product.prices?.currency_code
      ? `${product.prices.price} ${product.prices.currency_code}`
      : undefined;

  return (
    <div className="bg-[#f8f8f8]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="grid gap-5 lg:gap-6 lg:grid-cols-[2fr_2fr_1fr]">
          {/* Thumbnail sidebar — desktop only */}
          <div className="order-2 hidden flex-col gap-3 lg:order-1 lg:flex">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Views
            </p>
            <div className="flex flex-col gap-3">
              {galleryImages.map((image) => {
                const isActive = selectedImage === image.src;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => handleImageSelect(image.src)}
                    className={`relative h-24 w-24 overflow-hidden rounded-xl border transition ${isActive ? "border-black" : "border-gray-200"
                      }`}
                    aria-label={`View ${product.name} image`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main image */}
          <section className="order-1 lg:order-2">
            {/* Mobile: horizontal scroll gallery */}
            <div className="lg:hidden">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {galleryImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-[4/3] w-[82%] max-h-[55vh] flex-shrink-0 snap-center overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="80vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: single large image */}
            <div className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className={`object-cover transition duration-200 ease-out ${imageFade ? "opacity-0" : "opacity-100"
                  } lg:hover:scale-[1.03]`}
                priority
              />
            </div>
          </section>

          {/* Product info aside */}
          <aside className="order-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-5 lg:sticky lg:top-24">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="order-1">
                  <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">
                    {product.name}
                  </h1>
                  {showRating && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} filled={index < Math.round(ratingValue)} />
                        ))}
                      </div>
                      <span>
                        {ratingValue.toFixed(1)} ({reviewCount})
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="order-2 text-2xl font-semibold text-gray-900 lg:text-3xl"
                  aria-label={priceAriaLabel}
                >
                  {renderPrice(product)}
                </div>

                <div ref={primaryActionsRef} className="order-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="h-10 w-10 rounded-l-lg text-lg font-semibold text-gray-500 hover:bg-gray-50 transition"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-[44px] text-center text-sm font-semibold text-gray-800">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="h-10 w-10 rounded-r-lg text-lg font-semibold text-gray-500 hover:bg-gray-50 transition"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isAvailable || adding}
                    className="w-full rounded-lg bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {adding ? "Adding…" : "Add to cart"}
                  </button>
                </div>

                <div className="order-4 flex flex-col gap-1 text-sm">
                  <span
                    className={`font-semibold ${stockLabel === "In stock" ? "text-green-600" : "text-red-500"
                      }`}
                  >
                    {stockLabel}
                  </span>
                  {isLowStock && (
                    <span className="text-xs text-amber-600">
                      Low stock. Confirm availability.
                    </span>
                  )}
                </div>

                {product.short_description && (
                  <div
                    className="order-5 text-sm leading-6 text-gray-600"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                  />
                )}

                <div className="order-6 grid grid-cols-1 gap-2 text-xs font-semibold text-gray-600">
                  {[
                    "1-year warranty",
                    "Local Kuwait delivery",
                    "Genuine products",
                  ].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Below-the-fold sections */}
        <section className="mt-5 flex flex-col gap-5 md:mt-8 md:gap-8">
          {highlightAttributes.length > 0 && (
            <div className="order-1 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Feature highlights
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:mt-4 md:gap-4">
                {highlightAttributes.map((attribute) => (
                  <div key={attribute.id} className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {attribute.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {getAttributeValues(attribute).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {embedUrl && (
            <div className="order-4 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
              <h2 className="text-lg font-semibold text-gray-900">Video</h2>
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                <iframe
                  src={embedUrl}
                  title={`${product.name} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="order-2 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Technical specifications
            </h2>
            {attributes.length > 0 ? (
              <div className="mt-3 divide-y divide-gray-200">
                {attributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:py-3"
                  >
                    <span className="text-sm font-semibold text-gray-900 sm:w-52">
                      {attribute.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getAttributeValues(attribute).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Technical specifications will be available soon.
              </p>
            )}
          </div>

          <div className="order-3 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Full description</h2>
            <div
              className="mt-3 max-w-[760px] text-sm leading-[1.6] text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description ?? "" }}
            />
          </div>
        </section>

        {/* Related products */}
        <section className="mt-8 md:mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Related products</h2>
          </div>
          {relatedLoading ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Loading related products…
            </div>
          ) : relatedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No related products available.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {relatedProducts.slice(0, 4).map((related) => (
                <Link
                  key={related.id}
                  href={`/product/${related.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-3 transition hover:border-gray-300"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={related.images?.[0]?.src ?? FALLBACK_IMAGE}
                      alt={related.images?.[0]?.alt ?? related.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {related.name}
                    </p>
                    <div className="text-sm font-semibold text-gray-900">
                      {renderPrice(related)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {getStockLabel(related.stock_status)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Sticky Mobile Add-to-Cart Bar ─── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden transition-transform duration-300 ease-out ${showSticky ? "translate-y-0" : "translate-y-full"
          }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Product thumbnail */}
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <Image
              src={thumbImage}
              alt={product.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          {/* Product info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">
              {truncate(product.name, 28)}
            </p>
            <div
              className="text-sm font-semibold text-gray-900"
              aria-label={priceAriaLabel}
            >
              {renderPrice(product)}
            </div>
          </div>
          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleStickyAddToCart}
            disabled={!isAvailable || adding}
            className="flex-shrink-0 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {isAvailable ? (adding ? "…" : "Add to cart") : "Out of stock"}
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-lg border px-4 py-3 text-sm sm:bottom-8">
          <div
            className={`rounded-md px-3 py-2 text-center font-semibold ${toast.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-600"
              }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
