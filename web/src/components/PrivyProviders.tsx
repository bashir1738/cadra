"use client";

import React, { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import { unichainSepolia } from "viem/chains";
import { sepolia, mainnet, base, arbitrum } from "wagmi/chains";

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
        loginMethodsAndOrder: {
          primary: [
            "detected_ethereum_wallets",
            "metamask",
            "coinbase_wallet",
            "rainbow",
          ],
          overflow: ["wallet_connect"],
        },
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
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

// Backwards-compatible alias
export const RainbowProviders = PrivyProviders;
