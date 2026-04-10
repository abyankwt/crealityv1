const imageHosts = [
  "https://creality.com.kw",
  "https://www.creality.com.kw",
  process.env.WC_BASE_URL,
  process.env.NEXT_PUBLIC_WC_BASE_URL,
  process.env.WORDPRESS_URL,
].filter(Boolean);

const remotePatterns = imageHosts
  .flatMap((value) => {
    try {
      const url = new URL(value);

      return [
        {
          protocol: url.protocol.replace(":", ""),
          hostname: url.hostname,
        },
      ];
    } catch {
      return [];
    }
  })
  .filter(
    (pattern, index, patterns) =>
      patterns.findIndex(
        (candidate) =>
          candidate.protocol === pattern.protocol &&
          candidate.hostname === pattern.hostname
      ) === index
  );

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    remotePatterns,
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        source: "/site/wp-content/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/site/:path*',
        destination: `${process.env.NEXT_PUBLIC_WC_BASE_URL || 'https://creality.com.kw/site'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
