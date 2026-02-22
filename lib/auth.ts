import "server-only";

export const AUTH_COOKIE_NAME = "auth_token";

export const getWpBaseUrl = () => {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing WC_BASE_URL");
  }
  return baseUrl.replace(/\/$/, "");
};

export const getWooCredentials = () => {
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing WooCommerce credentials");
  }

  return { consumerKey, consumerSecret };
};
