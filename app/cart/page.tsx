"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import OrderWarningModal from "@/components/OrderWarningModal";
import SmartImage from "@/components/SmartImage";
import { useCart } from "@/context/CartContext";
import { formatKWD } from "@/lib/formatCurrency";
import {
    requiresOrderWarning,
    type ProductAvailability,
} from "@/lib/availability";

export default function CartPage() {
    const router = useRouter();
    const { cart, loading, removeItem, updateItem, itemCount } = useCart();
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningAccepted, setWarningAccepted] = useState(false);

    const decodeHtml = (html: string) => {
        if (typeof document === "undefined") return html;
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const parseMinorUnits = (minorUnits: string, decimals = 3) =>
        Number(minorUnits) / Math.pow(10, decimals);

    const minorUnit = cart?.totals?.currency_minor_unit ?? 3;

    if (!cart && loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
                    Your Cart
                </h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className="h-24 animate-pulse rounded-xl bg-gray-100"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const items = cart?.items ?? [];

    if (!cart) return null;

    const protectedItems = items.filter((item) =>
        item.availability ? requiresOrderWarning(item.availability) : false
    );

    const primaryWarningAvailability: ProductAvailability =
        protectedItems[0]?.availability ?? {
            type: "special",
            label: "Special Order",
            badge: "Special Order",
            leadTime: "10-12 days",
        };

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                    Your cart is empty
                </h1>
                <p className="mb-8 text-sm text-gray-500">
                    Browse our products and add items to your cart.
                </p>
                <Link
                    href="/store"
                    className="inline-flex items-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
                Your Cart
                <span className="ml-2 text-base font-normal text-gray-500">
                    ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
            </h1>

            <div className="divide-y divide-gray-200 border-y border-gray-200">
                {items.map((item) => {
                    const imageSrc =
                        item.images?.[0]?.thumbnail ||
                        item.images?.[0]?.src ||
                        "/images/product-placeholder.svg";
                    const lineTotal = formatKWD(parseMinorUnits(
                        item.totals?.line_total ?? "0",
                        minorUnit
                    ));
                    const unitPrice = item.prices
                        ? formatKWD(
                              parseMinorUnits(
                                  item.prices.price,
                                  item.prices.currency_minor_unit ?? minorUnit
                              )
                          )
                        : null;
                    const min = item.quantity_limits?.minimum ?? 1;
                    const max = item.quantity_limits?.maximum ?? 999;

                    return (
                        <div key={item.key} className="flex gap-4 py-6 sm:gap-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-28">
                                <SmartImage
                                    src={imageSrc}
                                    alt={item.name}
                                    mode="product"
                                    sizes="112px"
                                    className="rounded-none"
                                />
                            </div>

                            <div className="flex flex-1 flex-col justify-between">
                                <div className="flex justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                                            {decodeHtml(item.name)}
                                        </h3>
                                        {item.availability && (
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <AvailabilityBadge availability={item.availability} />
                                                {item.availability.type !== "available" &&
                                                    item.availability.leadTime && (
                                                    <span className="text-xs text-gray-500">
                                                        Lead time: {item.availability.leadTime}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {unitPrice && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {unitPrice} each
                                            </p>
                                        )}
                                    </div>
                                    <p className="whitespace-nowrap text-sm font-semibold text-gray-900 sm:text-base">
                                        {lineTotal}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateItem(item.key, Math.max(min, item.quantity - 1))
                                            }
                                            disabled={loading || item.quantity <= min}
                                            className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="flex h-9 w-10 items-center justify-center border-x border-gray-200 text-sm font-medium text-gray-900">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateItem(item.key, Math.min(max, item.quantity + 1))
                                            }
                                            disabled={loading || item.quantity >= max}
                                            className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.key)}
                                        disabled={loading}
                                        className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-red-600 disabled:opacity-40"
                                        aria-label={`Remove ${item.name}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-gray-900">
                            {formatKWD(parseMinorUnits(cart.totals?.total_items ?? "0", minorUnit))}
                        </span>
                    </div>
                    {Number(cart.totals?.total_shipping ?? 0) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Shipping</span>
                            <span className="font-medium text-gray-900">
                                {formatKWD(parseMinorUnits(cart.totals.total_shipping, minorUnit))}
                            </span>
                        </div>
                    )}
                    {Number(cart.totals?.total_discount ?? 0) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">
                                -{formatKWD(parseMinorUnits(cart.totals.total_discount, minorUnit))}
                            </span>
                        </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-base font-bold text-gray-900">
                            <span>Total</span>
                            <span>
                                {formatKWD(parseMinorUnits(cart.totals?.total_price ?? "0", minorUnit))}
                            </span>
                        </div>
                    </div>
                </div>

                {protectedItems.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        Special order and pre-order items require policy confirmation before checkout.
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        if (protectedItems.length > 0) {
                            setWarningAccepted(false);
                            setWarningOpen(true);
                            return;
                        }
                        router.push("/checkout");
                    }}
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-black px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    {loading ? "Processing..." : "Proceed to Checkout"}
                </button>

                <Link
                    href="/store"
                    className="mt-3 block text-center text-sm text-gray-500 transition hover:text-gray-700"
                >
                    ← Continue Shopping
                </Link>
            </div>

            <OrderWarningModal
                open={warningOpen}
                availability={primaryWarningAvailability}
                acknowledged={warningAccepted}
                onAcknowledgedChange={setWarningAccepted}
                onClose={() => setWarningOpen(false)}
                onConfirm={() => {
                    setWarningOpen(false);
                    router.push("/checkout?warning=accepted");
                }}
            />
        </div>
    );
}
