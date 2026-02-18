"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import type { WCProduct } from "@/lib/api";

type ProductDetailProps = {
  product: WCProduct & {
    short_description?: string | null;
    stock_quantity?: number | null;
    related_ids?: number[] | null;
    attributes?: Array<{
      id: number;
      name: string;
      options: string[];
    }>;
  };
};

type RelatedProduct = WCProduct;

type ActiveTab = "description" | "specs";

const formatPrice = (value: string) => {
  if (!value) {
    return "-";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return new Intl.NumberFormat("en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 2,
  }).format(numeric);
};

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0]?.src ?? "/placeholder.png"
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const isInStock = product.in_stock;
  const stockQuantity = product.stock_quantity ?? 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 3;
  const mainImage = selectedImage || product.images?.[0]?.src || "/placeholder.png";
  const canAdd = useMemo(() => isInStock && !adding, [isInStock, adding]);

  useEffect(() => {
    const ids = product.related_ids ?? [];
    if (!ids.length) {
      setRelatedProducts([]);
      return;
    }

    let isActive = true;
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const response = await fetch(`/api/store/products?include=${ids.join(",")}`);
        const data = await response.json();
        const products = Array.isArray(data) ? data : data?.products ?? [];
        if (isActive) {
          setRelatedProducts(products.slice(0, 4));
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
  }, [product.related_ids]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addItem(product.id, quantity);
    } catch {
      // Intentionally silent in production layout
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setAdding(true);
      await addItem(product.id, quantity);
      window.location.href = "/cart";
    } catch {
      // Intentionally silent in production layout
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-28 pt-12 sm:pt-16 lg:pb-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="group overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="relative aspect-[4/3] w-full bg-gray-100">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition duration-500 ease-out group-hover:scale-105"
                priority
              />
            </div>
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image) => {
                const isActive = selectedImage === image.src;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.src)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                      isActive ? "border-black" : "border-border"
                    }`}
                    aria-label={`View ${product.name} image`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="80px"
                      className="object-cover transition duration-300"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Creality Kuwait
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-text">
              {product.name}
            </h1>
            <p className="mt-2 text-2xl font-bold text-text">
              {formatPrice(product.price)}
            </p>

            <div className="mt-3">
              {isLowStock ? (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                  Low Stock
                </span>
              ) : isInStock ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            {product.short_description && (
              <div
                className="prose prose-sm mt-4 max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-11 w-11 rounded-l-xl text-lg font-semibold text-gray-500 transition hover:text-black"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="min-w-[48px] text-center text-sm font-semibold text-text">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="h-11 w-11 rounded-r-xl text-lg font-semibold text-gray-500 transition hover:text-black"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAdd}
                className="w-full rounded-xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {adding ? "Adding..." : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className="w-full rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-text transition hover:border-black disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Buy now
              </button>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-12 rounded-2xl bg-gray-50 px-6 py-8">
        <div className="grid gap-6 text-center sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xl">??</p>
            <p className="text-sm font-semibold text-text">Fast Shipping</p>
          </div>
          <div className="space-y-2">
            <p className="text-xl">??</p>
            <p className="text-sm font-semibold text-text">1 Year Warranty</p>
          </div>
          <div className="space-y-2">
            <p className="text-xl">??</p>
            <p className="text-sm font-semibold text-text">Secure Payment</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`pb-3 transition ${
                activeTab === "description"
                  ? "border-b-2 border-black text-text"
                  : "text-gray-500"
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`pb-3 transition ${
                activeTab === "specs"
                  ? "border-b-2 border-black text-text"
                  : "text-gray-500"
              }`}
            >
              Specifications
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          {activeTab === "description" ? (
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.description ?? "" }}
            />
          ) : (
            <div className="space-y-4">
              {product.attributes && product.attributes.length > 0 ? (
                product.attributes.map((attribute) => (
                  <div key={attribute.id} className="flex flex-wrap gap-2">
                    <span className="w-40 text-sm font-semibold text-text">
                      {attribute.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {attribute.options.join(", ")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Specifications will be added soon.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-text">You may also like</h2>
        </div>
        {relatedLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-gray-500">
            Loading related products...
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-gray-500">
            No related products available.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((related) => (
              <ProductCard
                key={related.id}
                imageUrl={related.images?.[0]?.src ?? ""}
                product={{ id: related.id, images: related.images }}
                title={related.name}
                price={Number(related.price)}
                slug={related.slug}
                inStock={related.in_stock}
                onAddToCart={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              Price
            </p>
            <p className="text-lg font-semibold text-text">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="flex-1 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {adding ? "Adding..." : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
