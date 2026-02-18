"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

type ProductAddToCartProps = {
  productId: number;
  disabled?: boolean;
};

export default function ProductAddToCart({
  productId,
  disabled = false,
}: ProductAddToCartProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    try {
      setIsAdding(true);
      await addItem(productId, 1);
      alert("Added to cart.");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled || isAdding}
      className="w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      aria-label="Add to cart"
    >
      Add to cart
    </button>
  );
}
