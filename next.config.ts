import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: [
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
};

export default nextConfig;
