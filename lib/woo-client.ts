import "server-only";

import type { WooRestProduct } from "@/lib/wooRestProducts";

type FetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; errorMessage?: string };

type NextFetchOptions = {
  revalidate?: number;
};

type WooRequestInit = RequestInit & {
  next?: NextFetchOptions;
};

type WpUserMe = {
  id: number;
  name: string;
  email?: string;
};

type WooOrderLineItemResponse = {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image?: { id: number; src: string };
};

type WooOrderResponse = {
  id: number;
  order_key?: string;
  checkout_payment_url?: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  customer_id: number;
  line_items: WooOrderLineItemResponse[];
  billing: WooAddressResponse;
  shipping: WooAddressResponse;
  payment_method_title: string;
};

type WooProductTaxonomyTermResponse = {
  id: number;
  name: string;
  slug: string;
};

type WooProductImageResponse = {
  id: number;
  src: string;
};

type WooProductSummaryResponse = {
  id: number;
  stock_status?: string;
  categories?: WooProductTaxonomyTermResponse[];
  tags?: WooProductTaxonomyTermResponse[];
};

type WooProductDetailResponse = WooProductSummaryResponse & {
  name: string;
  slug: string;
  status?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  short_description?: string;
  description?: string;
  price_html?: string;
  catalog_visibility?: string;
  stock_quantity?: number | null;
  purchasable?: boolean;
  average_rating?: string | number;
  rating_count?: number;
  related_ids?: number[];
  weight?: string | number | null;
  dimensions?: {
    length?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
  } | null;
  in_stock?: boolean;
  featured?: boolean;
  meta_data?: { id?: number; key: string; value: string }[];
  attributes?: Array<{
    id: number;
    name: string;
    options?: string[];
    visible?: boolean;
    variation?: boolean;
  }>;
  images?: WooProductImageResponse[];
};

type WooCustomerResponse = {
  id: number;
  billing: WooAddressResponse;
  shipping: WooAddressResponse;
};

type WooAddressResponse = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
};

const getWordpressUrl = () => {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  return baseUrl.replace(/\/$/, "");
};

const getWooCredentials = () => {
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing WooCommerce credentials");
  }
  return { consumerKey, consumerSecret };
};

const getWpAppCredentials = () => {
  const user = process.env.WP_APP_USER;
  const password = process.env.WP_APP_PASSWORD;
  if (!user || !password) {
    throw new Error("Missing WP application password credentials");
  }
  return { user, password };
};

const buildBasicAuth = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return JSON.parse("null") as T;
  }
  return JSON.parse(text) as T;
};

const requestJson = async <T>(input: string, init: WooRequestInit): Promise<FetchResult<T>> => {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      ...(init.next ? { next: init.next } : { cache: "no-store" }),
    });
  } catch {
    return { ok: false, status: 503 };
  }

  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const errBody = await response.text();
      const errJson = JSON.parse(errBody) as { message?: string; code?: string };
      errorMessage = errJson?.message ?? errBody;
    } catch { /* ignore */ }
    console.error(`[WooCommerce] ${response.status} ${init.method ?? "GET"} ${input}:`, errorMessage);
    return { ok: false, status: response.status, errorMessage };
  }

  const data = await parseJson<T>(response);
  return { ok: true, status: response.status, data };
};

const wooRequest = async <T>(path: string, init: WooRequestInit = {}) => {
  const baseUrl = getWordpressUrl();
  const { consumerKey, consumerSecret } = getWooCredentials();
  const urlObj = new URL(`${baseUrl}/wp-json/wc/v3/${path.replace(/^\//, "")}`);
  urlObj.searchParams.set("consumer_key", consumerKey);
  urlObj.searchParams.set("consumer_secret", consumerSecret);
  // Default: cache GET requests for 5 minutes. POST/PUT mutations stay uncached.
  const isGet = !init.method || init.method.toUpperCase() === "GET";
  return requestJson<T>(urlObj.toString(), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...(isGet && !init.next ? { next: { revalidate: 300 } } : {}),
  });
};

