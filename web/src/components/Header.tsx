"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCadra } from "../context/CadraContext";
import { ShieldIcon, ZapIcon, ActivityIcon, XIcon, ArrowRightIcon } from "./Icons";

interface HeaderProps {
  currentRole?: string;
  onSelectRole?: (role: string) => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  connectedAddress?: string | null;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
  vaultCount?: number;
}

export function Header({
  onSelectTab,
  connectedAddress: propAddress,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const cadra = useCadra();

  const connectedAddress = propAddress !== undefined ? propAddress : cadra.connectedAddress;
  const handleConnectWallet = onConnectWallet || cadra.connectWallet;
  const handleDisconnectWallet = onDisconnectWallet || cadra.disconnectWallet;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-neutral-100 transition-colors">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-6">
        {/* Left: Brand Mark & Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          onClick={() => {
            if (onSelectTab) onSelectTab("landing");
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center p-1.5 transition-transform duration-200 group-hover:scale-105">
            <img
              src="/cadra/logo/cadra-mark-white.svg"
              alt="Cadra"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-[21px] tracking-[-0.03em] text-neutral-950 lowercase">
            cadra
          </span>
        </Link>

        {/* Center: Minimalist Cadra Protocol Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-neutral-600">
          {/* Protocol Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className="flex items-center gap-1.5 hover:text-neutral-950 transition-colors py-2 cursor-pointer"
            >
              <span>Protocol</span>
              <svg
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  productsOpen ? "rotate-180 text-neutral-900" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {productsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 z-50">
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] space-y-1">
                  <Link
                    href="/follower/explore"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-white border border-transparent group-hover:border-neutral-200 flex items-center justify-center text-neutral-900 shrink-0 transition-colors">
                      <ShieldIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-950">Follower Vaults</p>
                      <p className="text-[12px] text-neutral-500">Follow curators with USDC bond cover</p>
                    </div>
                  </Link>

                  <Link
                    href="/curator/overview"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-white border border-transparent group-hover:border-neutral-200 flex items-center justify-center text-neutral-900 shrink-0 transition-colors">
                      <ZapIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-950">Curator Studio</p>
                      <p className="text-[12px] text-neutral-500">Manage Uniswap v4 liquidity ranges</p>
                    </div>
                  </Link>

                  <Link
                    href="/#strategies"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-white border border-transparent group-hover:border-neutral-200 flex items-center justify-center text-neutral-900 shrink-0 transition-colors">
                      <ActivityIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-950">Vault Strategies</p>
                      <p className="text-[12px] text-neutral-500">Tight range, wide range &amp; Pace math</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/leaderboard"
            className={`hover:text-neutral-950 transition-colors ${
              pathname === "/leaderboard" ? "text-neutral-950 font-semibold" : ""
            }`}
          >
            Leaderboard
          </Link>

          <Link
            href="/simulator"
            className={`hover:text-neutral-950 transition-colors ${
              pathname === "/simulator" ? "text-neutral-950 font-semibold" : ""
            }`}
          >
            Simulator
          </Link>
        </nav>

        {/* Right: Pool Network Status + Clean Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/80 text-[12px] font-medium text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Uniswap v4 · Testnet</span>
          </div>

          {connectedAddress ? (
            <div className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs text-neutral-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[12px] font-medium">
                {connectedAddress.slice(0, 5)}...{connectedAddress.slice(-4)}
              </span>
              <button
                onClick={handleDisconnectWallet}
                className="w-5 h-5 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Disconnect wallet"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleConnectWallet}
                className="px-4 py-2 rounded-full text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                Connect
              </button>
              <button
                onClick={() => router.push("/follower/portfolio")}
                className="px-4 py-2 rounded-full bg-neutral-950 text-white font-medium text-[13px] hover:bg-neutral-800 transition-all active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-5 py-4 space-y-1 shadow-lg">
          <Link
            href="/follower/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Follower Vaults
          </Link>
          <Link
            href="/curator/overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Curator Studio
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Leaderboard
          </Link>
          <Link
            href="/simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Simulator
          </Link>
          <div className="pt-3 mt-2 border-t border-neutral-100 flex items-center gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/follower/portfolio");
              }}
              className="flex-1 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-medium text-center cursor-pointer"
            >
              Launch App
            </button>
            {!connectedAddress && (
              <button
                onClick={() => {
                  handleConnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium text-center cursor-pointer"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
