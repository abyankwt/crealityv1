import "server-only";

type FetchProductsParams = {
  page?: number;
  perPage?: number;
};

type WCImage = {
  id: number;
  src: string;
  alt?: string | null;
};

export type WCCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description?: string;
  image?: WCImage | null;
};

export type WCProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  in_stock: boolean;
  images: WCImage[];
  categories: WCCategory[];
};

const getEnv = () => {
  const baseUrl = process.env.NEXT_PUBLIC_WC_BASE_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_WC_BASE_URL.");
  }
  if (!consumerKey) {
    throw new Error("Missing WC_CONSUMER_KEY.");
  }
  if (!consumerSecret) {
    throw new Error("Missing WC_CONSUMER_SECRET.");
  }

  return { baseUrl, consumerKey, consumerSecret };
};

const fetchFromWoo = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  const { baseUrl, consumerKey, consumerSecret } = getEnv();
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const url = new URL(`${normalizedBase}/wp-json/wc/v3/${path.replace(/^\//, "")}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `WooCommerce request failed (${response.status}). ${body || response.statusText}`
    );
  }

  return (await response.json()) as T;
};

export const fetchProducts = async (params: FetchProductsParams = {}) => {
  return fetchFromWoo<WCProduct[]>("products", {
    page: params.page ?? 1,
    per_page: params.perPage ?? 12,
  });
};

export const fetchProductBySlug = async (slug: string) => {
  const products = await fetchFromWoo<WCProduct[]>("products", {
    slug,
    per_page: 1,
  });

  return products[0] ?? null;
};

export const fetchCategories = async () => {
  return fetchFromWoo<WCCategory[]>("products/categories", {
    per_page: 100,
  });
};

export const fetchProductsByCategory = async (slug: string) => {
  const categories = await fetchFromWoo<WCCategory[]>("products/categories", {
    slug,
    per_page: 1,
  });

  const category = categories[0];

  if (!category) {
    return [] as WCProduct[];
  }

  return fetchFromWoo<WCProduct[]>("products", {
    category: category.id,
    per_page: 12,
  });
};
