"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";

type QuantityMap = Record<string, number>;

const formatPrice = (value: number | string | undefined) => {
  if (value === undefined || value === null) {
    return "-";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-KW", {
      style: "currency",
      currency: "KWD",
      minimumFractionDigits: 2,
    }).format(value);
  }
  return value;
};

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const checkoutUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_WC_BASE_URL ?? "";
    return baseUrl ? `${baseUrl}/site/checkout` : "";
  }, []);

  useEffect(() => {
    if (!cart?.items) {
      setQuantities({});
      return;
    }
    const next: QuantityMap = {};
    cart.items.forEach((item: { key: string; quantity: number }) => {
      next[item.key] = item.quantity;
    });
    setQuantities(next);
  }, [cart]);

  const handleQuantityChange = async (key: string, value: number) => {
    const safeValue = Number.isFinite(value) && value > 0 ? value : 1;
    setQuantities((prev) => ({ ...prev, [key]: safeValue }));
    await updateItem(key, safeValue);
  };

  const handleCheckout = () => {
    if (!checkoutUrl) {
      console.error("NEXT_PUBLIC_WC_BASE_URL is not set.");
      return;
    }
    window.location.href = checkoutUrl;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <div className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Cart</p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
          Your cart
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {cart?.items?.length ? (
            cart.items.map(
              (item: {
                key: string;
                quantity: number;
                name: string;
                price: number | string;
                images?: Array<{ src: string; alt?: string }>;
              }) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                      src={item.images?.[0]?.src ?? "/placeholder.png"}
                      alt={item.images?.[0]?.alt ?? item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-400">Creality Kuwait</p>
                    <h2 className="text-base font-semibold text-text">{item.name}</h2>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="sr-only" htmlFor={`qty-${item.key}`}>
                      Quantity
                    </label>
                    <input
                      id={`qty-${item.key}`}
                      type="number"
                      min={1}
                      value={quantities[item.key] ?? item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.key, Number(event.target.value))
                      }
                      className="h-11 w-24 rounded-2xl border border-gray-200 px-3 text-sm text-text focus:border-black focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-sm font-semibold text-gray-500 transition hover:text-black"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center text-sm text-gray-500">
              Your cart is empty.
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text">Summary</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(cart?.totals?.total_items)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500">
              <span>Estimated total</span>
              <span>{formatPrice(cart?.totals?.total_price)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={!cart?.items?.length || loading || !checkoutUrl}
            className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Proceed to Checkout
          </button>
          <p className="mt-3 text-xs text-gray-400">
            Checkout opens on Creality Kuwait.
          </p>
        </aside>
      </div>
    </div>
  );
}
