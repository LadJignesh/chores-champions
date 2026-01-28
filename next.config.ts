import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Output standalone for containerized deployments
  output: "standalone",
};

export default nextConfig;
