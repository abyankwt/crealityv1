"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import useCompare from "@/components/compare/useCompare";

type ProductImage = {
  src?: string | null;
  alt?: string | null;
};

type ProductCardProps = {
  imageUrl?: string | null;
  product?: {
    id?: number | null;
    images?: ProductImage[] | null;
    purchasable?: boolean | null;
    stock_status?: string | null;
    categories?: Array<{ slug?: string | null }> | null;
  } | null;
  title: string;
  price: number;
  slug: string;
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
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isSelected, toggleItem, canAddMore } = useCompare();
  const [loading, setLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState("");
  const resolvedImage = product?.images?.[0]?.src || fallbackImage;
  const resolvedAlt = title;
  const isAvailable = Boolean(
    product?.purchasable && product?.stock_status === "instock"
  );
  const isPrinter = useMemo(() => {
    const slugs: string[] =
      (product?.categories
        ?.map((category) => category.slug?.toLowerCase())
        .filter((s): s is string => typeof s === "string") ?? []);
    return slugs.some((slug) =>
      ["printer", "printers", "fdm", "resin", "k1", "ender", "cr", "halot"].some(
        (token) => slug.includes(token)
      )
    );
  }, [product?.categories]);
  const isCompared = product?.id ? isSelected(product.id) : false;

  const handleAddToCart = async (): Promise<void> => {
    if (!product?.id) {
      console.error("Missing product id for add to cart.");
      return;
    }

    try {
      setLoading(true);
      await addItem(product.id, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (!product?.id) return;
    const response = toggleItem({
      id: product.id,
      name: title,
      image: resolvedImage,
    });
    if (!response.ok) {
      setCompareError(response.reason ?? "Compare limit reached.");
      window.setTimeout(() => setCompareError(""), 2000);
    }
  };

  return (
    <article className="group rounded-3xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
      <Link href={`/product/${slug}`} className="block" aria-label={`View ${title}`}>
        <div className="relative h-44 overflow-hidden rounded-t-3xl bg-gray-100 md:h-56">
          <Image
            src={resolvedImage}
            alt={resolvedAlt}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {/* Stock badge — top right */}
          <div className="absolute right-2.5 top-2.5 z-10">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold ${isAvailable ? "text-green-700" : "text-gray-500"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-gray-400"
                  }`}
              />
              {isAvailable ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-2.5 px-3.5 pb-4 pt-3.5 md:gap-3 md:px-4 md:pb-5 md:pt-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Creality Kuwait
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text md:text-base">{title}</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-text md:text-xl">
            {formatPrice(price)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable || loading}
          aria-disabled={!isAvailable || loading}
          aria-label={`Add ${title} to cart`}
          className={`mt-auto w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-150 ${isAvailable
              ? "bg-[#6BBE45] text-white hover:bg-[#5AA73C]"
              : "cursor-not-allowed border border-gray-200 bg-transparent text-gray-400"
            }`}
        >
          {loading ? "Adding…" : "Add to cart"}
        </button>

        {isPrinter && product?.id && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleCompare}
              disabled={!isCompared && !canAddMore}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition duration-150 hover:border-gray-400 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              {isCompared ? "✓ Comparing" : "Compare"}
            </button>
            {compareError && (
              <p className="text-center text-[11px] text-amber-600">
                {compareError}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
