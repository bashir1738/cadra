import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Confine Next.js tracing and watching strictly to the web directory
  outputFileTracingRoot: path.resolve(__dirname),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
