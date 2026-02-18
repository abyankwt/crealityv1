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

type CartResponse = {
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

type AddItemRequest = {
  id: number;
  quantity: number;
};

type UpdateItemRequest = {
  key: string;
  quantity: number;
};

type RemoveItemRequest = {
  key: string;
};

async function fetchStoreApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/store${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    const details = message ? `: ${message}` : "";
    throw new Error(`WooCommerce Store API error ${response.status}${details}`);
  }

  return (await response.json()) as T;
}

export async function fetchCart(): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("/cart", {
    method: "GET",
  });
}

export async function addToCart(
  productId: number,
  quantity: number
): Promise<CartResponse> {
  const body: AddItemRequest = {
    id: productId,
    quantity,
  };

  return fetchStoreApi<CartResponse>("/cart/add-item", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCartItem(
  key: string,
  quantity: number
): Promise<CartResponse> {
  const body: UpdateItemRequest = {
    key,
    quantity,
  };

  return fetchStoreApi<CartResponse>("/cart/update-item", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removeCartItem(key: string): Promise<CartResponse> {
  const body: RemoveItemRequest = {
    key,
  };

  return fetchStoreApi<CartResponse>("/cart/remove-item", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
