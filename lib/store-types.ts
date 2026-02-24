export type StoreProductImage = {
  id: number;
  src: string;
  alt?: string | null;
  name?: string | null;
  thumbnail?: string | null;
};

export type StoreProductPrices = {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type StoreProductAttribute = {
  id: number;
  name: string;
  options?: string[];
  terms?: Array<{ id?: number; name?: string; slug?: string }>;
};

export type StoreProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export type StoreProductMeta = {
  id?: number;
  key: string;
  value: string;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price_html?: string;
  prices?: StoreProductPrices;
  images?: StoreProductImage[];
  attributes?: StoreProductAttribute[];
  stock_status?: string;
  stock_quantity?: number | null;
  purchasable?: boolean;
  average_rating?: string | number;
  review_count?: number;
  categories?: StoreProductCategory[];
  meta_data?: StoreProductMeta[];
  related_ids?: number[];
};
