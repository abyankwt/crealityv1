"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/price";

type ConfirmationProduct = {
  name: string;
  price?: number | string | null;
  images?: Array<{
    src?: string | null;
    alt?: string | null;
  }>;
};

type AddToCartConfirmationModalProps = {
  open: boolean;
  product: ConfirmationProduct;
  onClose: () => void;
};

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function AddToCartConfirmationModal({
  open,
  product,
  onClose,
}: AddToCartConfirmationModalProps) {
  if (!open) return null;

  const imageSrc = product.images?.[0]?.src || FALLBACK_IMAGE;
  const imageAlt = product.images?.[0]?.alt || product.name;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-confirmation-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Cart updated
            </p>
            <h2
              id="add-to-cart-confirmation-title"
              className="mt-1 text-xl font-semibold text-gray-900"
            >
              Added to cart
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close confirmation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{product.name}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cart"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            View Cart
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
