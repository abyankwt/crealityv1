"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddToCartConfirmationModal from "@/components/AddToCartConfirmationModal";
import OrderWarningModal from "@/components/OrderWarningModal";
import ProductCard from "@/components/ProductCard";
import SmartImage from "@/components/SmartImage";
import { useCart } from "@/context/CartContext";
import { getProductAvailability } from "@/lib/availability";
import { FALLBACK_PRODUCT_IMAGE, resolveImageSource } from "@/lib/image";
import { resolveDisplayProductOrderType, resolveProductSection } from "@/lib/productLogic";
import { formatPrice, getProductPriceInfo } from "@/lib/price";
import { sanitizeWooDescription } from "@/lib/sanitizeWooDescription";
import { requiresMoq, SPECIAL_ORDER_MOQ } from "@/lib/specialOrderMoq";
import type {
  StoreProduct,
  StoreProductAttribute,
} from "@/lib/store-types";

const PRE_ORDER_BUTTON_STYLE =
  "bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#7E22CE] hover:to-[#6B21A8]";

type ProductDetailProps = {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
};

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

const truncate = (value: string, max = 32) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

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

export default function ProductDetail({
  product,
  relatedProducts,
}: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Compute availability before state so minQty can seed useState
  const section = resolveProductSection(product);
  const availability = getProductAvailability(product, section);
  const hasMoq =
    availability.type === "special" &&
    requiresMoq(product.categories?.map((c) => c.slug) ?? []);
  const minQty = hasMoq ? SPECIAL_ORDER_MOQ : 1;

  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0]?.src ?? FALLBACK_PRODUCT_IMAGE
  );
  const [imageFade, setImageFade] = useState(false);
  const [quantity, setQuantity] = useState(minQty);
  const [adding, setAdding] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(minQty);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const primaryActionsRef = useRef<HTMLDivElement | null>(null);
  const [restStockQty, setRestStockQty] = useState<number | null>(
    typeof product.stock_quantity === "number" ? product.stock_quantity : null
  );

  useEffect(() => {
    if (!product.id) return;
    fetch(`/api/products-data?ids=${product.id}`)
      .then((r) => r.json())
      .then((data: Array<{ id: number; sku: string | null; stock_quantity: number | null }>) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const entry = data[0];
        if (entry && entry.stock_quantity !== null) {
          setRestStockQty(entry.stock_quantity);
        }
      })
      .catch(() => {/* silent */});
  }, [product.id]);

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: 0, src: FALLBACK_PRODUCT_IMAGE, alt: product.name }];

  const mainImage = selectedImage || galleryImages[0]?.src || FALLBACK_PRODUCT_IMAGE;
  const optimisticCartItem =
    product.id > 0
      ? {
          id: product.id,
          name: product.name,
          images: (product.images ?? []).map((image) => ({
            id: image.id,
            src: image.src,
            thumbnail: image.thumbnail ?? undefined,
            alt: image.alt ?? undefined,
            name: image.name ?? undefined,
          })),
          prices: product.prices,
          availability,
          permalink: product.permalink,
          short_description: product.short_description,
          description: product.description,
        }
      : undefined;
  const displayOrderType = resolveDisplayProductOrderType(product, section);
  const cleanDescription = sanitizeWooDescription(product.description);
  const stockCount =
    availability.type === "available" && restStockQty !== null ? restStockQty : null;
  const stockLabel =
    availability.type === "available"
      ? stockCount !== null
        ? `In Stock (${stockCount})`
        : "In Stock"
      : availability.label;
  const canOrder = Boolean(product.id);
  const modalAvailability = {
    type: availability.type,
    label: availability.label,
    badge: availability.badge,
    leadTime:
      availability.type === "special"
        ? "within 15 days"
        : product.lead_time ?? availability.leadTime ?? null,
  };
  const videoUrl = extractVideoUrl(product.meta_data);
  const embedUrl = getEmbedUrl(videoUrl);
  const thumbImage = resolveImageSource(product.images?.[0], FALLBACK_PRODUCT_IMAGE);
  const priceInfo = getProductPriceInfo(product);

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
    restStockQty !== null && restStockQty > 0 && restStockQty <= 5;

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

  const performAddToCart = async (itemQuantity: number) => {
    // Show feedback immediately — don't wait for the API
    setAdding(true);
    setToast({
      message:
        availability.type === "preorder"
          ? "Pre-order item added to cart."
          : "Added to cart.",
      type: "success",
    });
    setConfirmationOpen(true);

    try {
      await addItem(product.id, itemQuantity, {
        optimisticItem: optimisticCartItem,
      });
    } catch {
      // Roll back optimistic UI
      setConfirmationOpen(false);
      setToast({ message: "Unable to add to cart.", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleAddToCart = async (itemQuantity: number) => {
    if (adding || !canOrder) {
      return;
    }

    if (availability.type !== "available") {
      setPendingQuantity(itemQuantity);
      setWarningAccepted(false);
      setWarningOpen(true);
      return;
    }

    await performAddToCart(itemQuantity);
  };

  const handleImageSelect = (src: string) => {
    if (src === selectedImage) return;
    setImageFade(true);
    window.setTimeout(() => {
      setSelectedImage(src);
      setImageFade(false);
    }, 160);
  };

  const renderProductPrice = () => {
    if (priceInfo.hasSale) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(priceInfo.regularPrice)}
          </span>
          <span className="text-2xl font-semibold text-black lg:text-3xl">
            {formatPrice(priceInfo.salePrice)}
          </span>
        </div>
      );
    }

    if (priceInfo.currentPrice > 0) {
      return <div className="product-price">{formatPrice(priceInfo.currentPrice)}</div>;
    }

    return <div className="product-price">Unavailable</div>;
  };

  const priceAriaLabel = priceInfo.hasSale
    ? `${formatPrice(priceInfo.regularPrice)} sale ${formatPrice(priceInfo.salePrice)}`
    : priceInfo.currentPrice > 0
    ? formatPrice(priceInfo.currentPrice)
    : "Unavailable";

  return (
    <div className="product-page bg-[#f8f8f8]">
      <section className="product-summary px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="gallery">
          <div className="grid gap-5 lg:grid-cols-[112px_minmax(0,1fr)] lg:items-start">
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
                      className={`relative h-24 w-24 overflow-hidden rounded-xl border transition ${
                        isActive ? "border-black" : "border-gray-200"
                      }`}
                      aria-label={`View ${product.name} image`}
                    >
                      <SmartImage
                        src={resolveImageSource(image, FALLBACK_PRODUCT_IMAGE)}
                        alt={image.alt ?? product.name}
                        mode="product"
                        sizes="96px"
                        className="rounded-xl"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="order-1">
              <div className="lg:hidden">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="w-[82%] max-h-[55vh] flex-shrink-0 snap-center overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                      <SmartImage
                        src={image.src ?? FALLBACK_PRODUCT_IMAGE}
                        alt={image.alt ?? product.name}
                        mode="product"
                        sizes="80vw"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                <SmartImage
                  src={mainImage}
                  alt={product.name}
                  mode="product"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="rounded-xl"
                  imageClassName={`transition duration-200 ease-out ${
                    imageFade ? "opacity-0" : "opacity-100"
                  } lg:hover:scale-[1.03]`}
                  priority
                />
              </div>
            </section>
          </div>
        </div>

        <aside className="product-info">
          <div className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-24 lg:p-5">
            <div className="flex flex-col gap-3 lg:gap-4">
              <div>
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
                className="text-2xl font-semibold text-gray-900 lg:text-3xl"
                aria-label={priceAriaLabel}
              >
                {renderProductPrice()}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {availability.type === "preorder" && (
                  <span className="inline-flex items-center rounded-full bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Pre-order
                  </span>
                )}
                {availability.leadTime && (
                  <span className="text-sm font-medium text-gray-500">
                    Delivery: {availability.leadTime}
                  </span>
                )}
              </div>

              <div ref={primaryActionsRef} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(minQty, prev - 1))}
                      className="h-10 w-10 rounded-l-lg text-lg font-semibold text-gray-500 transition hover:bg-gray-50"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="min-w-[44px] text-center text-sm font-semibold text-gray-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => restStockQty !== null ? Math.min(restStockQty, prev + 1) : prev + 1)}
                      disabled={restStockQty !== null && quantity >= restStockQty}
                      className="h-10 w-10 rounded-r-lg text-lg font-semibold text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {hasMoq && (
                    <p className="text-sm text-orange-500">
                      Minimum order: {SPECIAL_ORDER_MOQ} pieces
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleAddToCart(quantity)}
                  disabled={adding || !canOrder}
                  className={`w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition ${
                    displayOrderType === "in_stock"
                      ? "bg-black hover:bg-gray-900"
                      : displayOrderType === "special_order"
                      ? "bg-[#f97316] hover:bg-[#ea580c]"
                      : PRE_ORDER_BUTTON_STYLE
                  } disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400`}
                >
                  {adding ? "Adding..." : availability.label}
                </button>
              </div>

              <div className="flex flex-col gap-1 text-sm">
                {availability.type !== "preorder" ? (
                  <span
                    className={`font-semibold ${
                      availability.type === "available"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {stockLabel}
                  </span>
                ) : null}
                {availability.type === "preorder" && (
                  <span className="text-xs text-orange-600">
                    Special handling. Non-refundable before arrival.
                  </span>
                )}
                {isLowStock && (
                  <span className="text-xs text-amber-600">
                    Low stock. Confirm availability.
                  </span>
                )}
                {product.sku && (
                  <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                )}
              </div>

              {product.short_description && (
                <div
                  className="text-sm leading-6 text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              )}

              <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-gray-600">
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
      </section>

      {cleanDescription && (
        <section className="product-marketing bg-[#f8f8f8]">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="mb-6 px-4 pt-8 text-2xl font-bold text-gray-900 md:px-8">
              Overview
            </h2>
          </div>
          <div
            className="marketing-content"
            dangerouslySetInnerHTML={{ __html: cleanDescription }}
          />
        </section>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
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
        </section>

        <section className="mt-8 md:mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Related products</h2>
          </div>
          {relatedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No related products available.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((related) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  section={section === "used_printers" ? "used_printers" : section}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div
        className={`sticky-order-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white transition-transform duration-300 ease-out lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <SmartImage
              src={thumbImage}
              alt={product.name}
              mode="product"
              sizes="44px"
              className="rounded-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">
              {truncate(product.name, 28)}
            </p>
            <div
              className="text-sm font-semibold text-gray-900"
              aria-label={priceAriaLabel}
            >
              {renderProductPrice()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleAddToCart(1)}
            disabled={adding || !canOrder}
            className={`flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
              displayOrderType === "in_stock"
                ? "bg-black hover:bg-gray-900"
                : displayOrderType === "special_order"
                ? "bg-[#f97316] hover:bg-[#ea580c]"
                : PRE_ORDER_BUTTON_STYLE
            } disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400`}
          >
            {adding ? "Adding..." : availability.label}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-lg border px-4 py-3 text-sm sm:bottom-8">
          <div
            className={`rounded-md px-3 py-2 text-center font-semibold ${
              toast.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <OrderWarningModal
        open={warningOpen}
        availability={modalAvailability}
        product={product}
        showMoq={hasMoq}
        acknowledged={warningAccepted}
        onAcknowledgedChange={setWarningAccepted}
        onClose={() => setWarningOpen(false)}
        onConfirm={async () => {
          setWarningOpen(false);
          if (availability.type === "special") {
            await performAddToCart(pendingQuantity);
            return;
          }

          await performAddToCart(pendingQuantity);
        }}
        confirmLabel="Add to cart"
        secondaryLabel="Back"
        title="Before you continue"
      />

      <AddToCartConfirmationModal
        open={confirmationOpen}
        product={product}
        onClose={() => setConfirmationOpen(false)}
      />
    </div>
  );
}
