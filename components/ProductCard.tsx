"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";

type ProductImage = {
  src?: string | null;
  alt?: string | null;
};

type ProductCardProps = {
  imageUrl?: string | null;
  product?: {
    id?: number | null;
    images?: ProductImage[] | null;
  } | null;
  title: string;
  price: number;
  slug: string;
  inStock: boolean;
  onAddToCart?: () => void;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 2,
  }).format(value);

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({
  imageUrl,
  product = imageUrl ? { images: [{ src: imageUrl }] } : undefined,
  title,
  price,
  slug,
  inStock,
}: ProductCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const resolvedImage = product?.images?.[0]?.src || fallbackImage;
  const resolvedAlt = title;

  const handleAddToCart = async (): Promise<void> => {
    if (!product?.id) {
      console.error("Missing product id for add to cart.");
      return;
    }

    try {
      setLoading(true);
      await addToCart(product.id, 1);
      console.log("Added to cart.");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${slug}`} className="block" aria-label={`View ${title}`}>
        <div className="relative h-56 overflow-hidden rounded-t-3xl bg-gray-100">
          <Image
            src={resolvedImage}
            alt={resolvedAlt}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>
      </Link>

      <div className="flex flex-col gap-4 px-5 pb-6 pt-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Creality Kuwait
          </p>
          <h3 className="text-base font-semibold text-text">{title}</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-text">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-gray-500">
            {inStock ? "In stock" : "Unavailable"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || loading}
          aria-disabled={!inStock || loading}
          aria-label={`Add ${title} to cart`}
          className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${inStock
              ? "bg-[#6BBE45] text-white hover:bg-[#5AA73C]"
              : "cursor-not-allowed border border-gray-200 text-gray-400"
            }`}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
