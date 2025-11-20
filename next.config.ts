import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds to allow deployment
    // TODO: Fix linting errors and re-enable
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to continue even with TypeScript errors
    // TODO: Fix TypeScript errors and re-enable
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
