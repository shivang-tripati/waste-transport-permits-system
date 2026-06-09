import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // good for Docker deploys
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    domains: ['www.malbafreegurugram.com', 'malbafreegurugram.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.malbafreegurugram.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
    qualities: [75, 100], // default is [75]
  },
};

export default nextConfig;
