"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sidebar } from "./Sidebar";
import { useCadra } from "../context/CadraContext";
import { CadraPrivyButton } from "./CadraPrivyButton";
import { RefreshCwIcon } from "./Icons";
import { CONTRACT_ADDRESSES } from "../config/contracts";

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
  const [pendingSwitchRole, setPendingSwitchRole] = useState<"follower" | "curator" | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, setActiveRole, connectedAddress } = useCadra();

  const handleOpenCircleFaucet = async () => {
    if (connectedAddress && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(connectedAddress);
        toast.success("Address copied! Request 20 USDC on Circle Faucet.");
      } catch {}
    }
    window.open("https://faucet.circle.com", "_blank", "noopener,noreferrer");
  };

  const handleAddUsdcToWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: CONTRACT_ADDRESSES.token0,
              symbol: "USDC",
              decimals: 6,
              image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
            },
          },
        });
        toast.success("USDC added to your wallet!");
      } catch (err: any) {
        if (navigator?.clipboard) {
          await navigator.clipboard.writeText(CONTRACT_ADDRESSES.token0);
          toast.success("USDC address copied! Open MetaMask -> Tokens -> Import tokens.");
        }
      }
    } else if (navigator?.clipboard) {
      await navigator.clipboard.writeText(CONTRACT_ADDRESSES.token0);
      toast.success("USDC address copied! Open MetaMask -> Tokens -> Import tokens.");
    }
  };

  // Determine active portal mode based on prop, pathname, or stored active role
  const portalMode: "follower" | "curator" =
    propPortalMode ||
    (pathname.startsWith("/curator")
      ? "curator"
      : pathname.startsWith("/follower")
      ? "follower"
      : activeRole);

  const isFollower = portalMode === "follower";

  const handleRequestSwitchRole = (targetRole: "follower" | "curator") => {
    if (targetRole === portalMode) return;
    setPendingSwitchRole(targetRole);
  };

  const handleConfirmSwitch = () => {
    if (!pendingSwitchRole) return;
    const target = pendingSwitchRole;
    setActiveRole(target);
    setPendingSwitchRole(null);
    if (target === "curator") {
      router.push("/curator/overview");
    } else {
      router.push("/follower/portfolio");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-neutral-950 font-sans antialiased selection:bg-neutral-950 selection:text-white">
      {/* 1. Left Sidebar Navigation (Desktop permanent + Mobile slide-over drawer) */}
      <Sidebar
        portalMode={portalMode}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onRequestSwitchRole={handleRequestSwitchRole}
      />

      {/* 2. Main Dashboard Content Column (Offset on desktop for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] lg:pl-64">
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
            {/* Circle Faucet +20 USDC Pill for Connected Wallets */}
            {connectedAddress && (
              <button
                type="button"
                onClick={handleOpenCircleFaucet}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-neutral-200/90 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 transition-all active:scale-95 cursor-pointer"
                title="Claim 20 Official Circle USDC on Unichain Sepolia from faucet.circle.com"
              >
                <span>Circle Faucet +20 USDC ↗</span>
              </button>
            )}

            {/* 1-Click Import USDC into MetaMask / Wallet */}
            {connectedAddress && (
              <button
                type="button"
                onClick={handleAddUsdcToWallet}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Add Official Circle USDC token to MetaMask"
              >
                <span>+ Add USDC to MetaMask</span>
              </button>
            )}

            {/* Role Quick Toggle for Tablet / Mobile with Modal Intercept */}
            <div className="hidden sm:inline-flex lg:hidden items-center bg-neutral-100 p-0.5 rounded-full text-xs font-medium">
              <button
                type="button"
                onClick={() => handleRequestSwitchRole("follower")}
                className={`px-3 py-1 rounded-full transition-colors duration-150 cursor-pointer ${
                  isFollower ? "bg-white text-neutral-950 font-semibold shadow-2xs cursor-default" : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Follower
              </button>
              <button
                type="button"
                onClick={() => handleRequestSwitchRole("curator")}
                className={`px-3 py-1 rounded-full transition-colors duration-150 cursor-pointer ${
                  !isFollower ? "bg-white text-neutral-950 font-semibold shadow-2xs cursor-default" : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Curator
              </button>
            </div>

            {/* RainbowKit Wallet Action Pill */}
            <CadraPrivyButton variant="dashboard" />
          </div>
        </header>

        {/* Dynamic Page Content View */}
        <main suppressHydrationWarning className="flex-1 p-4 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto pb-16 lg:pb-20">
          <Suspense fallback={<div className="p-8 text-center text-neutral-400 text-xs">Loading page...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Switch Dashboard / Switch Accounts Confirmation Modal */}
      {pendingSwitchRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-[28px] border border-neutral-200/80 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.12)] space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-950 shrink-0 border border-neutral-200/60">
                <RefreshCwIcon className="w-5 h-5 text-neutral-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-950 tracking-tight">
                  Switch Dashboard
                </h3>
                <p className="text-[13px] font-semibold text-neutral-800">
                  Are you sure you want to switch accounts?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 text-xs text-neutral-600 space-y-2">
              <p className="leading-relaxed">
                {pendingSwitchRole === "curator" ? (
                  <>
                    You are switching to the <span className="font-semibold text-neutral-900">Curator Studio</span> to deploy liquidity vaults, manage active tick ranges, and post bond collateral.
                  </>
                ) : (
                  <>
                    You are switching to the <span className="font-semibold text-neutral-900">Follower Dashboard</span> to explore vaults, deposit USDC with bond coverage, and track yield.
                  </>
                )}
              </p>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Make sure you are connected with the wallet address you intend to use for this role.
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingSwitchRole(null)}
                className="flex-1 h-[42px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-[13px] transition-all cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="flex-1 h-[42px] rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-[13px] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Switch to {pendingSwitchRole === "curator" ? "Curator" : "Follower"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
