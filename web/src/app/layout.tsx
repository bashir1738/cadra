import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CadraProvider } from "../context/CadraContext";
import { PrivyProviders } from "../components/PrivyProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadra.finance"),
  title: "Cadra — Follow a Curator. Pay Only When They Beat the Pace.",
  description: "Uniswap v4 hook for curated liquidity benchmarking against the Pace.",
  icons: {
    icon: "/cadra/icons/cadra-favicon.svg",
    apple: "/cadra/icons/cadra-app-icon-rounded.svg",
  },
  openGraph: {
    title: "Cadra — Follow a Curator. Pay Only When They Beat the Pace.",
    description: "Uniswap v4 hook for curated liquidity benchmarking against the Pace.",
    images: ["/cadra/social/cadra-og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
        <PrivyProviders>
          <CadraProvider>
            <Suspense fallback={<div className="min-h-screen bg-white" />}>
              {children}
            </Suspense>
          </CadraProvider>
        </PrivyProviders>
      </body>
    </html>
  );
}
