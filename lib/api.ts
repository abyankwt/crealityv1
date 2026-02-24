import "server-only";

type FetchProductsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  orderby?: string;
  order?: "asc" | "desc";
  stock_status?: string;
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
  formatted_price?: string;
  price_html?: string;
  regular_price: string;
  sale_price: string;
  in_stock: boolean;
  purchasable: boolean;
  stock_status: string;
  images: WCImage[];
  categories: WCCategory[];
};

const getEnv = () => {
  const baseUrl = process.env.WC_BASE_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;


  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  if (!consumerKey) {
    throw new Error("Missing WC_CONSUMER_KEY");
  }
  if (!consumerSecret) {
    throw new Error("Missing WC_CONSUMER_SECRET");
  }

  return { baseUrl, consumerKey, consumerSecret };
};

const fetchFromWoo = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<{ data: T; totalPages: number; totalProducts: number }> => {
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

  const totalPages = parseInt(response.headers.get("x-wp-totalpages") ?? "1", 10);
  const totalProducts = parseInt(response.headers.get("x-wp-total") ?? "0", 10);

  return { data: (await response.json()) as T, totalPages, totalProducts };
};

export const fetchProducts = async (params: FetchProductsParams = {}) => {
  return fetchFromWoo<WCProduct[]>("products", {
    page: params.page ?? 1,
    per_page: params.perPage ?? 12,
    search: params.search,
    orderby: params.orderby,
    order: params.order,
    stock_status: params.stock_status,
  });
};

export const fetchProductBySlug = async (slug: string) => {
  const { data: products } = await fetchFromWoo<WCProduct[]>("products", {
    slug,
    per_page: 1,
  });

  return products[0] ?? null;
};

export const fetchCategories = async () => {
  const { data } = await fetchFromWoo<WCCategory[]>("products/categories", {
    per_page: 100,
  });
  return data;
};

export type FetchByCategoryOptions = {
  page?: number;
  orderby?: string;
  order?: "asc" | "desc";
  stock_status?: string;
  /** If set, further filter by a child category slug (series) */
  seriesSlug?: string;
};

export const fetchProductsByCategory = async (
  slug: string,
  page = 1,
  opts: FetchByCategoryOptions = {}
) => {
  const { data: categories } = await fetchFromWoo<WCCategory[]>("products/categories", {
    slug,
    per_page: 1,
  });

  const category = categories[0];

  if (!category) {
    return { data: [] as WCProduct[], totalPages: 0, totalProducts: 0 };
  }

  // If a series slug is specified, resolve that child category ID
  let categoryId = category.id;
  if (opts.seriesSlug) {
    const { data: series } = await fetchFromWoo<WCCategory[]>("products/categories", {
      slug: opts.seriesSlug,
      per_page: 1,
    });
    if (series[0]) categoryId = series[0].id;
  }

  // Map sort shorthand to WC orderby/order params
  let orderby = opts.orderby ?? "popularity";
  let order: "asc" | "desc" = opts.order ?? "desc";

  return fetchFromWoo<WCProduct[]>("products", {
    category: categoryId,
    per_page: 12,
    page,
    orderby,
    order,
    stock_status: opts.stock_status || undefined,
  });
};
