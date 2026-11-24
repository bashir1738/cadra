import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Confine Next.js tracing and watching strictly to the web directory
  outputFileTracingRoot: path.resolve(__dirname),
  cacheComponents: true,
  partialPrefetching: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/bots": path.resolve(__dirname, "bots"),
      "@farcaster/mini-app-solana": false,
      "@metamask/connect-evm": false,
      "accounts": false,
      "mppx/client": false,
      "@base-org/account": path.resolve(__dirname, "src/lib/baseAccountMock.js"),
      "@coinbase/cdp-sdk": path.resolve(__dirname, "src/lib/baseAccountMock.js"),
      "@solana/kit": path.resolve(__dirname, "src/lib/solanaKitMock.js"),
      "@solana-program/token": path.resolve(__dirname, "src/lib/solanaKitMock.js"),
      "@solana-program/system": path.resolve(__dirname, "src/lib/solanaKitMock.js"),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@base-org/account": false,
      "@coinbase/cdp-sdk": false,
      "@solana/kit": false,
      "@solana-program/token": false,
      "@solana-program/system": false,
      "pino-pretty": false,
      lokijs: false,
      encoding: false,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: {
      "@base-org/account": "./src/lib/baseAccountMock.js",
      "@/bots": "./bots",
      "@farcaster/mini-app-solana": "./src/lib/optionalDependencyMock.js",
      "@metamask/connect-evm": "./src/lib/optionalDependencyMock.js",
      "accounts": "./src/lib/optionalDependencyMock.js",
      "mppx/client": "./src/lib/optionalDependencyMock.js",
      "@coinbase/cdp-sdk": "./src/lib/baseAccountMock.js",
      "@solana/kit": "./src/lib/solanaKitMock.js",
      "@solana-program/token": "./src/lib/solanaKitMock.js",
      "@solana-program/system": "./src/lib/solanaKitMock.js",
    },
  },
};

export default nextConfig;
