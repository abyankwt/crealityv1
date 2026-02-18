/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "creality.com.kw" },
      ...(process.env.WC_BASE_URL
        ? [
            {
              protocol: new URL(process.env.WC_BASE_URL).protocol.replace(":", ""),
              hostname: new URL(process.env.WC_BASE_URL).hostname,
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
