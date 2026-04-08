import "server-only";

import type {
  Product,
  ProductAttribute,
  ProductCategory,
  ProductImage,
  ProductMeta,
  ProductPrices,
} from "@/lib/woocommerce-types";
import {
  isPreOrderProduct,
  resolveProductLeadTime,
  resolveProductOrderType,
} from "@/lib/productLogic";

type SortOrder = "asc" | "desc";

type StoreRequestParams = Record<string, string | number | boolean | undefined>;

type RawProductImage = {
  id: number;
  src: string;
  thumbnail?: string | null;
  alt?: string | null;
  name?: string | null;
};

type RawProductCategory = {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  description?: string;
  image?: RawProductImage | null;
};

type RawProductTag = {
  id: number;
  name: string;
  slug: string;
};

type RawProductAttribute = {
  id: number;
  name: string;
  variation?: boolean;
  visible?: boolean;
  options?: string[];
  terms?: Array<{ id?: number; name?: string; slug?: string }>;
};

type RawProductPrices = ProductPrices;

type RawStoreProduct = {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  price_html?: string;
  prices?: RawProductPrices;
  images?: RawProductImage[];
  attributes?: RawProductAttribute[];
  categories?: RawProductCategory[];
  tags?: RawProductTag[];
  meta_data?: ProductMeta[];
  is_preorder?: boolean | null;
  lead_time?: string | null;
  product_order_type?: Product["product_order_type"];
  is_in_stock?: boolean | null;
  stock_status?: string;
  stock_quantity?: number | null;
  purchasable?: boolean;
  is_purchasable?: boolean;
  average_rating?: string | number;
  review_count?: number;
  featured?: boolean;
  related_ids?: number[];
};

type RawStoreProductResponse = RawStoreProduct[] | { products?: RawStoreProduct[] };

export type FetchProductsOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  orderby?: string;
  order?: SortOrder;
  stock_status?: string;
  category?: number;
  tag?: string;
  include?: string;
  cache?: RequestCache;
  revalidate?: number;
};

export type FetchProductsResult = {
  data: Product[];
  totalPages: number;
  totalProducts: number;
};

export type FetchProductsByCategoryOptions = {
  page?: number;
  orderby?: string;
  order?: SortOrder;
  stock_status?: string;
  seriesSlug?: string;
  cache?: RequestCache;
  revalidate?: number;
};

type StoreRequestResult<T> = {
  data: T;
  totalPages: number;
  totalProducts: number;
};

type StoreRequestOptions<T> = {
  fallbackData: T;
  revalidate?: number;
  cache?: RequestCache;
};

const STORE_API_TIMEOUT_MS = 5000;
const STORE_API_REVALIDATE_SECONDS = 60;
const storeResponseCache = new Map<string, StoreRequestResult<unknown>>();

const getBaseUrl = () => {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  return baseUrl.replace(/\/$/, "");
};

const buildStoreUrl = (path: string, params?: StoreRequestParams) => {
  const baseUrl = getBaseUrl();
  const url = new URL(
    `${baseUrl}/wp-json/wc/store/v1/${path.replace(/^\//, "")}`
  );

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const parseStorePrice = (price?: string, minorUnit = 2) => {
  if (!price) return 0;

  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return 0;

  return price.includes(".") ? numeric : numeric / Math.pow(10, minorUnit);
};

const formatCurrency = (
  amount: number,
  currencyCode?: string,
  minorUnit = 2
) => {
  if (!currencyCode) {
    return amount.toFixed(minorUnit);
  }

  try {
    return new Intl.NumberFormat("en-KW", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: minorUnit,
      maximumFractionDigits: minorUnit,
    }).format(amount);
  } catch {
    return `${amount.toFixed(minorUnit)} ${currencyCode}`;
  }
};

const normalizeImage = (image: RawProductImage): ProductImage => ({
  id: image.id,
  src: image.src,
  thumbnail: image.thumbnail ?? null,
  alt: image.alt ?? null,
  name: image.name ?? null,
});

const normalizeCategory = (category: RawProductCategory): ProductCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  parent: category.parent ?? 0,
  description: category.description,
  image: category.image ? normalizeImage(category.image) : null,
});

const normalizeAttribute = (attribute: RawProductAttribute): ProductAttribute => ({
  id: attribute.id,
  name: attribute.name,
  variation: Boolean(attribute.variation),
  visible: Boolean(attribute.visible ?? true),
  options: attribute.options ?? [],
  terms: attribute.terms,
});

const normalizeProduct = (product: RawStoreProduct): Product => {
  const minorUnit = product.prices?.currency_minor_unit ?? 2;
  const price = parseStorePrice(product.prices?.price, minorUnit);
  const regularPrice = parseStorePrice(product.prices?.regular_price, minorUnit);
  const salePrice = parseStorePrice(product.prices?.sale_price, minorUnit);
  const normalizedCategories = (product.categories ?? []).map(normalizeCategory);
  const resolvedOrderType =
    product.product_order_type ?? resolveProductOrderType(product);
  const isPreOrder = product.is_preorder ?? isPreOrderProduct(product);
  const leadTime =
    resolvedOrderType === "pre_order" ? resolveProductLeadTime(product) : null;
  const isPurchasable = product.purchasable ?? product.is_purchasable;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink,
    description: product.description,
    short_description: product.short_description,
    price_html: product.price_html,
    prices: product.prices,
    price,
    regular_price: regularPrice,
    sale_price: salePrice,
    formatted_price: formatCurrency(
      price,
      product.prices?.currency_code,
      minorUnit
    ),
    currency_code: product.prices?.currency_code,
    currency_symbol: product.prices?.currency_symbol,
    currency_minor_unit: minorUnit,
    images: (product.images ?? []).map(normalizeImage),
    attributes: (product.attributes ?? []).map(normalizeAttribute),
    category_slug: normalizedCategories.map((category) => category.slug),
    categories: normalizedCategories,
    tags: product.tags ?? [],
    is_preorder: Boolean(isPreOrder),
    lead_time: leadTime,
    order_type: resolvedOrderType,
    meta_data: product.meta_data ?? [],
    product_order_type: resolvedOrderType,
    is_in_stock: product.is_in_stock ?? null,
    stock_status: product.stock_status ?? "outofstock",
    stock_quantity: product.stock_quantity ?? null,
    purchasable: Boolean(isPurchasable),
    average_rating:
      typeof product.average_rating === "string"
        ? Number(product.average_rating)
        : product.average_rating,
    review_count: product.review_count,
    featured: product.featured,
    related_ids: product.related_ids,
  };
};

