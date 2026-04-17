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

const WOO_REQUEST_TIMEOUT_MS = 10000;

const requestJson = async <T>(input: string, init: WooRequestInit): Promise<FetchResult<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WOO_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      signal: controller.signal,
      ...(init.next ? { next: init.next } : { cache: "no-store" }),
    });
  } catch {
    return { ok: false, status: 503 };
  } finally {
    clearTimeout(timeoutId);
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
    ...(isGet && !init.next ? { next: { revalidate: 3600 } } : {}),
  });
};

export const createWooCustomer = async (payload: Record<string, unknown>) => {
  return wooRequest<WooCustomerResponse>("customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getWooCustomer = async (customerId: number) => {
  // Always fresh — personal data must never be served stale from ISR cache
  return wooRequest<WooCustomerResponse>(`customers/${customerId}`, {
    next: { revalidate: 0 },
  });
};

export const updateWooCustomer = async (customerId: number, payload: Record<string, unknown>) => {
  return wooRequest<WooCustomerResponse>(`customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const getWooOrders = async (customerId: number) => {
  const path = `orders?customer=${encodeURIComponent(String(customerId))}&per_page=50&orderby=date&order=desc`;
  return wooRequest<WooOrderResponse[]>(path, { next: { revalidate: 60 } });
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

/**
 * Fetch products for multiple category slugs in an optimised way:
 * 1 request to resolve all category IDs, then parallel product fetches per ID.
 * Much faster than calling getWooPublishedProductsByCategorySlug N times.
 */
export const getWooPublishedProductsByCategorySlugs = async (
  categorySlugs: string[],
  options: { orderby?: string; order?: "asc" | "desc"; revalidate?: number } = {}
): Promise<FetchResult<WooRestProduct[]>> => {
  if (!categorySlugs.length) return { ok: true as const, status: 200, data: [] };

  const nextOpts = options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {};

  // Fetch up to 3 pages of categories in parallel (covers up to 300 categories)
  // WooCommerce caps per_page at 100, so we fire pages 1-3 simultaneously.
  const slugSet = new Set(categorySlugs.map((s) => s.trim().toLowerCase()));
  const catPages = await Promise.all(
    [1, 2, 3].map((p) =>
      wooRequest<WooProductTaxonomyTermResponse[]>(
        `products/categories?per_page=100&page=${p}`,
        nextOpts
      )
    )
  );
  const allCategories = catPages.flatMap((r) => (r.ok ? r.data : []));
  if (!allCategories.length) return { ok: true as const, status: 200, data: [] };

  const matchedIds = allCategories
    .filter((c) => slugSet.has(c.slug.toLowerCase()))
    .map((c) => c.id);

  if (!matchedIds.length) return { ok: true as const, status: 200, data: [] };

  const perPage = 100;
  const buildPath = (categoryId: number, page: number) => {
    const p = new URLSearchParams({
      category: String(categoryId),
      status: "publish",
      page: String(page),
      per_page: String(perPage),
    });
    if (options.orderby) p.set("orderby", options.orderby);
    if (options.order) p.set("order", options.order);
    return `products?${p.toString()}`;
  };

  const allResults = await Promise.all(
    matchedIds.map((id) => wooRequest<WooRestProduct[]>(buildPath(id, 1), nextOpts))
  );

  const seenIds = new Set<number>();
  const products: WooRestProduct[] = [];
  for (const result of allResults) {
    if (!result.ok) continue;
    for (const p of result.data) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); products.push(p); }
    }
  }

  return { ok: true as const, status: 200, data: products };
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

  const perPage = 100;

  const buildProductPath = (page: number) => {
    const p = new URLSearchParams({
      category: String(matchedCategory.id),
      status: "publish",
      page: String(page),
      per_page: String(perPage),
    });
    if (options.orderby) p.set("orderby", options.orderby);
    if (options.order) p.set("order", options.order);
    return `products?${p.toString()}`;
  };

  // Fetch page 1 first to check if more pages exist.
  const firstResult = await wooRequest<WooRestProduct[]>(buildProductPath(1), nextOpts);
  if (!firstResult.ok) return firstResult;
  if (firstResult.data.length < perPage) {
    return { ok: true as const, status: 200, data: firstResult.data };
  }

  // Page 1 was full — fire remaining pages (up to 19 more) in parallel.
  const remainingResults = await Promise.all(
    Array.from({ length: 19 }, (_, i) => i + 2).map((page) =>
      wooRequest<WooRestProduct[]>(buildProductPath(page), nextOpts)
    )
  );

  const products = [...firstResult.data];
  for (const result of remainingResults) {
    if (!result.ok || result.data.length === 0) break;
    products.push(...result.data);
    if (result.data.length < perPage) break;
  }

  return { ok: true as const, status: 200, data: products };
};

export const getWooAllPublishedProducts = async (options: {
  orderby?: string;
  order?: "asc" | "desc";
  revalidate?: number;
} = {}) => {
  const perPage = 100;
  const nextOpts = options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {};

  const buildPath = (page: number) => {
    const p = new URLSearchParams({ status: "publish", page: String(page), per_page: String(perPage) });
    if (options.orderby) p.set("orderby", options.orderby);
    if (options.order) p.set("order", options.order);
    return `products?${p.toString()}`;
  };

  // Fetch page 1 first; if it's a full page, fire the rest in parallel.
  const firstResult = await wooRequest<WooRestProduct[]>(buildPath(1), nextOpts);
  if (!firstResult.ok) return firstResult;
  if (firstResult.data.length < perPage) {
    return { ok: true as const, status: 200, data: firstResult.data };
  }

  const remainingResults = await Promise.all(
    Array.from({ length: 19 }, (_, i) => i + 2).map((page) =>
      wooRequest<WooRestProduct[]>(buildPath(page), nextOpts)
    )
  );

  const products = [...firstResult.data];
  for (const result of remainingResults) {
    if (!result.ok || result.data.length === 0) break;
    products.push(...result.data);
    if (result.data.length < perPage) break;
  }

  return { ok: true as const, status: 200, data: products };
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
type PreloadedCustomer = {
  id: number;
  username: string;
  name: string;
  email: string;
};

export const verifyWpUser = async (email: string, password: string, preloaded?: PreloadedCustomer) => {
  const baseUrl = getWordpressUrl();

  let username: string;
  let fallbackId: number;
  let fallbackName: string;
  let fallbackEmail: string;

  if (preloaded) {
    // Caller already fetched the customer — skip the redundant lookup
    username = preloaded.username || email;
    fallbackId = preloaded.id;
    fallbackName = preloaded.name;
    fallbackEmail = preloaded.email;
  } else {
    // Step 1: Look up the WooCommerce customer by email using admin credentials
    const customerResult = await wooRequest<{ id: number; first_name: string; last_name: string; email: string; username: string }[]>(
      `customers?email=${encodeURIComponent(email)}&per_page=1`
    );

    if (!customerResult.ok || !customerResult.data?.length) {
      console.log(`[Login] No customer found for email: ${email}`);
      return { ok: false as const, status: 401 };
    }

    const customer = customerResult.data[0];
    username = customer.username || email;
    fallbackId = customer.id;
    fallbackName = `${customer.first_name} ${customer.last_name}`.trim() || email;
    fallbackEmail = customer.email;
  }

  // Verify via wp-login.php (direct, no WP REST API round-trip)
  // WordPress requires the test cookie to be present as an HTTP cookie on the POST request.
  // We GET first to obtain it, then POST with it included.
  const loginController = new AbortController();
  const loginTimeout = setTimeout(() => loginController.abort(), 8000);

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
          id: fallbackId,
          name: fallbackName,
          email: fallbackEmail,
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
    revalidate: 3600,
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
