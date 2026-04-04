"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AddToCartConfirmationModal from "@/components/AddToCartConfirmationModal";
import OrderWarningModal from "@/components/OrderWarningModal";
import ProductActionButton from "@/components/ProductActionButton";
import { useCart } from "@/context/CartContext";
import { getProductAvailability } from "@/lib/productAvailability";
import type { ProductAvailability } from "@/lib/productAvailability";
import { formatPrice, getProductPriceInfo } from "@/lib/price";
import {
  resolveDisplayProductOrderType,
  type ProductSection,
} from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

type ProductCardProps = {
  product: Product;
  section?: ProductSection;
  product_order_type?: Product["product_order_type"];
  onAddToCart?: (message?: string) => void;
  onAddToCartError?: (message?: string) => void;
};

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({
  product,
  section = "default",
  product_order_type,
  onAddToCart,
  onAddToCartError,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimerRef = useRef<number | null>(null);

  const resolvedImage = product.images?.[0]?.src || fallbackImage;
  const priceInfo = getProductPriceInfo(product);
  const productOrderType =
    product_order_type ??
    resolveDisplayProductOrderType(product, section);
  const availability = getProductAvailability(product, section);
  const isPreOrder = productOrderType === "pre_order";
  const canAddToCart = Boolean(product.id);
  const statusText =
    availability.type === "available" ? "In Stock" : null;
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
        leadTime: "10-12 days",
      };

  useEffect(() => {
    console.log("Woo product", {
      name: product.name,
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      is_in_stock: product.is_in_stock,
    });
  }, [product.is_in_stock, product.name, product.stock_quantity, product.stock_status]);

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
      await addItem(product.id, 1);
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
            <img
              src={resolvedImage}
              alt={product.name}
              className="transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>

        <div className="product-content flex flex-1 flex-col pt-3">
          <Link href={`/product/${product.slug}`} prefetch className="block">
            <h3 className="product-title min-h-[2.75rem] text-[14px] font-semibold leading-[1.3] text-text">
              {product.name}
            </h3>
          </Link>

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
                statusText === "In Stock" ? "text-green-600" : "text-orange-600"
              }`}
            >
              {statusText}
            </p>
          ) : null}

          <div className="product-actions mt-3">
            <ProductActionButton
              product_order_type={productOrderType}
              productName={product.name}
              loading={loading}
              added={addedFeedback}
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
