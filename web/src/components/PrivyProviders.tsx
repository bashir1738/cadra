"use client";

import React, { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import { unichainSepolia } from "viem/chains";
import { sepolia, mainnet, base, arbitrum } from "wagmi/chains";
import { Toaster } from "react-hot-toast";

export const wagmiConfig = createConfig({
  chains: [unichainSepolia, sepolia, mainnet, base, arbitrum],
  transports: {
    [unichainSepolia.id]: http("https://sepolia.unichain.org"),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

export const PRIVY_APP_ID =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmwnxyupd009i0il0wmxkltoa";

export function PrivyProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#09090b",
          walletChainType: "ethereum-only",
          walletList: [
            "detected_ethereum_wallets",
            "metamask",
            "coinbase_wallet",
            "rainbow",
            "wallet_connect",
          ],
        },
        loginMethods: ["wallet"],
        defaultChain: unichainSepolia,
        supportedChains: [unichainSepolia, sepolia, mainnet, base, arbitrum],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#0a0a0a",
                color: "#f5f5f5",
                border: "1px solid #262626",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 500,
                padding: "12px 16px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#3b82f6",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

// Backwards-compatible alias
export const RainbowProviders = PrivyProviders;
