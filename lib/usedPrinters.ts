import "server-only";

import {
  filterProductsForSection,
} from "@/lib/productLogic";
import type { FetchProductsResult } from "@/lib/woocommerce";
import {
  normalizeWooRestProduct,
  type WooRestCategory,
  type WooRestProduct,
} from "@/lib/wooRestProducts";

const USED_PRINTERS_CATEGORY_SLUG = "used-3d-printers";
const WOO_REST_TIMEOUT_MS = 5000;
const WOO_REST_REVALIDATE_SECONDS = 60;
const wooRestCache = new Map<string, unknown>();
const USED_PRINTERS_PAGE_SIZE = 12;

function getWooBaseUrl() {
  const baseUrl = process.env.WC_BASE_URL ?? process.env.WORDPRESS_URL;
  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL or WORDPRESS_URL");
  }

  return baseUrl.replace(/\/$/, "");
}

function getWooRestCredentials() {
  const key = process.env.WC_KEY ?? process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_SECRET ?? process.env.WC_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error(
      "Missing WooCommerce REST credentials (WC_KEY/WC_SECRET or WC_CONSUMER_KEY/WC_CONSUMER_SECRET)."
    );
  }

  return { key, secret };
}

function buildWooRestUrl(
  path: string,
  params: Record<string, string | number | undefined> = {}
) {
  const { key, secret } = getWooRestCredentials();
  const url = new URL(`${getWooBaseUrl()}/wp-json/wc/v3/${path.replace(/^\//, "")}`);

  Object.entries(params).forEach(([param, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(param, String(value));
    }
  });

  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);

  return url;
}

async function wooRestRequest<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  fallbackData: T
): Promise<T> {
  let url: URL;
  let cacheKey = path;

  try {
    url = buildWooRestUrl(path, params);
    cacheKey = url.toString();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown URL build error";
    console.error(`WooCommerce REST setup failed for ${path}: ${message}`);
    return (wooRestCache.get(cacheKey) as T | undefined) ?? fallbackData;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WOO_REST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: WOO_REST_REVALIDATE_SECONDS,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `WooCommerce REST request failed for ${url.pathname} (${response.status}): ${
          body || response.statusText
        }`
      );

      return (wooRestCache.get(cacheKey) as T | undefined) ?? fallbackData;
    }

    const data = (await response.json()) as T;
    wooRestCache.set(cacheKey, data);
    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    console.error(
      `WooCommerce REST fetch failed for ${url.toString()}: ${message}`
    );

    return (wooRestCache.get(cacheKey) as T | undefined) ?? fallbackData;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function wooRestPaginatedRequest<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  fallbackData: T
): Promise<{ data: T; totalPages: number; totalProducts: number }> {
  let url: URL;
  let cacheKey = path;

  try {
    url = buildWooRestUrl(path, params);
    cacheKey = url.toString();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown URL build error";
    console.error(`WooCommerce REST setup failed for ${path}: ${message}`);

    const cached = wooRestCache.get(cacheKey) as
      | { data: T; totalPages: number; totalProducts: number }
      | undefined;

    return (
      cached ?? {
        data: fallbackData,
        totalPages: 0,
        totalProducts: 0,
      }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WOO_REST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: WOO_REST_REVALIDATE_SECONDS,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `WooCommerce REST request failed for ${url.pathname} (${response.status}): ${
          body || response.statusText
        }`
      );

      const cached = wooRestCache.get(cacheKey) as
        | { data: T; totalPages: number; totalProducts: number }
        | undefined;

      return (
        cached ?? {
          data: fallbackData,
          totalPages: 0,
          totalProducts: 0,
        }
      );
    }

    const result = {
      data: (await response.json()) as T,
      totalPages: parseInt(response.headers.get("x-wp-totalpages") ?? "1", 10),
      totalProducts: parseInt(response.headers.get("x-wp-total") ?? "0", 10),
    };

    wooRestCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    console.error(
      `WooCommerce REST fetch failed for ${url.toString()}: ${message}`
    );

    const cached = wooRestCache.get(cacheKey) as
      | { data: T; totalPages: number; totalProducts: number }
      | undefined;

    return (
      cached ?? {
        data: fallbackData,
        totalPages: 0,
        totalProducts: 0,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveUsedPrintersCategoryId() {
  const envCategoryId =
    process.env.USED_3D_PRINTERS_CATEGORY_ID ?? process.env.USED_CATEGORY_ID;

  if (envCategoryId) {
    const parsedId = Number(envCategoryId);
    if (Number.isFinite(parsedId) && parsedId > 0) {
      return parsedId;
    }
  }

  const categories = await wooRestRequest<WooRestCategory[]>(
    "products/categories",
    {
      slug: USED_PRINTERS_CATEGORY_SLUG,
      per_page: 12,
    },
    []
  );

  const category = categories.find(
    (item) => item.slug === USED_PRINTERS_CATEGORY_SLUG
  );

  if (!category) {
    console.error(
      `Unable to resolve WooCommerce category for ${USED_PRINTERS_CATEGORY_SLUG}.`
    );
    return null;
  }

  return category.id;
}

export async function fetchUsedPrinterProducts({
  page = 1,
  perPage = USED_PRINTERS_PAGE_SIZE,
}: {
  page?: number;
  perPage?: number;
} = {}): Promise<FetchProductsResult> {
  const categoryId = await resolveUsedPrintersCategoryId();
  if (!categoryId) {
    return { data: [], totalPages: 0, totalProducts: 0 };
  }

  const result = await wooRestPaginatedRequest<WooRestProduct[]>(
    "products",
    {
      category: categoryId,
      page,
      per_page: perPage,
    },
    []
  );

  return {
    data: filterProductsForSection(
      result.data.map(normalizeWooRestProduct),
      "used_printers"
    ),
    totalPages: result.totalPages,
    totalProducts: result.totalProducts,
  };
}

export async function fetchUsedPrinterProductBySlug(slug: string) {
  const categoryId = await resolveUsedPrintersCategoryId();
  if (!categoryId) {
    return null;
  }

  const products = await wooRestRequest<WooRestProduct[]>(
    "products",
    {
      category: categoryId,
      slug,
      per_page: 1,
    },
    []
  );

  const matched = products[0];
  if (!matched) {
    return null;
  }

  const normalizedProduct = normalizeWooRestProduct(matched);
  const visibleProducts = filterProductsForSection(
    [normalizedProduct],
    "used_printers"
  );

  return visibleProducts[0] ?? null;
}
