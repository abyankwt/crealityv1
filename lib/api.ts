import axios, { AxiosError } from "axios";

type FetchProductsParams = {
  page?: number;
  perPage?: number;
};

export type WCImage = {
  id: number;
  src: string;
  alt?: string;
};

export type WCCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
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

const getClient = () => {
  const baseUrl = process.env.NEXT_PUBLIC_WC_BASE_URL;
  const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "Missing WooCommerce environment variables. Set NEXT_PUBLIC_WC_BASE_URL, NEXT_PUBLIC_WC_CONSUMER_KEY, and NEXT_PUBLIC_WC_CONSUMER_SECRET."
    );
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return axios.create({
    baseURL: `${normalizedBaseUrl}/wp-json/wc/v3`,
    timeout: 15000,
    params: {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    },
  });
};

const formatError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "WooCommerce API request failed.";
    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unexpected WooCommerce API error.");
};

export const fetchProducts = async (params: FetchProductsParams = {}) => {
  try {
    const client = getClient();
    const response = await client.get<WCProduct[]>("/products", {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 12,
      },
    });

    return response.data;
  } catch (error) {
    throw formatError(error);
  }
};

export const fetchProductBySlug = async (slug: string) => {
  try {
    const client = getClient();
    const response = await client.get<WCProduct[]>("/products", {
      params: {
        slug,
        per_page: 1,
      },
    });

    return response.data[0] ?? null;
  } catch (error) {
    throw formatError(error);
  }
};

export const fetchCategories = async () => {
  try {
    const client = getClient();
    const response = await client.get<WCCategory[]>("/products/categories", {
      params: {
        per_page: 100,
      },
    });

    return response.data;
  } catch (error) {
    throw formatError(error);
  }
};

export const fetchProductsByCategory = async (slug: string) => {
  try {
    const client = getClient();
    const categoryResponse = await client.get<WCCategory[]>(
      "/products/categories",
      {
        params: {
          slug,
          per_page: 1,
        },
      }
    );

    const category = categoryResponse.data[0];

    if (!category) {
      return [] as WCProduct[];
    }

    const productsResponse = await client.get<WCProduct[]>("/products", {
      params: {
        category: category.id,
        per_page: 12,
      },
    });

    return productsResponse.data;
  } catch (error) {
    throw formatError(error);
  }
};
