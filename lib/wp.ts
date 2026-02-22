import "server-only";

export const getWpApiUrl = () => {
  const apiUrl = process.env.WP_API_URL;
  if (!apiUrl) {
    throw new Error("Missing WP_API_URL");
  }
  return apiUrl.replace(/\/$/, "");
};

export const getAdminAuthHeader = () => {
  const user = process.env.WP_ADMIN_USER;
  const appPassword = process.env.WP_ADMIN_APP_PASSWORD;

  if (!user || !appPassword) {
    throw new Error("Missing WP admin application password credentials");
  }

  const token = Buffer.from(`${user}:${appPassword}`).toString("base64");
  return `Basic ${token}`;
};
