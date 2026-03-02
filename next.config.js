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
