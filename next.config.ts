import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // good for Docker deploys
  reactStrictMode: true,
  images: {
    qualities: [75, 100], // default is [75]
  },
};

export default nextConfig;
