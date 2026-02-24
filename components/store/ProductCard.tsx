"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import useCompare from "@/components/compare/useCompare";

type StoreProductImage = {
  id?: number;
  src?: string | null;
  alt?: string | null;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  formatted_price?: string | null;
  price_html?: string | null;
  short_description?: string | null;
  purchasable: boolean;
  stock_status: string;
  images: StoreProductImage[];
  categories?: Array<{ id?: number; slug?: string | null }>;
};

type StoreProductCardProps = {
  product: StoreProduct;
};

const fallbackImage = "/images/product-placeholder.svg";

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

export default function StoreProductCard({ product }: StoreProductCardProps) {
  const { addItem } = useCart();
  const { isSelected, toggleItem, canAddMore } = useCompare();
  const [loading, setLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  const resolvedImage = product.images?.[0]?.src ?? fallbackImage;
  const shortDescription = product.short_description
    ? stripHtml(product.short_description).slice(0, 72)
    : "Precision-ready hardware";
  const isAvailable = product.purchasable && product.stock_status === "instock";
  const priceMarkup = product.formatted_price ?? product.price_html ?? product.price;

  // Determine if this is a printer (for compare feature)
  const isPrinter = useMemo(() => {
    const slugs = (product.categories ?? [])
      .map((c) => c.slug?.toLowerCase() ?? "")
      .filter(Boolean);
    return slugs.some((s) =>
      ["printer", "printers", "fdm", "resin", "k1", "ender", "halot", "cr"].some((t) =>
        s.includes(t)
      )
    );
  }, [product.categories]);

  const isCompared = isSelected(product.id);

  const handleAddToCart = async () => {
    if (!product.id || !isAvailable || loading) return;
    try {
      setLoading(true);
      await addItem(product.id, 1);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    const result = toggleItem({
      id: product.id,
      name: product.name,
      image: resolvedImage,
    });
    if (!result.ok) {
      setCompareError(result.reason ?? "Max 4 products");
      setTimeout(() => setCompareError(""), 2200);
    }
  };

  return (
    <article className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-gray-50">
          <Image
            src={resolvedImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
          {/* Stock badge — top right corner */}
          <div className="absolute right-2.5 top-2.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAvailable
                  ? "bg-white/90 text-green-700"
                  : "bg-white/90 text-gray-500"
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

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        {/* Name + short description */}
        <div className="flex-1">
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#0b0b0b] transition hover:text-black/70 sm:text-[15px]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 truncate text-[12px] text-gray-400">{shortDescription}</p>
        </div>

        {/* Price row */}
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="text-[16px] font-semibold text-[#0b0b0b] sm:text-[18px]"
            dangerouslySetInnerHTML={{ __html: priceMarkup }}
          />
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable || loading}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-150 active:scale-[0.98] ${isAvailable
              ? "bg-[#0b0b0b] text-white hover:bg-black/80"
              : "cursor-not-allowed border border-gray-200 text-gray-400"
            }`}
        >
          {loading ? "Adding…" : "Add to cart"}
        </button>

        {/* Compare — only for printers */}
        {isPrinter && (
          <div>
            <button
              type="button"
              onClick={handleCompare}
              disabled={!isCompared && !canAddMore}
              className={`w-full rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition duration-150 ${isCompared
                  ? "border-[#0b0b0b] text-[#0b0b0b]"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 disabled:cursor-not-allowed disabled:text-gray-300"
                }`}
            >
              {isCompared ? "✓ Comparing" : "Compare"}
            </button>
            {compareError && (
              <p className="mt-1 text-center text-[11px] text-amber-600">
                {compareError}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
