"use client";

import { useEffect, useState } from "react";
import type { ProductOrderType } from "@/lib/woocommerce-types";

type ProductActionButtonProps = {
  product_order_type: ProductOrderType;
  productName: string;
  loading?: boolean;
  added?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  onAddToCart?: () => void | Promise<void>;
  onSpecialOrder?: () => void;
  onPreOrder?: () => void;
};

const PRE_ORDER_BLOCK_MESSAGE =
  "This is a pre-order item. Visit /pre-orders to reserve it.";

const BUTTON_STYLES: Record<ProductOrderType, string> = {
  in_stock:
    "bg-[#22C55E] hover:bg-[#16A34A]",
  special_order:
    "bg-[#F97316] hover:bg-[#EA580C]",
  pre_order:
    "bg-gradient-to-r from-[#9333EA] to-[#7E22CE] hover:from-[#7E22CE] hover:to-[#6B21A8]",
};

const BUTTON_LABELS: Record<ProductOrderType, string> = {
  in_stock: "Add to Cart",
  special_order: "Special Order",
  pre_order: "Pre-Order",
};

const SHIPPING_MESSAGES: Partial<Record<ProductOrderType, string>> = {
  pre_order: "Delivery: ~45 days",
};

export default function ProductActionButton({
  product_order_type,
  productName,
  loading = false,
  added = false,
  disabled = false,
  disabledMessage,
  onAddToCart,
  onSpecialOrder,
  onPreOrder,
}: ProductActionButtonProps) {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product_order_type !== "pre_order") {
      setBlockedMessage(null);
    }
  }, [product_order_type]);

  const handleClick = async () => {
    if (loading || disabled) {
      return;
    }

    if (product_order_type === "in_stock") {
      await onAddToCart?.();
      return;
    }

    if (product_order_type === "special_order") {
      onSpecialOrder?.();
      return;
    }

    if (onPreOrder) {
      onPreOrder();
      return;
    }

    setBlockedMessage(PRE_ORDER_BLOCK_MESSAGE);
  };

  const buttonLabel =
    disabled
      ? "Max Stock Reached"
      : product_order_type === "in_stock"
      ? loading
        ? "Adding..."
        : added
        ? "Added"
        : BUTTON_LABELS[product_order_type]
      : BUTTON_LABELS[product_order_type];

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        aria-label={`${BUTTON_LABELS[product_order_type]} for ${productName}`}
        className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition duration-150 ${
          disabled
            ? "cursor-not-allowed bg-gray-300"
            : BUTTON_STYLES[product_order_type]
        }`}
      >
        {buttonLabel}
      </button>

      {disabledMessage && (
        <p className="text-[12px] text-gray-400">{disabledMessage}</p>
      )}

      {SHIPPING_MESSAGES[product_order_type] && !disabled ? (
        <p className="text-[12px] text-[#6b7280]">
          {SHIPPING_MESSAGES[product_order_type]}
        </p>
      ) : null}

      {blockedMessage && (
        <p className="text-[12px] text-[#9333EA]">{blockedMessage}</p>
      )}
    </div>
  );
}
