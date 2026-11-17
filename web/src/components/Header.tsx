"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCadra } from "../context/CadraContext";

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
  currentRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  connectedAddress: propAddress,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const cadra = useCadra();

  const connectedAddress = propAddress !== undefined ? propAddress : cadra.connectedAddress;
  const handleConnectWallet = onConnectWallet || cadra.connectWallet;
  const handleDisconnectWallet = onDisconnectWallet || cadra.disconnectWallet;

  const handleRoleClick = (role: "follower" | "curator") => {
    if (onSelectRole) onSelectRole(role);
    if (role === "follower") {
      router.push("/follower/portfolio");
    } else {
      router.push("/curator/overview");
    }
  };

  return (
    <header className="sticky top-0 z-50 pt-3 sm:pt-4 px-3 sm:px-6 w-full max-w-7xl mx-auto">
      {/* Floating White Frosted Glass Island Navbar */}
      <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/90 rounded-full px-5 sm:px-8 py-3 shadow-xs flex items-center justify-between gap-4 transition-all">
        {/* Brand Logo & Clean Name matching Spenda typography */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          onClick={() => {
            if (onSelectTab) onSelectTab("landing");
          }}
        >
          <div className="w-8 h-8 rounded-full bg-neutral-950 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 shadow-xs">
            <img
              src="/cadra/logo/cadra-mark-white.svg"
              alt="Cadra"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-neutral-950 font-sans lowercase">
            cadra
          </span>
        </Link>

        {/* Center Navigation matching Spenda: "Our products ▾", "Leaderboard", "Simulator" */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className="flex items-center gap-1 hover:text-neutral-950 transition-colors py-1 cursor-pointer"
            >
              <span>Our products</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${productsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {productsOpen && (
              <div className="absolute top-full left-0 pt-2 w-64 z-50">
                <div className="bg-white border border-neutral-200/90 rounded-2xl p-2.5 shadow-xl space-y-1 text-xs">
                  <Link
                    href="/follower/explore"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-base shrink-0">
                      🛡️
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Follower Vaults</p>
                      <p className="text-neutral-500 text-[11px]">Copy curators with bond protection</p>
                    </div>
                  </Link>

                  <Link
                    href="/curator/overview"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-base shrink-0">
                      ⚡
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Curator Studio</p>
                      <p className="text-neutral-500 text-[11px]">Manage ranges on Uniswap v4</p>
                    </div>
                  </Link>

                  <Link
                    href="/#categories"
                    onClick={() => setProductsOpen(false)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-base shrink-0">
                      🥑
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Everyday Spending</p>
                      <p className="text-neutral-500 text-[11px]">Food, fashion & electronics</p>
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
            Playground Demo
          </Link>
        </nav>

        {/* Right Controls: QR code Download pill & Wallet button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Download QR Code Pill matching Spenda top-right */}
          <div
            className="relative hidden lg:flex items-center"
            onMouseEnter={() => setQrOpen(true)}
            onMouseLeave={() => setQrOpen(false)}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors">
              <span>Download :</span>
              {/* QR Code SVG Icon */}
              <svg className="w-4 h-4 text-neutral-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm8-2h7v7h-7V3zm2 2v3h3V5h-3zM3 13h7v7H3v-7zm2 2v3h3v-3H5zm11 1h2v2h-2v-2zm-3-3h2v2h-2v-2zm2 5h2v2h-2v-2zm3-2h2v4h-2v-4zm-5 2h2v2h-2v-2zm5-4h2v2h-2v-2zm0-3h2v2h-2v-2z" />
              </svg>
            </div>

            {/* QR Popover */}
            {qrOpen && (
              <div className="absolute top-full right-0 pt-2 z-50 w-52">
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xl text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-neutral-900 rounded-xl p-2 flex items-center justify-center">
                    <img
                      src="/cadra/logo/cadra-mark-white.svg"
                      alt="Cadra QR"
                      className="w-20 h-20 object-contain opacity-90"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900">Scan to launch on Mobile</p>
                  <p className="text-[10px] text-neutral-500">iOS &amp; Android PWA Supported</p>
                </div>
              </div>
            )}
          </div>

          {/* Friendly Role Switcher */}
          <div className="hidden sm:flex items-center bg-neutral-100 border border-neutral-200 p-0.5 rounded-full text-xs font-medium">
            <button
              onClick={() => handleRoleClick("follower")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                pathname.startsWith("/follower") || currentRole === "follower"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Follower
            </button>
            <button
              onClick={() => handleRoleClick("curator")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                pathname.startsWith("/curator") || currentRole === "curator"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Curator
            </button>
          </div>

          {/* Wallet Action Button */}
          {connectedAddress ? (
            <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs">
                {connectedAddress.slice(0, 5)}...{connectedAddress.slice(-4)}
              </span>
              <button
                onClick={handleDisconnectWallet}
                className="w-5 h-5 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors text-xs cursor-pointer"
                title="Disconnect"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="px-5 py-2 rounded-full bg-neutral-950 text-white font-medium text-xs hover:bg-neutral-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Connect Wallet
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-neutral-600 hover:text-neutral-900 bg-neutral-100 border border-neutral-200 cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-2xl p-4 space-y-2 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <Link
            href="/follower/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Follower Vaults
          </Link>
          <Link
            href="/curator/overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Curator Studio
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Leaderboard
          </Link>
          <Link
            href="/simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Playground Demo
          </Link>
          <div className="pt-2 border-t border-neutral-100 flex gap-2">
            <button
              onClick={() => {
                handleRoleClick("follower");
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 rounded-xl text-center bg-neutral-100 text-neutral-700 text-xs hover:text-neutral-900 font-medium cursor-pointer"
            >
              Follower Portal
            </button>
            <button
              onClick={() => {
                handleRoleClick("curator");
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 rounded-xl text-center bg-neutral-100 text-neutral-700 text-xs hover:text-neutral-900 font-medium cursor-pointer"
            >
              Curator Studio
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
