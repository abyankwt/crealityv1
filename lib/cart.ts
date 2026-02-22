/* ─────────────────────────────────────────────────────────────
 * lib/cart.ts — Client-side WooCommerce Store API cart helpers
 *
 * Every request goes through Next.js API routes (/api/store/…).
 * The nonce is stored in-memory and sent/received automatically.
 * ───────────────────────────────────────────────────────────── */

const NONCE_HEADER = "X-WC-Store-API-Nonce";

// ── In-memory nonce store ──
let nonce = "";

/** Read the current nonce (useful for debugging). */
export function getNonce(): string {
  return nonce;
}

// ── Types ──

type CartItem = {
  key: string;
  id: number;
  quantity: number;
  name: string;
  price: number;
  totals?: {
    subtotal: string;
    subtotal_tax: string;
    total: string;
    tax: string;
  };
  images?: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
};

export type CartResponse = {
  items: CartItem[];
  items_count: number;
  items_weight: number;
  totals?: {
    total_items: string;
    total_items_tax: string;
    total_shipping: string;
    total_shipping_tax: string;
    total_price: string;
    total_tax: string;
  };
  coupons?: Array<{
    code: string;
    discount: string;
    discount_tax: string;
  }>;
  needs_payment?: boolean;
  needs_shipping?: boolean;
};

// ── Core fetch wrapper ──

async function fetchStoreApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Attach nonce if we have one
  if (nonce) {
    headers[NONCE_HEADER] = nonce;
  }

  const response = await fetch(`/api/store/${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  // Capture the (possibly updated) nonce from the response
  const responseNonce = response.headers.get(NONCE_HEADER);
  if (responseNonce) {
    nonce = responseNonce;
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
    body: JSON.stringify({ id: productId, quantity }),
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
