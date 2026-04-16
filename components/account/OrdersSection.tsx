"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  RotateCcw,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/price";
import type { ApiResponse, WooOrder } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; orders: WooOrder[] };

type OrdersSectionProps = {
  variant?: "dashboard" | "page";
  initialOrders?: WooOrder[];
};

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
  "out-for-delivery": {
    label: "Out for Delivery",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Truck,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Truck,
  },
};

const TIMELINE_STEPS = [
  "Order placed",
  "Processing",
  "Out for delivery",
  "Delivered",
] as const;

const TRACKING_STYLE: Record<string, string> = {
  in_stock: "border-emerald-200 bg-emerald-50 text-emerald-700",
  preorder: "border-amber-200 bg-amber-50 text-amber-700",
  special_order: "border-orange-200 bg-orange-50 text-orange-700",
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

const resolveOrderDate = (order: WooOrder) => order.date_created ?? order.date ?? "";

const formatCountdown = (daysLeft: number | null | undefined) => {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft <= 0) return "Due today";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
};

export default function OrdersSection({
  variant = "dashboard",
  initialOrders,
}: OrdersSectionProps) {
  const isPage = variant === "page";
  const router = useRouter();
  const [state, setState] = useState<LoadState>(
    initialOrders
      ? { status: "success", orders: initialOrders }
      : { status: "loading" }
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reordering, setReordering] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<
    | {
        type: "success" | "error";
        text: string;
      }
    | null
  >(null);
  const didFetch = useRef(!!initialOrders);

  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/account/orders", {
        cache: "no-store",
        signal,
      });
      const data = (await response.json()) as ApiResponse<WooOrder[]>;

      if (!response.ok || !data.success) {
        setState({
          status: "error",
          message: data.success ? "Unable to load orders." : data.error,
        });
        return;
      }

      setState({ status: "success", orders: data.data });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load orders.",
      });
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!didFetch.current) {
      didFetch.current = true;
      void fetchOrders(controller.signal);
    }

    // Re-fetch when the tab regains focus so order statuses stay in sync with WooCommerce
    const handleFocus = () => void fetchOrders(controller.signal);
    window.addEventListener("focus", handleFocus);


    return () => {
      controller.abort();
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReorder = async (order: WooOrder) => {
    if (!order.line_items?.length) return;

    try {
      setReordering(order.id);
      setFeedback(null);

      for (const item of order.line_items) {
        await addToCart(item.product_id, item.quantity);
      }

      if (isPage) {
        setFeedback({
          type: "success",
          text: `Order #${order.id} items added to cart. Redirecting...`,
        });
        window.setTimeout(() => {
          router.push("/cart");
        }, 1000);
      } else {
        setFeedback({
          type: "success",
          text: `Order #${order.id} items added to cart.`,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to add items to cart.",
      });
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="space-y-4">
      {isPage ? (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
          <p className="mt-2 text-sm text-gray-500">
            Track delivery progress, review timelines, and reorder past purchases.
          </p>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {state.status === "loading" ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5"
            >
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-5 w-32 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.orders.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center ${
            isPage ? "space-y-4" : ""
          }`}
        >
          <p className="text-sm text-gray-500">
            No orders yet. Your purchase history will appear here.
          </p>
          {isPage ? (
            <Link
              href="/store"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <ShoppingCart className="h-4 w-4" />
              Browse Store
            </Link>
          ) : null}
        </div>
      ) : null}

      {state.status === "success" && state.orders.length > 0 ? (
        <div className="space-y-3">
          {state.orders.map((order) => {
            const isExpanded = expanded === order.id;
            const isCancelled = order.status === "cancelled";
            const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const tracking = order.tracking;
            const countdownText = formatCountdown(tracking?.days_left);
            const orderDate = resolveOrderDate(order);

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((current) => (current === order.id ? null : order.id))
                    }
                    className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
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

                      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>Date: {formatDate(orderDate)}</span>
                            <span>Total: {formatPrice(order.total)}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                TRACKING_STYLE[tracking?.type ?? ""] ??
                                "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              {tracking?.delivery_message ?? "Delivery details unavailable"}
                            </span>
                            {tracking?.show_countdown && countdownText ? (
                              <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                                {countdownText}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {TIMELINE_STEPS.map((step, index) => {
                              const activeStep = tracking?.timeline_step ?? 0;
                              const isComplete = index <= activeStep;
                              const isCurrent = index === activeStep;

                              return (
                                <div key={step} className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        isComplete ? "bg-black" : "bg-gray-200"
                                      } ${isCurrent ? "ring-4 ring-gray-200" : ""}`}
                                    />
                                    <span
                                      className={`text-[11px] font-medium leading-4 ${
                                        isComplete ? "text-gray-900" : "text-gray-400"
                                      }`}
                                    >
                                      {step}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCancelled ? (
                        <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          Cancelled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/support?orderId=${order.id}`);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Request Support
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
                      <div className="space-y-3">
                        {(order.line_items ?? []).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                              <SmartImage
                                src={item.image?.src ?? "/images/product-placeholder.svg"}
                                alt={item.name}
                                mode="product"
                                sizes="48px"
                                className="rounded-none"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.total)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={reordering === order.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {reordering === order.id ? "Adding..." : "Reorder Items"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {isPage ? (
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
      ) : null}
    </div>
  );
}
