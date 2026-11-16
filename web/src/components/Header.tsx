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
  const pathname = usePathname();
  const router = useRouter();
  const cadra = useCadra();

  const connectedAddress = propAddress !== undefined ? propAddress : cadra.connectedAddress;
  const handleConnectWallet = onConnectWallet || cadra.connectWallet;
  const handleDisconnectWallet = onDisconnectWallet || cadra.disconnectWallet;

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/follower/explore", label: "Follow Curators" },
    { href: "/curator/overview", label: "Curator Studio" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/simulator", label: "Playground Demo" },
  ];

  const isLinkActive = (href: string) => {
    if (activeTab) {
      if (href === "/" && activeTab === "landing") return true;
      if (href.startsWith("/follower") && activeTab.startsWith("follower")) return true;
      if (href.startsWith("/curator") && activeTab.startsWith("curator")) return true;
      if (href.startsWith("/leaderboard") && activeTab === "leaderboard") return true;
      if (href.startsWith("/simulator") && activeTab === "simulator") return true;
    }
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleRoleClick = (role: "follower" | "curator") => {
    if (onSelectRole) {
      onSelectRole(role);
    }
    if (role === "follower") {
      router.push("/follower/portfolio");
    } else {
      router.push("/curator/overview");
    }
  };

  return (
    <header className="sticky top-0 z-50 pt-3 sm:pt-4 px-3 sm:px-6 w-full max-w-7xl mx-auto">
      {/* Floating White Frosted Glass Island Navbar */}
      <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/90 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-sm flex items-center justify-between gap-3 transition-all">
        {/* Brand Logo & Friendly Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          onClick={() => {
            if (onSelectTab) onSelectTab("landing");
          }}
        >
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <img
              src="/cadra/logo/cadra-mark-black.svg"
              alt="Cadra"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-neutral-900 font-sans">
              CADRA
            </span>
            <span className="text-xs tracking-wider uppercase font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold">
              v4 Hook
            </span>
          </div>
        </Link>

        {/* Center Pill Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-neutral-100/80 border border-neutral-200/60 p-1 rounded-full">
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (onSelectTab) {
                    if (item.href === "/") onSelectTab("landing");
                    else if (item.href.startsWith("/follower")) onSelectTab("follower");
                    else if (item.href.startsWith("/curator")) onSelectTab("curator-studio");
                    else if (item.href.startsWith("/leaderboard")) onSelectTab("leaderboard");
                    else if (item.href.startsWith("/simulator")) onSelectTab("simulator");
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-neutral-900 text-white shadow-xs font-semibold scale-100"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Role Switch & Wallet */}
        <div className="flex items-center gap-2.5 shrink-0">
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
              I&apos;m a Follower
            </button>
            <button
              onClick={() => handleRoleClick("curator")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                pathname.startsWith("/curator") || currentRole === "curator"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              I&apos;m a Curator
            </button>
          </div>

          {/* Testnet Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Testnet Ready</span>
          </div>

          {/* Friendly Wallet Action Button */}
          {connectedAddress ? (
            <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
              className="px-4 py-1.5 rounded-full bg-neutral-900 text-white font-semibold text-xs hover:bg-neutral-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Connect Wallet
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-neutral-600 hover:text-neutral-900 bg-neutral-100 border border-neutral-200 cursor-pointer"
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
        <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-2xl p-4 space-y-2 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  active
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-neutral-100 flex gap-2">
            <button
              onClick={() => {
                handleRoleClick("follower");
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 rounded-xl text-center bg-neutral-100 text-neutral-700 text-xs hover:text-neutral-900 font-medium cursor-pointer"
            >
              Follower Mode
            </button>
            <button
              onClick={() => {
                handleRoleClick("curator");
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 rounded-xl text-center bg-neutral-100 text-neutral-700 text-xs hover:text-neutral-900 font-medium cursor-pointer"
            >
              Curator Mode
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
