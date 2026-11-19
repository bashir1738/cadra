"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useCadra } from "../context/CadraContext";
import { CadraPrivyButton } from "./CadraPrivyButton";

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
  const { activeRole, setActiveRole } = useCadra();

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
      <Sidebar
        portalMode={portalMode}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Dashboard Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
        {/* Top Sticky Dashboard Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/70 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile / Tablet Menu Button to open Sidebar Drawer */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200/90 bg-white text-neutral-800 hover:bg-neutral-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors duration-150 cursor-pointer text-xs font-semibold"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 text-[13px] font-medium truncate">
              <Link
                href={isFollower ? "/follower/portfolio" : "/curator/overview"}
                prefetch={true}
                className="text-neutral-400 hover:text-neutral-800 transition-colors duration-150 truncate hidden xs:inline"
              >
                {breadcrumb || (isFollower ? "Follower Portal" : "Curator Studio")}
              </Link>
              <span className="text-neutral-300 hidden xs:inline">/</span>
              <span className="text-neutral-950 font-semibold truncate">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Pool Status Badge */}
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/60 text-[12px] font-medium text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>WETH/USDC · 0.05%</span>
            </div>

            {/* Role Quick Toggle for Tablet / Mobile */}
            <div className="hidden sm:inline-flex lg:hidden items-center bg-neutral-100 p-0.5 rounded-full text-xs font-medium">
              <Link
                href="/follower/portfolio"
                prefetch={true}
                onClick={() => setActiveRole("follower")}
                className={`px-3 py-1 rounded-full transition-colors duration-150 ${
                  isFollower ? "bg-white text-neutral-950 font-semibold shadow-2xs" : "text-neutral-500"
                }`}
              >
                Follower
              </Link>
              <Link
                href="/curator/overview"
                prefetch={true}
                onClick={() => setActiveRole("curator")}
                className={`px-3 py-1 rounded-full transition-colors duration-150 ${
                  !isFollower ? "bg-neutral-950 text-white font-semibold" : "text-neutral-500"
                }`}
              >
                Curator
              </Link>
            </div>

            {/* RainbowKit Wallet Action Pill */}
            <CadraPrivyButton variant="dashboard" />
          </div>
        </header>

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto pb-16 lg:pb-20">
          <Suspense fallback={<div className="p-8 text-center text-neutral-400 text-xs">Loading page...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
