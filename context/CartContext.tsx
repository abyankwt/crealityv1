"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCart,
  addToCart as apiAddToCart,
  removeCartItem as apiRemoveItem,
  updateCartItem as apiUpdateItem,
  CartConflictError,
  type CartResponse,
  type CartItem,
  type CartTotals,
  type CartItemTotals,
  type CartItemImage,
} from "@/lib/cart";
import type { ProductAvailability } from "@/lib/availability";

export type { CartResponse, CartItem, CartTotals, CartItemTotals, CartItemImage };

export type Cart = CartResponse;

export type OptimisticAddItem = {
  id: number;
  name: string;
  images?: CartItemImage[];
  prices?: Partial<NonNullable<CartItem["prices"]>>;
  availability?: ProductAvailability;
  permalink?: string;
  sku?: string;
  short_description?: string;
  description?: string;
  quantity_limits?: CartItem["quantity_limits"];
};

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (
    productId: number,
    quantity: number,
    options?: { optimisticItem?: OptimisticAddItem }
  ) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateItem: (key: string, quantity: number) => Promise<void>;
  isItemPending: (key: string) => boolean;
  isProductPending: (productId: number) => boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const REFRESH_DEBOUNCE_MS = 150;

function toMinorUnits(value?: string | null) {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fromMinorUnits(value: number) {
  return Math.max(0, Math.round(value)).toString();
}

function estimateUnitTotals(item: CartItem) {
  const quantity = Math.max(item.quantity, 1);
  const unitSubtotal =
    toMinorUnits(item.prices?.raw_prices?.price) ||
    toMinorUnits(item.prices?.price) ||
    Math.round(toMinorUnits(item.totals.line_subtotal) / quantity);
  const unitTotal =
    Math.round(toMinorUnits(item.totals.line_total) / quantity) || unitSubtotal;
  const unitSubtotalTax = Math.round(
    toMinorUnits(item.totals.line_subtotal_tax) / quantity
  );
  const unitTotalTax = Math.round(toMinorUnits(item.totals.line_total_tax) / quantity);

  return {
    unitSubtotal,
    unitTotal,
    unitSubtotalTax,
    unitTotalTax,
  };
}

function withQuantity(item: CartItem, quantity: number) {
  const { unitSubtotal, unitTotal, unitSubtotalTax, unitTotalTax } =
    estimateUnitTotals(item);

  return {
    ...item,
    quantity,
    totals: {
      ...item.totals,
      line_subtotal: fromMinorUnits(unitSubtotal * quantity),
      line_subtotal_tax: fromMinorUnits(unitSubtotalTax * quantity),
      line_total: fromMinorUnits(unitTotal * quantity),
      line_total_tax: fromMinorUnits(unitTotalTax * quantity),
    },
  };
}

function applyTotalsDelta(
  totals: CartTotals,
  delta: {
    items: number;
    itemsTax: number;
    price: number;
    tax: number;
  }
) {
  return {
    ...totals,
    total_items: fromMinorUnits(toMinorUnits(totals.total_items) + delta.items),
    total_items_tax: fromMinorUnits(
      toMinorUnits(totals.total_items_tax) + delta.itemsTax
    ),
    total_price: fromMinorUnits(toMinorUnits(totals.total_price) + delta.price),
    total_tax: fromMinorUnits(toMinorUnits(totals.total_tax) + delta.tax),
  };
}

function buildOptimisticCartItem(
  productId: number,
  quantity: number,
  optimisticItem: OptimisticAddItem
): CartItem {
  const unitPrice =
    toMinorUnits(optimisticItem.prices?.raw_prices?.price) ||
    toMinorUnits(optimisticItem.prices?.price);

  return {
    key: `optimistic:${productId}`,
    id: productId,
    quantity,
    name: optimisticItem.name,
    short_description: optimisticItem.short_description,
    description: optimisticItem.description,
    sku: optimisticItem.sku,
    permalink: optimisticItem.permalink,
    images: optimisticItem.images ?? [],
    totals: {
      line_subtotal: fromMinorUnits(unitPrice * quantity),
      line_subtotal_tax: "0",
      line_total: fromMinorUnits(unitPrice * quantity),
      line_total_tax: "0",
    },
    prices: optimisticItem.prices
      ? {
          price: optimisticItem.prices.price ?? "0",
          regular_price:
            optimisticItem.prices.regular_price ??
            optimisticItem.prices.price ??
            "0",
          sale_price: optimisticItem.prices.sale_price ?? "0",
          ...optimisticItem.prices,
        }
      : undefined,
    availability: optimisticItem.availability,
    quantity_limits: optimisticItem.quantity_limits,
  };
}

function applyOptimisticAdd(
  currentCart: Cart,
  productId: number,
  quantity: number,
  optimisticItem?: OptimisticAddItem
) {
  const existingItem = currentCart.items.find((item) => item.id === productId);

  if (existingItem) {
    const nextItem = withQuantity(existingItem, existingItem.quantity + quantity);
    const previousLineSubtotal = toMinorUnits(existingItem.totals.line_subtotal);
    const nextLineSubtotal = toMinorUnits(nextItem.totals.line_subtotal);
    const previousLineSubtotalTax = toMinorUnits(existingItem.totals.line_subtotal_tax);
    const nextLineSubtotalTax = toMinorUnits(nextItem.totals.line_subtotal_tax);
    const previousLineTotal = toMinorUnits(existingItem.totals.line_total);
    const nextLineTotal = toMinorUnits(nextItem.totals.line_total);
    const previousLineTotalTax = toMinorUnits(existingItem.totals.line_total_tax);
    const nextLineTotalTax = toMinorUnits(nextItem.totals.line_total_tax);

    return {
      ...currentCart,
      items: currentCart.items.map((item) =>
        item.key === existingItem.key ? nextItem : item
      ),
      items_count: currentCart.items_count + quantity,
      totals: applyTotalsDelta(currentCart.totals, {
        items: nextLineSubtotal - previousLineSubtotal,
        itemsTax: nextLineSubtotalTax - previousLineSubtotalTax,
        price: nextLineTotal - previousLineTotal,
        tax: nextLineTotalTax - previousLineTotalTax,
      }),
    };
  }

  if (!optimisticItem) {
    return {
      ...currentCart,
      items_count: currentCart.items_count + quantity,
    };
  }

  const nextItem = buildOptimisticCartItem(productId, quantity, optimisticItem);
  const lineSubtotal = toMinorUnits(nextItem.totals.line_subtotal);
  const lineSubtotalTax = toMinorUnits(nextItem.totals.line_subtotal_tax);
  const lineTotal = toMinorUnits(nextItem.totals.line_total);
  const lineTotalTax = toMinorUnits(nextItem.totals.line_total_tax);

  return {
    ...currentCart,
    items: [nextItem, ...currentCart.items],
    items_count: currentCart.items_count + quantity,
    needs_payment: true,
    totals: applyTotalsDelta(currentCart.totals, {
      items: lineSubtotal,
      itemsTax: lineSubtotalTax,
      price: lineTotal,
      tax: lineTotalTax,
    }),
  };
}

function applyOptimisticUpdate(currentCart: Cart, key: string, quantity: number) {
  const currentItem = currentCart.items.find((item) => item.key === key);

  if (!currentItem) {
    return currentCart;
  }

  const nextItem = withQuantity(currentItem, quantity);
  const previousLineSubtotal = toMinorUnits(currentItem.totals.line_subtotal);
  const nextLineSubtotal = toMinorUnits(nextItem.totals.line_subtotal);
  const previousLineSubtotalTax = toMinorUnits(currentItem.totals.line_subtotal_tax);
  const nextLineSubtotalTax = toMinorUnits(nextItem.totals.line_subtotal_tax);
  const previousLineTotal = toMinorUnits(currentItem.totals.line_total);
  const nextLineTotal = toMinorUnits(nextItem.totals.line_total);
  const previousLineTotalTax = toMinorUnits(currentItem.totals.line_total_tax);
  const nextLineTotalTax = toMinorUnits(nextItem.totals.line_total_tax);

  return {
    ...currentCart,
    items: currentCart.items.map((item) => (item.key === key ? nextItem : item)),
    items_count: currentCart.items_count + (quantity - currentItem.quantity),
    totals: applyTotalsDelta(currentCart.totals, {
      items: nextLineSubtotal - previousLineSubtotal,
      itemsTax: nextLineSubtotalTax - previousLineSubtotalTax,
      price: nextLineTotal - previousLineTotal,
      tax: nextLineTotalTax - previousLineTotalTax,
    }),
  };
}

function applyOptimisticRemove(currentCart: Cart, key: string) {
  const currentItem = currentCart.items.find((item) => item.key === key);

  if (!currentItem) {
    return currentCart;
  }

  return {
    ...currentCart,
    items: currentCart.items.filter((item) => item.key !== key),
    items_count: Math.max(0, currentCart.items_count - currentItem.quantity),
    needs_payment: currentCart.items.length > 1 ? currentCart.needs_payment : false,
    totals: applyTotalsDelta(currentCart.totals, {
      items: -toMinorUnits(currentItem.totals.line_subtotal),
      itemsTax: -toMinorUnits(currentItem.totals.line_subtotal_tax),
      price: -toMinorUnits(currentItem.totals.line_total),
      tax: -toMinorUnits(currentItem.totals.line_total_tax),
    }),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItemKeys, setPendingItemKeys] = useState<Set<string>>(new Set());
  const [pendingProductIds, setPendingProductIds] = useState<Set<number>>(new Set());
  const cartRef = useRef<Cart | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const refreshResolversRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const flushRefreshResolvers = useCallback(() => {
    const resolvers = refreshResolversRef.current;
    refreshResolversRef.current = [];
    resolvers.forEach((resolve) => resolve());
  }, []);

  const updatePendingItem = useCallback((key: string, isPending: boolean) => {
    setPendingItemKeys((previous) => {
      const next = new Set(previous);
      if (isPending) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const updatePendingProduct = useCallback(
    (productId: number, isPending: boolean) => {
      setPendingProductIds((previous) => {
        const next = new Set(previous);
        if (isPending) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
    },
    []
  );

  const runRefreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      startTransition(() => {
        setCart(data);
      });
    } catch (err) {
      console.error("Failed to refresh cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCart = useCallback(() => {
    return new Promise<void>((resolve) => {
      refreshResolversRef.current.push(resolve);

      if (refreshPromiseRef.current) {
        void refreshPromiseRef.current.finally(flushRefreshResolvers);
        return;
      }

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        refreshPromiseRef.current = runRefreshCart().finally(() => {
          refreshPromiseRef.current = null;
          flushRefreshResolvers();
        });
      }, REFRESH_DEBOUNCE_MS);
    });
  }, [flushRefreshResolvers, runRefreshCart]);

  const addItem = useCallback(
    async (
      productId: number,
      quantity: number,
      options?: { optimisticItem?: OptimisticAddItem }
    ) => {
      const previousCart = cartRef.current;
      updatePendingProduct(productId, true);

      if (previousCart) {
        startTransition(() => {
          setCart(
            applyOptimisticAdd(previousCart, productId, quantity, options?.optimisticItem)
          );
        });
      }

      try {
        const updatedCart = await apiAddToCart(productId, quantity);
        startTransition(() => {
          setCart(updatedCart);
        });
      } catch (err) {
        console.error("Failed to add item:", err);

        startTransition(() => {
          if (err instanceof CartConflictError && err.cart) {
            setCart(err.cart);
            return;
          }

          setCart(previousCart);
        });
        throw err;
      } finally {
        updatePendingProduct(productId, false);
      }
    },
    [updatePendingProduct]
  );

  const removeItem = useCallback(
    async (key: string) => {
      const previousCart = cartRef.current;
      const currentItem = previousCart?.items.find((item) => item.key === key) ?? null;

      updatePendingItem(key, true);
      if (currentItem?.id) {
        updatePendingProduct(currentItem.id, true);
      }

      if (previousCart) {
        startTransition(() => {
          setCart(applyOptimisticRemove(previousCart, key));
        });
      }

      try {
        const updatedCart = await apiRemoveItem(key);
        startTransition(() => {
          setCart(updatedCart);
        });
      } catch (err) {
        console.error("Failed to remove item:", err);

        startTransition(() => {
          if (err instanceof CartConflictError && err.cart) {
            console.warn("[Cart] Stale item - syncing with real cart state");
            setCart(err.cart);
            return;
          }

          setCart(previousCart);
        });

        if (!(err instanceof CartConflictError && err.cart)) {
          throw err;
        }
      } finally {
        updatePendingItem(key, false);
        if (currentItem?.id) {
          updatePendingProduct(currentItem.id, false);
        }
      }
    },
    [updatePendingItem, updatePendingProduct]
  );

  const updateItem = useCallback(
    async (key: string, quantity: number) => {
      const previousCart = cartRef.current;
      const currentItem = previousCart?.items.find((item) => item.key === key) ?? null;

      updatePendingItem(key, true);
      if (currentItem?.id) {
        updatePendingProduct(currentItem.id, true);
      }

      if (previousCart) {
        startTransition(() => {
          setCart(applyOptimisticUpdate(previousCart, key, quantity));
        });
      }

      try {
        const updatedCart = await apiUpdateItem(key, quantity);
        startTransition(() => {
          setCart(updatedCart);
        });
      } catch (err) {
        console.error("Failed to update item:", err);

        startTransition(() => {
          if (err instanceof CartConflictError && err.cart) {
            console.warn("[Cart] Stale item - syncing with real cart state");
            setCart(err.cart);
            return;
          }

          setCart(previousCart);
        });

        if (!(err instanceof CartConflictError && err.cart)) {
          throw err;
        }
      } finally {
        updatePendingItem(key, false);
        if (currentItem?.id) {
          updatePendingProduct(currentItem.id, false);
        }
      }
    },
    [updatePendingItem, updatePendingProduct]
  );

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      flushRefreshResolvers();
    };
  }, [flushRefreshResolvers]);

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
      isItemPending: (key: string) => pendingItemKeys.has(key),
      isProductPending: (productId: number) => pendingProductIds.has(productId),
    }),
    [
      cart,
      loading,
      itemCount,
      refreshCart,
      addItem,
      removeItem,
      updateItem,
      pendingItemKeys,
      pendingProductIds,
    ]
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