async function storeRequest<T>(
  path: string,
  params: StoreRequestParams | undefined,
  options: StoreRequestOptions<T>
): Promise<StoreRequestResult<T>> {
  let url: URL;
  let cacheKey = path;

  try {
    url = buildStoreUrl(path, params);
    cacheKey = url.toString();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown URL build error";
    console.error(
      `WooCommerce Store API setup failed for ${path}: ${message}`
    );

    return getStoreFallbackResult(cacheKey, options.fallbackData);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STORE_API_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      ...(options.cache === "no-store"
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate: options.revalidate ?? STORE_API_REVALIDATE_SECONDS,
            },
          }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `WooCommerce Store API request failed for ${url.toString()} (${response.status}): ${
          body || response.statusText
        }`
      );

      return getStoreFallbackResult(cacheKey, options.fallbackData);
    }

    const totalPages = parseInt(response.headers.get("x-wp-totalpages") ?? "1", 10);
    const totalProducts = parseInt(response.headers.get("x-wp-total") ?? "0", 10);
    const result = {
      data: (await response.json()) as T,
      totalPages,
      totalProducts,
    };

    if (options.cache !== "no-store") {
      storeResponseCache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    console.error(
      `WooCommerce Store API fetch failed for ${url.toString()}: ${message}`
    );

    return getStoreFallbackResult(cacheKey, options.fallbackData);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getStoreFallbackResult<T>(
  cacheKey: string,
  fallbackData: T
): StoreRequestResult<T> {
  const cached = storeResponseCache.get(cacheKey);

  if (cached) {
    return cached as StoreRequestResult<T>;
  }

  return {
    data: fallbackData,
    totalPages: 0,
    totalProducts: 0,
  };
}

function unwrapProducts(data: RawStoreProductResponse): RawStoreProduct[] {
  return Array.isArray(data) ? data : data.products ?? [];
}

export async function fetchProducts(
  options: FetchProductsOptions = {}
): Promise<FetchProductsResult> {
  const { data, totalPages, totalProducts } = await storeRequest<RawStoreProductResponse>(
    "products",
    {
      page: options.page ?? 1,
      per_page: options.perPage ?? 12,
      search: options.search,
      orderby: options.orderby,
      order: options.order,
      stock_status: options.stock_status,
      category: options.category,
      tag: options.tag,
      include: options.include,
    },
    {
      fallbackData: [],
      cache: options.cache,
      revalidate: options.revalidate,
    }
  );

  return {
    data: unwrapProducts(data).map(normalizeProduct),
    totalPages,
    totalProducts,
  };
}

export async function fetchProductBySlug(
  slug: string,
  options: Pick<FetchProductsOptions, "cache" | "revalidate"> = {}
): Promise<Product | null> {
  const { data } = await storeRequest<RawStoreProductResponse>("products", {
    slug,
    per_page: 1,
  }, {
    fallbackData: [],
    cache: options.cache,
    revalidate: options.revalidate,
  });

  const products = unwrapProducts(data).map(normalizeProduct);
  return products[0] ?? null;
}

export async function fetchProductsByIds(ids: number[]): Promise<FetchProductsResult> {
  return fetchProducts({
    perPage: Math.max(ids.length, 1),
    include: ids.join(","),
  });
}

export async function fetchProductCategories(
  options: Pick<FetchProductsOptions, "cache" | "revalidate"> = {}
): Promise<ProductCategory[]> {
  const { data } = await storeRequest<RawProductCategory[]>("products/categories", {
    per_page: 100,
  }, {
    fallbackData: [],
    cache: options.cache,
    revalidate: options.revalidate,
  });

  return data.map(normalizeCategory);
}

export async function fetchProductCategoryBySlug(
  slug: string,
  options: Pick<FetchProductsOptions, "cache" | "revalidate"> = {}
): Promise<ProductCategory | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const categories = await fetchProductCategories(options);

  return (
    categories.find((categoryItem) => categoryItem.slug.toLowerCase() === normalizedSlug) ??
    null
  );
}

export async function fetchProductsByCategory(
  category: string,
  page = 1,
  options: FetchProductsByCategoryOptions = {}
): Promise<FetchProductsResult> {
  const categories = await fetchProductCategories({
    cache: options.cache,
    revalidate: options.revalidate,
  });
  const matchedCategory = categories.find((item) => item.slug === category);

  if (!matchedCategory) {
    return { data: [], totalPages: 0, totalProducts: 0 };
  }

  let categoryId = matchedCategory.id;
  if (options.seriesSlug) {
    const childCategory = categories.find((item) => item.slug === options.seriesSlug);
    if (childCategory) {
      categoryId = childCategory.id;
    }
  }

  return fetchProducts({
    page,
    category: categoryId,
    orderby: options.orderby,
    order: options.order,
    stock_status: options.stock_status,
    cache: options.cache,
    revalidate: options.revalidate,
  });
}