export const createWooCustomer = async (payload: Record<string, unknown>) => {
  return wooRequest<WooCustomerResponse>("customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getWooCustomer = async (customerId: number) => {
  return wooRequest<WooCustomerResponse>(`customers/${customerId}`);
};

export const updateWooCustomer = async (customerId: number, payload: Record<string, unknown>) => {
  return wooRequest<WooCustomerResponse>(`customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const getWooOrders = async (customerId: number) => {
  const path = `orders?customer=${encodeURIComponent(String(customerId))}&per_page=50&orderby=date&order=desc`;
  return wooRequest<WooOrderResponse[]>(path);
};

export const getWooOrder = async (orderId: number) => {
  return wooRequest<WooOrderResponse>(`orders/${orderId}`);
};

export const getWooProductsByIds = async (productIds: number[]) => {
  const uniqueIds = [...new Set(productIds)].filter(
    (id) => Number.isFinite(id) && id > 0
  );

  if (!uniqueIds.length) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductSummaryResponse[],
    };
  }

  const path = `products?include=${encodeURIComponent(uniqueIds.join(","))}&per_page=${Math.max(
    uniqueIds.length,
    1
  )}`;

  return wooRequest<WooProductSummaryResponse[]>(path);
};

export const getWooDetailedProductsByIds = async (productIds: number[]) => {
  const uniqueIds = [...new Set(productIds)].filter(
    (id) => Number.isFinite(id) && id > 0
  );

  if (!uniqueIds.length) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductDetailResponse[],
    };
  }

  const path = `products?include=${encodeURIComponent(uniqueIds.join(","))}&per_page=${Math.max(
    uniqueIds.length,
    1
  )}`;

  return wooRequest<WooProductDetailResponse[]>(path);
};

export const getWooProductsBySlug = async (slug: string) => {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductDetailResponse[],
    };
  }

  return wooRequest<WooProductDetailResponse[]>(
    `products?slug=${encodeURIComponent(normalizedSlug)}&per_page=1`,
    {
      next: { revalidate: 60 },
    }
  );
};

export const getWooProductsBySlugs = async (slugs: string[]) => {
  const uniqueSlugs = [...new Set(slugs.map((slug) => slug.trim().toLowerCase()))].filter(
    Boolean
  );

  if (!uniqueSlugs.length) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductDetailResponse[],
    };
  }

  // Some WooCommerce installs only honor a single slug in wc/v3 product queries,
  // so fetch each slug explicitly and preserve the requested order.
  const responses = await Promise.all(
    uniqueSlugs.map((slug) => getWooProductsBySlug(slug))
  );

  // Skip individual failed lookups rather than failing the entire batch.
  // A single missing or errored slug should not prevent other products loading.
  const successfulData = responses.flatMap((response) =>
    response.ok ? response.data : []
  );

  return {
    ok: true as const,
    status: 200,
    data: successfulData,
  };
};

export const getWooProductsByTagSlug = async (tagSlug: string) => {
  const normalizedTagSlug = tagSlug.trim().toLowerCase();

  if (!normalizedTagSlug) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductDetailResponse[],
    };
  }

  const tagResult = await wooRequest<WooProductTaxonomyTermResponse[]>(
    `products/tags?search=${encodeURIComponent(normalizedTagSlug)}&per_page=100`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!tagResult.ok) {
    return tagResult as FetchResult<WooProductDetailResponse[]>;
  }

  const matchedTag = tagResult.data.find(
    (tag) => tag.slug.toLowerCase() === normalizedTagSlug
  );

  if (!matchedTag) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooProductDetailResponse[],
    };
  }

  return wooRequest<WooProductDetailResponse[]>(
    `products?tag=${matchedTag.id}&per_page=100`,
    {
      next: { revalidate: 60 },
    }
  );
};

export const getWooPublishedProductBySlug = async (slug: string) => {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooRestProduct[],
    };
  }

  return wooRequest<WooRestProduct[]>(
    `products?slug=${encodeURIComponent(normalizedSlug)}&status=publish&per_page=1`
  );
};

export const getWooPublishedProductsByCategorySlug = async (
  categorySlug: string,
  options: {
    orderby?: string;
    order?: "asc" | "desc";
    revalidate?: number;
  } = {}
) => {
  const normalizedCategorySlug = categorySlug.trim().toLowerCase();

  if (!normalizedCategorySlug) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooRestProduct[],
    };
  }

  const nextOpts = options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {};

  const categoryResult = await wooRequest<WooProductTaxonomyTermResponse[]>(
    `products/categories?slug=${encodeURIComponent(normalizedCategorySlug)}&per_page=100`,
    nextOpts
  );

  if (!categoryResult.ok) {
    return categoryResult as FetchResult<WooRestProduct[]>;
  }

  const matchedCategory = categoryResult.data.find(
    (category) => category.slug.toLowerCase() === normalizedCategorySlug
  );

  if (!matchedCategory) {
    return {
      ok: true as const,
      status: 200,
      data: [] as WooRestProduct[],
    };
  }

  const products: WooRestProduct[] = [];
  const perPage = 100;

  for (let page = 1; page <= 20; page += 1) {
    const path = new URLSearchParams({
      category: String(matchedCategory.id),
      status: "publish",
      page: String(page),
      per_page: String(perPage),
    });

    if (options.orderby) {
      path.set("orderby", options.orderby);
    }

    if (options.order) {
      path.set("order", options.order);
    }

    const productResult = await wooRequest<WooRestProduct[]>(
      `products?${path.toString()}`,
      nextOpts
    );

    if (!productResult.ok) {
      return productResult;
    }

    products.push(...productResult.data);

    if (productResult.data.length < perPage) {
      break;
    }
  }

  return {
    ok: true as const,
    status: 200,
    data: products,
  };
};

export const updateWooOrder = async (orderId: number, payload: Record<string, unknown>) => {
  return wooRequest<WooOrderResponse>(`orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

type ProductRestData = {
  id: number;
  sku: string;
  stock_quantity: number | null;
};

export const getProductsRestData = async (productIds: number[]) => {
  if (productIds.length === 0) {
    return { ok: true as const, status: 200, data: [] as ProductRestData[] };
  }
  const ids = productIds.join(",");
  return wooRequest<ProductRestData[]>(
    `products?include=${ids}&per_page=${productIds.length}&_fields=id,sku,stock_quantity`
  );
};

type WooMetaData = { key: string; value: string };

type WooCustomerFull = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  meta_data: WooMetaData[];
};

export const verifyCustomerPassword = async (email: string) => {
  const result = await wooRequest<WooCustomerFull[]>(
    `customers?email=${encodeURIComponent(email)}&per_page=1`
  );

  if (!result.ok || !result.data?.length) {
    return null;
  }

  const customer = result.data[0];
  const hashMeta = customer.meta_data?.find(
    (m) => m.key === "app_password_hash"
  );

  return {
    customer,
    storedHash: hashMeta?.value ?? null,
  };
};
export const verifyWpUser = async (email: string, password: string) => {
  const baseUrl = getWordpressUrl();

  // Step 1: Look up the WooCommerce customer by email using admin credentials
  const customerResult = await wooRequest<{ id: number; first_name: string; last_name: string; email: string; username: string }[]>(
    `customers?email=${encodeURIComponent(email)}&per_page=1`
  );

  if (!customerResult.ok || !customerResult.data?.length) {
    console.log(`[Login] No customer found for email: ${email}`);
    return { ok: false as const, status: 401 };
  }

  const customer = customerResult.data[0];
  const username = customer.username || email;

  // Step 2: Verify password via WordPress REST API with Basic auth
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const wpResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: buildBasicAuth(username, password),
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log(`[Login] WP REST API /users/me status: ${wpResponse.status}`);

    // If WP REST API confirms the user (requires Application Passwords), use its data
    if (wpResponse.ok) {
      const wpUser = await wpResponse.json() as { id: number; name: string; email?: string };
      return {
        ok: true as const,
        status: 200,
        data: {
          id: wpUser.id,
          name: wpUser.name || `${customer.first_name} ${customer.last_name}`.trim() || email,
          email: wpUser.email ?? customer.email,
        },
      };
    }
    // 401/403 means regular password — fall through to wp-login.php
    console.log(`[Login] WP REST API returned ${wpResponse.status}, trying wp-login.php...`);
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "unknown";
    console.log(`[Login] WP REST API timed out or failed: ${msg}. Trying wp-login.php fallback...`);
  }

  // Step 3: Fallback — try wp-login.php with timeout
  // WordPress requires the test cookie to be present as an HTTP cookie on the POST request.
  // We GET first to obtain it, then POST with it included.
  const loginController = new AbortController();
  const loginTimeout = setTimeout(() => loginController.abort(), 15000);

  try {
    // Step 3a: GET wp-login.php to obtain the wordpress_test_cookie
    const getResponse = await fetch(`${baseUrl}/wp-login.php`, {
      redirect: "manual",
      signal: loginController.signal,
    });
    const setCookieHeader = getResponse.headers.get("set-cookie") ?? "";
    const testCookieMatch = setCookieHeader.match(/wordpress_test_cookie=[^;,\s]+/);
    const cookieHeader = testCookieMatch
      ? testCookieMatch[0]
      : "wordpress_test_cookie=WP%20Cookie%20check";
    console.log(`[Login] wp-login.php GET status: ${getResponse.status}, testCookie: ${cookieHeader}`);

    // Step 3b: POST credentials with the test cookie included
    const loginResponse = await fetch(`${baseUrl}/wp-login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: new URLSearchParams({
        log: username,
        pwd: password,
        "wp-submit": "Log In",
        redirect_to: `${baseUrl}/wp-admin/`,
        testcookie: "1",
      }).toString(),
      redirect: "manual",
      signal: loginController.signal,
    });
    clearTimeout(loginTimeout);

    console.log(`[Login] wp-login.php POST status: ${loginResponse.status}`);

    if (loginResponse.status === 302) {
      return {
        ok: true as const,
        status: 200,
        data: {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`.trim() || email,
          email: customer.email,
        },
      };
    }

    // Log response body to help diagnose failures
    try {
      const body = await loginResponse.text();
      const errorMatch = body.match(/<div id="login_error"[^>]*>([\s\S]*?)<\/div>/);
      if (errorMatch) {
        console.log(`[Login] wp-login.php error: ${errorMatch[1].replace(/<[^>]+>/g, "").trim()}`);
      }
    } catch { /* ignore */ }

    return { ok: false as const, status: 401 };
  } catch (err) {
    clearTimeout(loginTimeout);
    const msg = err instanceof Error ? err.message : "unknown";
    console.log(`[Login] wp-login.php also failed: ${msg}.`);
    return { ok: false as const, status: 503 };
  }
};

/**
 * Returns the set of product IDs that belong to the "specialorder" WooCommerce category.
 * Used to decide which out-of-stock products are permitted to show on the frontend.
 * Products in this set are shown even when out of stock; removing a product from the
 * "specialorder" category hides it from all category pages.
 */
export async function getSpecialOrderProductIds(): Promise<Set<number>> {
  const result = await getWooPublishedProductsByCategorySlug("specialorder", {
    revalidate: 60,
  });
  if (!result.ok) return new Set();
  return new Set(result.data.map((p) => p.id));
}

export const getWpUserById = async (userId: number) => {
  const baseUrl = getWordpressUrl();
  const { user, password } = getWpAppCredentials();
  return requestJson<WpUserMe>(`${baseUrl}/wp-json/wp/v2/users/${userId}`, {
    headers: {
      Authorization: buildBasicAuth(user, password),
      Accept: "application/json",
    },
  });
};
