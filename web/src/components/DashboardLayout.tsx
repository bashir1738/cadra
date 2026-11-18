"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useCadra } from "../context/CadraContext";
import {
  UserIcon,
  ShieldIcon,
  ScaleIcon,
  ActivityIcon,
  ClockIcon,
} from "./Icons";

interface DashboardLayoutProps {
  portalMode?: "follower" | "curator";
  pageTitle: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  portalMode: propPortalMode,
  pageTitle,
  breadcrumb,
  children,
}: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { connectedAddress, connectWallet, disconnectWallet, activeRole, setActiveRole } = useCadra();

  // Determine active portal mode based on prop, pathname, or stored active role
  const portalMode: "follower" | "curator" =
    propPortalMode ||
    (pathname.startsWith("/curator")
      ? "curator"
      : pathname.startsWith("/follower")
      ? "follower"
      : activeRole);

  const isFollower = portalMode === "follower";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-neutral-950 font-sans antialiased selection:bg-neutral-950 selection:text-white">
      {/* 1. Left Sidebar Navigation (Desktop permanent + Mobile slide-over drawer) */}
      <Suspense fallback={<div className="w-64 hidden lg:block shrink-0 bg-white border-r border-neutral-200/75" />}>
        <Sidebar
          portalMode={portalMode}
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </Suspense>

      {/* 2. Main Dashboard Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
        {/* Top Sticky Dashboard Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-neutral-200/70 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer text-xs font-medium"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 text-[13px] font-medium truncate">
              <Link
                href={isFollower ? "/follower/portfolio" : "/curator/overview"}
                className="text-neutral-400 hover:text-neutral-800 transition-colors truncate hidden xs:inline"
              >
                {breadcrumb || (isFollower ? "Follower Portal" : "Curator Studio")}
              </Link>
              <span className="text-neutral-300 hidden xs:inline">/</span>
              <span className="text-neutral-950 font-semibold truncate">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Pool Status Badge */}
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100/80 text-[12px] font-medium text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>WETH/USDC · 0.05%</span>
            </div>

            {/* Role Quick Toggle for Tablet / Mobile */}
            <div className="hidden sm:inline-flex lg:hidden items-center bg-neutral-100 p-0.5 rounded-full text-xs font-medium">
              <Link
                href="/follower/portfolio"
                onClick={() => setActiveRole("follower")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  isFollower ? "bg-white text-neutral-950 font-semibold shadow-2xs" : "text-neutral-500"
                }`}
              >
                Follower
              </Link>
              <Link
                href="/curator/overview"
                onClick={() => setActiveRole("curator")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  !isFollower ? "bg-neutral-950 text-white font-semibold" : "text-neutral-500"
                }`}
              >
                Curator
              </Link>
            </div>

            {/* Wallet Action Pill */}
            <button
              onClick={connectedAddress ? disconnectWallet : connectWallet}
              className="px-4 py-1.5 rounded-full bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              {connectedAddress
                ? `${connectedAddress.slice(0, 5)}...${connectedAddress.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-3 sm:p-6 lg:p-10 max-w-6xl w-full mx-auto pb-24 lg:pb-12">
          <Suspense fallback={<div className="p-8 text-center text-neutral-400 text-xs">Loading page...</div>}>
            {children}
          </Suspense>
        </main>

        {/* 3. Floating Mobile Bottom Navigation Bar (Visible on mobile/tablet < lg) */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg safe-area-pb"
          aria-label="Mobile Navigation"
        >
          {isFollower ? (
            <>
              <Link
                href="/follower/portfolio"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/follower/portfolio" || pathname === "/follower"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Portfolio</span>
              </Link>
              <Link
                href="/follower/explore"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/follower/explore"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ShieldIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Discover</span>
              </Link>
              <Link
                href="/follower/queue"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/follower/queue"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ClockIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Queue</span>
              </Link>
              <Link
                href="/leaderboard"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/leaderboard"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ScaleIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Board</span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(true)}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-[11px] leading-tight">All Pages</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/curator/overview"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/curator/overview" || pathname === "/curator"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ShieldIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Overview</span>
              </Link>
              <Link
                href="/curator/rebalance"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/curator/rebalance"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ActivityIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Ranges</span>
              </Link>
              <Link
                href="/curator/mandate"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/curator/mandate"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ScaleIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Mandate</span>
              </Link>
              <Link
                href="/leaderboard"
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs transition-colors ${
                  pathname === "/leaderboard"
                    ? "text-neutral-950 font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <ScaleIcon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">Board</span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(true)}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-[11px] leading-tight">All Pages</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
