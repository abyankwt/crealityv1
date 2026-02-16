/** @type {import('next').NextConfig} */
const wcBaseUrl = process.env.NEXT_PUBLIC_WC_BASE_URL;
let wcHostname;
try {
  wcHostname = wcBaseUrl ? new URL(wcBaseUrl).hostname : undefined;
} catch {
  wcHostname = undefined;
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: wcHostname
      ? [
          { protocol: "https", hostname: wcHostname },
          { protocol: "http", hostname: wcHostname },
        ]
      : [],
  },
};

module.exports = nextConfig;
