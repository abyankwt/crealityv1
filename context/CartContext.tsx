"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCart,
  addToCart as apiAddToCart,
  removeCartItem as apiRemoveItem,
  updateCartItem as apiUpdateItem,
  type CartResponse,
  type CartItem,
  type CartTotals,
  type CartItemTotals,
  type CartItemImage,
} from "@/lib/cart";

/* ── Re-export types for consumers ── */
export type { CartResponse, CartItem, CartTotals, CartItemTotals, CartItemImage };

export type Cart = CartResponse;

/* ── Context shape ── */

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateItem: (key: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

/* ── Provider ── */

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to refresh cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await apiAddToCart(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to add item:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const updatedCart = await apiRemoveItem(key);
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to remove item:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (key: string, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await apiUpdateItem(key, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to update item:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const itemCount = cart?.items_count ?? 0;

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      refreshCart,
      addItem,
      removeItem,
      updateItem,
    }),
    [cart, loading, itemCount, refreshCart, addItem, removeItem, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ── Hook ── */

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
