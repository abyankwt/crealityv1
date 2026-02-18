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
import { addToCart, fetchCart, removeCartItem, updateCartItem } from "@/lib/cart";

type CartContextValue = {
  cart: any;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateItem: (key: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    setLoading(true);
    try {
      const data = await addToCart(productId, quantity);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const data = await removeCartItem(key);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (key: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await updateCartItem(key, quantity);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refreshCart,
      addItem,
      removeItem,
      updateItem,
    }),
    [cart, loading, refreshCart, addItem, removeItem, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
