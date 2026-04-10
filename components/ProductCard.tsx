"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AddToCartConfirmationModal from "@/components/AddToCartConfirmationModal";
import OrderWarningModal from "@/components/OrderWarningModal";
import ProductActionButton from "@/components/ProductActionButton";
import SmartImage from "@/components/SmartImage";
import { useCart } from "@/context/CartContext";
import { resolveImageSource } from "@/lib/image";
import { getProductAvailability } from "@/lib/productAvailability";
import type { ProductAvailability } from "@/lib/productAvailability";
import { formatPrice, getProductPriceInfo } from "@/lib/price";
import {
  resolveProductSection,
  resolveDisplayProductOrderType,
  type ProductSection,
} from "@/lib/productLogic";
import { cleanProductName } from "@/lib/cleanProductName";
import { requiresMoq, SPECIAL_ORDER_MOQ } from "@/lib/specialOrderMoq";
import type { Product } from "@/lib/woocommerce-types";
import { decodeHtmlEntities } from "@/lib/decodeHtml";

type ProductCardProps = {
  product: Product;
  section?: ProductSection;
  product_order_type?: Product["product_order_type"];
  onAddToCart?: (message?: string) => void;
  onAddToCartError?: (message?: string) => void;
  showShortDescription?: boolean;
};

const stripHtml = (value?: string) => {
  if (!value) return "";
  const stripped = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return decodeHtmlEntities(stripped);
};

export default function ProductCard({
  product,
  section,
  product_order_type,
  onAddToCart,
  onAddToCartError,
  showShortDescription = false,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem, cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimerRef = useRef<number | null>(null);

  const resolvedImage = resolveImageSource(product.images?.[0]);
  const priceInfo = getProductPriceInfo(product);
  const shortDescription = stripHtml(product.short_description);
  const resolvedSection = section ?? resolveProductSection(product);
  const productOrderType =
    product_order_type ??
    resolveDisplayProductOrderType(product, resolvedSection);
  const availability = getProductAvailability(product, resolvedSection);
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
  const isPreOrder = productOrderType === "pre_order";
  const canAddToCart = Boolean(product.id);
  const stockQuantity = typeof product.stock_quantity === "number" ? product.stock_quantity : null;
  const cartQuantity = cart?.items.find((item) => item.id === product.id)?.quantity ?? 0;
  const isStockLimitReached =
    availability.type === "available" &&
    stockQuantity !== null &&
    cartQuantity >= stockQuantity;
  const statusText =
    availability.type === "available"
      ? stockQuantity !== null && stockQuantity > 0
        ? `In Stock (${stockQuantity})`
        : "In Stock"
      : null;
  const successMessage =
    productOrderType === "pre_order"
      ? "Pre-order item added to cart"
      : "Added to cart";

  const showLocalToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastType(type);
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 1600);
  };

  const modalAvailability: ProductAvailability = isPreOrder
    ? {
        type: "preorder",
        label: "Pre-Order",
        badge: "Pre-Order",
        leadTime: product.lead_time ?? "~45 days",
      }
    : {
        type: "special",
        label: "Special Order",
        badge: "Special Order",
        leadTime: "within 15 days",
      };

  const hasMoq =
    productOrderType === "special_order" &&
    requiresMoq(product.category_slug ?? []);

  useEffect(() => {
    console.log("Stock debug", {
      name: product.name,
      stock_status: product.stock_status,
      is_in_stock: product.is_in_stock,
      stock_quantity: product.stock_quantity,
      resolved_availability: availability.type,
      resolved_order_type: productOrderType,
    });
  }, [product.name, product.stock_status, product.is_in_stock, product.stock_quantity, availability.type, productOrderType]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const commitAddToCart = async () => {
    if (!product.id || !canAddToCart) {
      router.push(`/product/${product.slug}`);
      return;
    }

    try {
      setLoading(true);
      await addItem(product.id, hasMoq ? SPECIAL_ORDER_MOQ : 1, { optimisticItem: optimisticCartItem });
      setAddedFeedback(true);
      setConfirmationOpen(true);
      if (onAddToCart) {
        onAddToCart(successMessage);
      } else {
        showLocalToast(successMessage);
      }
      window.setTimeout(() => setAddedFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unable to add item to cart.";
      if (onAddToCartError) {
        onAddToCartError(errorMessage);
      } else {
        showLocalToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialOrderClick = () => {
    if (loading) {
      return;
    }

    setWarningAccepted(false);
    setWarningOpen(true);
  };

  return (
    <>
      <article className="product-card flex flex-col min-w-0 group relative h-full rounded-xl border border-gray-200 bg-white p-[10px] transition-all duration-200 hover:shadow-sm">
        {availability.type === "preorder" && (
          <div className="product-badge absolute left-2 top-2 z-10 rounded-full bg-purple-600 px-[10px] py-1 text-[12px] font-semibold text-white">
            Pre-order
          </div>
        )}
        {availability.type === "special" && (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-orange-500 px-2 py-1 text-xs font-medium text-white">
            Special Order
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          prefetch
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div className="product-image-wrapper relative rounded-xl bg-[#f5f5f5]">
            <SmartImage
              src={resolvedImage}
              alt={product.name}
              mode="product"
              sizes="(max-width: 768px) 50vw, 25vw"
              className="h-full w-full rounded-xl"
              imageClassName="transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>

        <div className="product-content flex flex-1 flex-col pt-3">
          <Link href={`/product/${product.slug}`} prefetch className="block">
            <h3 className="product-title line-clamp-2 min-h-[2.75rem] text-[14px] font-semibold leading-[1.3] text-text">
              {cleanProductName(product.name)}
            </h3>
          </Link>

          {showShortDescription && shortDescription ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
              {shortDescription}
            </p>
          ) : null}

          <div className="mt-2">
            {priceInfo.hasSale ? (
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <span className="text-sm text-gray-400 line-through sm:text-base">
                  {formatPrice(priceInfo.regularPrice)}
                </span>
                <span className="text-sm font-semibold text-black sm:text-base">
                  {formatPrice(priceInfo.salePrice)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-text sm:text-base">
                {formatPrice(priceInfo.currentPrice)}
              </span>
            )}
          </div>

          {statusText ? (
            <p
              className={`mt-2 text-sm font-semibold ${
                availability.type === "available" ? "text-green-600" : "text-orange-600"
              }`}
            >
              {statusText}
            </p>
          ) : null}

          {product.sku ? (
            <p className="mt-1 text-xs text-gray-400">SKU: {product.sku}</p>
          ) : null}

          <div className="product-actions mt-3">
            {hasMoq && (
              <p className="mb-1 text-center text-[11px] text-orange-500">
                Min. {SPECIAL_ORDER_MOQ} pcs
              </p>
            )}
            <ProductActionButton
              product_order_type={productOrderType}
              productName={product.name}
              loading={loading}
              added={addedFeedback}
              disabled={isStockLimitReached}
              disabledMessage={
                isStockLimitReached && stockQuantity !== null
                  ? `All ${stockQuantity} in cart`
                  : undefined
              }
              onAddToCart={commitAddToCart}
              onSpecialOrder={handleSpecialOrderClick}
              onPreOrder={handleSpecialOrderClick}
            />
          </div>
        </div>
      </article>

      <OrderWarningModal
        open={warningOpen}
        availability={modalAvailability}
        product={product}
        acknowledged={warningAccepted}
        onAcknowledgedChange={setWarningAccepted}
        onClose={() => setWarningOpen(false)}
        onConfirm={async () => {
          setWarningOpen(false);
          await commitAddToCart();
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

      {!onAddToCart && (
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
      )}
    </>
  );
}
