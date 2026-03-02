/* ─────────────────────────────────────────────────────────────
 * lib/cart.ts — Client-side WooCommerce Store API cart helpers
 *
 * Every request goes through Next.js API routes (/api/store/…).
 * The nonce and cart-token are stored in-memory and sent/received
 * automatically via response headers.
 * ───────────────────────────────────────────────────────────── */

const NONCE_HEADER = "Nonce";
const CART_TOKEN_HEADER = "Cart-Token";

// ── In-memory stores ──
let nonce = "";
let cartToken = "";

export function getNonce(): string {
  return nonce;
}

// ── Types ──

export type CartItemTotals = {
  line_subtotal: string;
  line_subtotal_tax: string;
  line_total: string;
  line_total_tax: string;
  line_total_html?: string;
  line_subtotal_html?: string;
};

export type CartItemImage = {
  id: number;
  src: string;
  thumbnail?: string;
  srcset?: string;
  sizes?: string;
  name?: string;
  alt?: string;
};

export type CartItem = {
  key: string;
  id: number;
  quantity: number;
  quantity_limits?: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  name: string;
  short_description?: string;
  description?: string;
  sku?: string;
  permalink?: string;
  images: CartItemImage[];
  totals: CartItemTotals;
  prices?: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range?: { min_amount: string; max_amount: string } | null;
    raw_prices?: {
      precision: number;
      price: string;
      regular_price: string;
      sale_price: string;
    };
    currency_code?: string;
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_decimal_separator?: string;
    currency_thousand_separator?: string;
    currency_prefix?: string;
    currency_suffix?: string;
  };
};

export type CartTotals = {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string;
  total_shipping_tax: string;
  total_price: string;
  total_tax: string;
  total_price_html?: string;
  total_items_html?: string;
  total_shipping_html?: string;
  tax_lines?: Array<{ name: string; price: string; rate: string }>;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type CartResponse = {
  items: CartItem[];
  items_count: number;
  items_weight: number;
  totals: CartTotals;
  coupons: Array<{
    code: string;
    discount: string;
    discount_tax: string;
    totals?: { total_discount: string; total_discount_tax: string };
  }>;
  needs_payment: boolean;
  needs_shipping: boolean;
  shipping_address?: Record<string, string>;
  billing_address?: Record<string, string>;
  errors?: Array<{ code: string; message: string }>;
};

// ── Core fetch wrapper ──

async function fetchStoreApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_WC_API || "https://creality.com.kw/site/wp-json/wc/store/v1";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (nonce) {
    headers[NONCE_HEADER] = nonce;
  }
  if (cartToken) {
    headers[CART_TOKEN_HEADER] = cartToken;
  }

  const response = await fetch(`${baseUrl}/${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const responseNonce = response.headers.get(NONCE_HEADER);
  if (responseNonce) {
    nonce = responseNonce;
  }

  const responseCartToken = response.headers.get(CART_TOKEN_HEADER);
  if (responseCartToken) {
    cartToken = responseCartToken;
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Store API error ${response.status}`;
    try {
      const err = JSON.parse(text);
      if (err?.message) message += `: ${err.message}`;
      else if (err?.error) message += `: ${err.error}`;
    } catch {
      if (text) message += `: ${text}`;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

// ── Public API ──

export async function fetchCart(): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart", { method: "GET" });
}

export async function addToCart(
  productId: number,
  quantity: number
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/add-item", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, id: productId, quantity }),
  });
}

export async function updateCartItem(
  key: string,
  quantity: number
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/update-item", {
    method: "POST",
    body: JSON.stringify({ key, quantity }),
  });
}

export async function removeCartItem(
  key: string
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/remove-item", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
}
