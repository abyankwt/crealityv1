import "server-only";

type FetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; errorMessage?: string };

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

const requestJson = async <T>(input: string, init: RequestInit): Promise<FetchResult<T>> => {
  let response: Response;
  try {
    response = await fetch(input, { ...init, cache: "no-store" });
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

const wooRequest = async <T>(path: string, init: RequestInit = {}) => {
  const baseUrl = getWordpressUrl();
  const { consumerKey, consumerSecret } = getWooCredentials();
  const urlObj = new URL(`${baseUrl}/wp-json/wc/v3/${path.replace(/^\//, "")}`);
  urlObj.searchParams.set("consumer_key", consumerKey);
  urlObj.searchParams.set("consumer_secret", consumerSecret);
  return requestJson<T>(urlObj.toString(), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
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

export const updateWooOrder = async (orderId: number, payload: Record<string, unknown>) => {
  return wooRequest<WooOrderResponse>(`orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
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
    (m) => m.key === "_app_password_hash"
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

    if (wpResponse.status === 401 || wpResponse.status === 403) {
      return { ok: false as const, status: 401 };
    }

    // If WP REST API confirms the user, use its data
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
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "unknown";
    console.log(`[Login] WP REST API timed out or failed: ${msg}. Trying wp-login.php fallback...`);
  }

  // Step 3: Fallback — try wp-login.php with timeout
  const loginController = new AbortController();
  const loginTimeout = setTimeout(() => loginController.abort(), 10000);

  try {
    const loginResponse = await fetch(`${baseUrl}/wp-login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

    console.log(`[Login] wp-login.php status: ${loginResponse.status}`);

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

    return { ok: false as const, status: 401 };
  } catch (err) {
    clearTimeout(loginTimeout);
    const msg = err instanceof Error ? err.message : "unknown";
    console.log(`[Login] wp-login.php also failed: ${msg}.`);
    return { ok: false as const, status: 503 };
  }
};

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
