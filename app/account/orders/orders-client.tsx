"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { ApiResponse, WooOrder } from "@/lib/types";
import { addToCart } from "@/lib/cart";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; orders: WooOrder[] };

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Package,
  },
  "on-hold": {
    label: "On Hold",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: Ban,
  },
  refunded: {
    label: "Refunded",
    color: "bg-gray-50 text-gray-600 border-gray-200",
    icon: RotateCcw,
  },
  failed: {
    label: "Failed",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  shipped: {
    label: "Shipped",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Truck,
  },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function OrdersClient() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [reordering, setReordering] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/account/orders", { cache: "no-store" });
      const data = (await response.json()) as ApiResponse<WooOrder[]>;
      if (!response.ok || !data.success) {
        const message = data.success ? "Unable to load orders." : data.error;
        setState({ status: "error", message });
        return;
      }
      setState({ status: "success", orders: data.data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load orders.";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleExpand = (orderId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleReorder = async (order: WooOrder) => {
    if (!order.line_items?.length) return;
    setReordering(order.id);
    setActionMsg(null);
    try {
      for (const item of order.line_items) {
        await addToCart(item.product_id, item.quantity);
      }
      setActionMsg({ type: "success", text: "Items added to cart! Redirecting..." });
      setTimeout(() => {
        window.location.href = "/cart";
      }, 1000);
    } catch {
      setActionMsg({
        type: "error",
        text: "Some items could not be added to cart.",
      });
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
        <p className="mt-2 text-sm text-gray-500">
          Track your purchases, view details, or reorder.
        </p>
      </div>

      {actionMsg ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionMsg.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {actionMsg.text}
        </div>
      ) : null}

      {state.status === "loading" ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <Package className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">
            No orders yet. Start shopping to see your order history here.
          </p>
          <Link
            href="/store"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <ShoppingCart className="h-4 w-4" />
            Browse Store
          </Link>
        </div>
      ) : null}

      {state.status === "success" && state.orders.length > 0 ? (
        <div className="space-y-4">
          {state.orders.map((order) => {
            const isExpanded = expanded.has(order.id);
            const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const hasItems = (order.line_items?.length ?? 0) > 0;
            const isCancelled = order.status === "cancelled";

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(order.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Order ID #{order.id}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusConf.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Date: {formatDate(order.date)}</span>
                      <span>Price: {order.currency} {order.total}</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {isExpanded ? (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {hasItems ? (
                      <div className="mb-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Items
                        </h4>
                        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                          {order.line_items!.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              {item.image?.src ? (
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                                  <Image
                                    src={item.image.src}
                                    alt={item.name}
                                    fill
                                    sizes="40px"
                                    className="object-contain p-0.5"
                                  />
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.currency} {item.total}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {order.billing || order.shipping ? (
                      <div className="mb-4 grid gap-4 sm:grid-cols-2">
                        {order.billing ? (
                          <div>
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Billing
                            </h4>
                            <p className="text-sm text-gray-700">
                              {order.billing.first_name} {order.billing.last_name}
                              <br />
                              {order.billing.address_1}
                              {order.billing.address_2
                                ? `, ${order.billing.address_2}`
                                : ""}
                              <br />
                              {order.billing.city}
                              {order.billing.postcode
                                ? `, ${order.billing.postcode}`
                                : ""}
                              <br />
                              {order.billing.country}
                              {order.billing.phone ? (
                                <>
                                  <br />
                                  {order.billing.phone}
                                </>
                              ) : null}
                            </p>
                          </div>
                        ) : null}
                        {order.shipping && order.shipping.address_1 ? (
                          <div>
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Shipping
                            </h4>
                            <p className="text-sm text-gray-700">
                              {order.shipping.first_name} {order.shipping.last_name}
                              <br />
                              {order.shipping.address_1}
                              {order.shipping.address_2
                                ? `, ${order.shipping.address_2}`
                                : ""}
                              <br />
                              {order.shipping.city}
                              {order.shipping.postcode
                                ? `, ${order.shipping.postcode}`
                                : ""}
                              <br />
                              {order.shipping.country}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      {hasItems ? (
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={reordering === order.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {reordering === order.id ? "Adding..." : "Reorder"}
                        </button>
                      ) : null}
                      {isCancelled ? (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          Cancelled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push(`/support?orderId=${order.id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          Request Support
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Back to dashboard
        </Link>
        <Link
          href="/store"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
