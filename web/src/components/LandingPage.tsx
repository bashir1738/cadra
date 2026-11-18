"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldIcon,
  ArrowRightIcon,
  ActivityIcon,
  TrendUpIcon,
  StarIcon,
  YouTubeIcon,
  InstagramIcon,
  TwitterXIcon,
  DiscordIcon,
  LockIcon,
  BitcoinIcon,
  EthereumIcon,
  UsdcIcon,
  TetherIcon,
  SolanaIcon,
  CheckCircleIcon,
} from "./Icons";
import { TabKey } from "./Navigation";
import { CategoriesAndAdSlider } from "./CategoriesAndAdSlider";

interface LandingPageProps {
  onNavigate: (tab: TabKey) => void;
  onSelectRole: (role: string) => void;
}

const FEATURE_TABS = [
  {
    id: "mandate" as const,
    title: "On-chain mandate enforcement",
    description:
      "Curators publish strict price corridors, minimum range widths, and concentration limits. CadraHook validates every rebalance inline and reverts any transaction that breaches the mandate.",
  },
  {
    id: "parking" as const,
    title: "Automated TWAP parking",
    description:
      "On every swap, the hook checks vault bounds in O(1). If a vault lags The Pace beyond its allowed shortfall, keepers freeze the curator and park 100% of liquidity into the passive full-range Pace.",
  },
  {
    id: "capacity" as const,
    title: "Dynamic capacity & deficit carry",
    description:
      "Curators start at 2x bond capacity and scale up to 20x by beating The Pace. Any shortfall exceeding the bond becomes a carried deficit that must be recovered before earning fees again.",
  },
];

export function LandingPage({ onNavigate, onSelectRole }: LandingPageProps) {
  const [activeScenario, setActiveScenario] = useState<"ahead" | "behind" | "parked">("ahead");
  const [activeFeatureTab, setActiveFeatureTab] = useState<"mandate" | "parking" | "capacity">("mandate");

  const handleLaunchFollower = () => {
    onSelectRole("follower");
    onNavigate("follower");
  };

  const handleLaunchCurator = () => {
    onSelectRole("curator-tight");
    onNavigate("curator-studio");
  };

  return (
    <div className="font-sans text-neutral-950 bg-white overflow-x-hidden">
      {/* =========================================================================
          SECTION 1: HERO (Centered Top Copy + 3D Rotating Cadra Cube)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-20 sm:pb-28">
        <div className="flex flex-col items-center text-center">
          {/* Top Centered Hero Copy */}
          <div className="max-w-3xl mx-auto space-y-6 flex flex-col items-center">
            <h1 className="text-[40px] sm:text-[58px] lg:text-[68px] font-bold tracking-[-0.04em] leading-[1.05] text-neutral-950">
              Follow a curator. Pay only when they beat the Pace.
            </h1>

            <p className="text-[16px] sm:text-[18px] text-neutral-500 max-w-2xl leading-[1.65] font-normal">
              Cadra benchmarks active Uniswap v4 liquidity vaults against a passive full-range position—combining on-chain mandates, USDC curator bonds, and automated parking.
            </p>

            {/* Primary Web App Launch Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleLaunchFollower}
                className="h-[50px] px-6 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 transition-all active:scale-[0.98] inline-flex items-center gap-2 text-[14px] font-semibold cursor-pointer"
              >
                <span>Launch Follower App</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>

              <button
                onClick={handleLaunchCurator}
                className="h-[50px] px-6 rounded-full bg-white text-neutral-950 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all active:scale-[0.98] inline-flex items-center gap-2 text-[14px] font-semibold cursor-pointer"
              >
                <span>Open Curator Studio</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onNavigate("simulator")}
                className="text-[13px] font-medium text-neutral-500 hover:text-neutral-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>Or explore the interactive Uniswap v4 simulator</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* 3D Rotating Cadra Cube Showcase */}
          <div className="relative w-full max-w-2xl mt-14 sm:mt-20 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[380px]">
            {/* Soft Isometric Backdrop dissolving cleanly into white */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none hero-grid-mask">
              <div className="grid grid-cols-3 gap-4 transform -rotate-12 skew-y-6 scale-95">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-32 h-40 rounded-[24px] bg-gradient-to-br from-neutral-50 to-neutral-100/80 border border-neutral-200/70 shadow-[0_12px_30px_rgba(0,0,0,0.03)]"
                  />
                ))}
              </div>
            </div>

            {/* Floating 3D Rotating Cube */}
            <div className="relative z-10 animate-float-gentle flex flex-col items-center">
              <div className="cadra-cube-scene cursor-grab" title="Hover to pause rotation">
                <div className="cadra-cube">
                  {/* Face 1: Front — Cadra Mark */}
                  <div className="cadra-cube-face cadra-cube-front space-y-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center p-3">
                      <img
                        src="/cadra/logo/cadra-mark-white.svg"
                        alt="Cadra"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-[18px] font-bold tracking-[-0.03em] lowercase text-white">cadra</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Curated Liquidity</p>
                    </div>
                  </div>

                  {/* Face 2: Right — The Pace Benchmark */}
                  <div className="cadra-cube-face cadra-cube-right space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <TrendUpIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-white">The Pace</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Full-Range Benchmark</p>
                    </div>
                  </div>

                  {/* Face 3: Back — USDC Curator Bond */}
                  <div className="cadra-cube-face cadra-cube-back space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <ShieldIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-white">USDC Bond</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Shortfall Coverage</p>
                    </div>
                  </div>

                  {/* Face 4: Left — On-Chain Mandates */}
                  <div className="cadra-cube-face cadra-cube-left space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/[0.14] flex items-center justify-center text-white">
                      <LockIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-white">Mandates</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Inline Hook Checks</p>
                    </div>
                  </div>

                  {/* Face 5: Top — WETH / USDC Pool */}
                  <div className="cadra-cube-face cadra-cube-top space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                      <EthereumIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-white">WETH / USDC</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">0.05% Hook Pool</p>
                    </div>
                  </div>

                  {/* Face 6: Bottom — TWAP Parking Brake */}
                  <div className="cadra-cube-face cadra-cube-bottom space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <ActivityIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-white">TWAP Brake</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Automated Parking</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Soft Ground Ambient Shadow */}
              <div className="w-40 sm:w-48 h-6 rounded-full bg-neutral-950/15 blur-xl mt-12 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BENTO CARDS — "Built for honest curation."
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <p className="text-xl sm:text-2xl font-semibold text-neutral-400 tracking-[-0.02em]">
            Built for honest curation.
          </p>
          <h2 className="text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
            Benchmark every tick on-chain
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Bento Card: Hook-Owned Vault Telemetry */}
          <div className="bg-[#FAFAFA] border border-neutral-200/75 rounded-[32px] pt-10 px-8 sm:px-12 pb-0 flex flex-col justify-between overflow-hidden min-h-[480px]">
            <div className="space-y-2.5 max-w-sm">
              <h3 className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em] leading-tight">
                Hook-owned liquidity, zero custody risk
              </h3>
              <p className="text-[14px] text-neutral-500 leading-relaxed">
                Curators rebalance positions atomically inside Uniswap v4 but can never withdraw follower funds. Every epoch is measured live against The Pace.
              </p>
            </div>

            {/* Minimalist Vault Telemetry Frame Protruding from Bottom */}
            <div className="pt-10 flex justify-center">
              <div className="w-[260px] sm:w-[280px] rounded-t-[40px] border-t-[6px] border-x-[6px] border-neutral-950 bg-white pt-4 px-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                <div className="w-20 h-4 rounded-full bg-neutral-950 mx-auto mb-7" />
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 flex items-center justify-center p-3.5 shadow-sm">
                    <img
                      src="/cadra/logo/cadra-mark-white.svg"
                      alt="Cadra"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[26px] font-bold tracking-[-0.03em] text-neutral-950 font-mono">
                      $12,450.80
                    </p>
                    <p className="text-[12px] font-medium text-emerald-600">
                      +18.4% ahead of The Pace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Bento Card: Warm Peach Gradient + Sculpted 3D ETH & USDC Coins */}
          <div className="bg-gradient-to-b from-[#FFF4EB] via-[#FFEFE2] to-[#FFE6D3] border border-[#FED7AA]/40 rounded-[32px] p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[480px] group">
            {/* Sculpted 3D Floating ETH & USDC Pool Coins */}
            <div className="relative h-56 sm:h-60 flex items-center justify-center">
              {/* Sculpted WETH Coin */}
              <div className="absolute left-4 sm:left-10 top-2 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#312E81] via-[#6366F1] to-[#C7D2FE] p-1.5 shadow-[0_24px_48px_-12px_rgba(67,56,202,0.4)] transform -rotate-12 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                <div className="w-full h-full rounded-full border-[3px] border-indigo-200/70 bg-gradient-to-br from-[#818CF8] via-[#4F46E5] to-[#1E1B4B] flex items-center justify-center text-white p-5">
                  <EthereumIcon className="w-full h-full drop-shadow-md" />
                </div>
              </div>

              {/* Sculpted USDC Bond Coin */}
              <div className="absolute right-4 sm:right-10 top-12 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#1D4ED8] via-[#3B82F6] to-[#BFDBFE] p-1.5 shadow-[0_24px_48px_-12px_rgba(29,78,216,0.4)] transform rotate-12 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <div className="w-full h-full rounded-full border-[3px] border-blue-200/70 bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#1E3A8A] flex items-center justify-center text-white p-5">
                  <UsdcIcon className="w-full h-full drop-shadow-md" />
                </div>
              </div>
            </div>

            {/* Bottom Clean Copy & CTA */}
            <div className="space-y-4 pt-6">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-[30px] font-bold text-neutral-950 tracking-[-0.03em] leading-[1.15]">
                  Real USDC bonds. Automatic shortfall cover
                </h3>
                <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md">
                  Curators post USDC collateral before managing a single dollar. If an epoch finishes behind The Pace, the bond reimburses followers directly.
                </p>
              </div>
              <div className="pt-1">
                <button
                  onClick={handleLaunchFollower}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Protected Vaults</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CADRA STRATEGY CATEGORIES & 3-SLIDE MECHANISM CAROUSEL
         ========================================================================= */}
      <section id="strategies" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold text-neutral-400">Vault Strategies</p>
            <h2 className="text-3xl sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
              Curated liquidity for every risk profile
            </h2>
          </div>
          <p className="text-[14px] text-neutral-500 max-w-sm">
            Filter Uniswap v4 curator vaults by mandate width, bond protection, and dynamic capacity multiplier.
          </p>
        </div>

        <CategoriesAndAdSlider
          onExploreProducts={(catId) => {
            if (catId === "parking") {
              onNavigate("simulator");
            } else if (catId === "bonded") {
              onNavigate("leaderboard");
            } else {
              handleLaunchFollower();
            }
          }}
        />
      </section>

      {/* =========================================================================
          SECTION 4: FULL-BLEED PURE BLACK SECTION
          "Active Uniswap v4 liquidity, simplified"
         ========================================================================= */}
      <section className="w-full bg-black text-white py-24 sm:py-32 mt-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-[48px] font-bold tracking-[-0.035em] leading-[1.08] text-white">
              Active Uniswap v4 liquidity, simplified
            </h2>
            <p className="text-[15px] text-neutral-400 leading-relaxed">
              Cadra replaces opaque management fees and blind trust with transparent on-chain math—settling every epoch cleanly against The Pace.
            </p>
          </div>

          {/* 3D Pool Asset Arc + Mirror Floor Reflection */}
          <div className="relative py-6 max-w-2xl mx-auto">
            <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-24 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-center gap-6 sm:gap-10 opacity-30 blur-[1px] -mb-4 scale-90 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-blue-600/60" />
              <div className="w-9 h-9 rounded-full bg-emerald-500/50" />
              <div className="w-10 h-10 rounded-full bg-indigo-500/50" />
              <div className="w-9 h-9 rounded-full bg-amber-500/50" />
            </div>

            <div className="relative z-10 flex items-center justify-center gap-3.5 sm:gap-6">
              {[
                { key: "wbtc", bg: "from-amber-500 to-amber-700", ring: "ring-amber-400/30", size: "w-12 h-12 sm:w-16 sm:h-16", icon: <BitcoinIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> },
                { key: "usdc", bg: "from-blue-500 to-blue-700", ring: "ring-blue-400/30", size: "w-13 h-13 sm:w-[68px] sm:h-[68px]", icon: <UsdcIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> },
                { key: "eth", bg: "from-slate-500 to-slate-800", ring: "ring-slate-300/30", size: "w-14 h-14 sm:w-[74px] sm:h-[74px]", icon: <EthereumIcon className="w-7 h-7 sm:w-9 sm:h-9 text-white" /> },
                { key: "cadra", bg: "from-sky-400 to-blue-600", ring: "ring-sky-300/40", size: "w-14 h-14 sm:w-[74px] sm:h-[74px]", icon: <img src="/cadra/logo/cadra-mark-white.svg" alt="Cadra" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" /> },
                { key: "sol", bg: "from-violet-500 to-purple-800", ring: "ring-purple-400/30", size: "w-13 h-13 sm:w-[68px] sm:h-[68px]", icon: <SolanaIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" /> },
                { key: "usdt", bg: "from-teal-500 to-emerald-700", ring: "ring-teal-400/30", size: "w-12 h-12 sm:w-16 sm:h-16", icon: <TetherIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> },
              ].map((token) => (
                <div
                  key={token.key}
                  className={`${token.size} rounded-full bg-gradient-to-b ${token.bg} ring-1 ${token.ring} shadow-[0_12px_30px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform duration-300 hover:-translate-y-1.5`}
                >
                  {token.icon}
                </div>
              ))}
            </div>

            {/* Mirrored Reflection Row on Obsidian Glass Floor */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-3.5 sm:gap-6 mt-2 transform -scale-y-100 blur-[2px] opacity-40 reflection-mask pointer-events-none select-none"
            >
              {[
                { key: "wbtc-r", bg: "from-amber-500 to-amber-700", size: "w-12 h-12 sm:w-16 sm:h-16" },
                { key: "usdc-r", bg: "from-blue-500 to-blue-700", size: "w-13 h-13 sm:w-[68px] sm:h-[68px]" },
                { key: "eth-r", bg: "from-slate-500 to-slate-800", size: "w-14 h-14 sm:w-[74px] sm:h-[74px]" },
                { key: "cadra-r", bg: "from-sky-400 to-blue-600", size: "w-14 h-14 sm:w-[74px] sm:h-[74px]" },
                { key: "sol-r", bg: "from-violet-500 to-purple-800", size: "w-13 h-13 sm:w-[68px] sm:h-[68px]" },
                { key: "usdt-r", bg: "from-teal-500 to-emerald-700", size: "w-12 h-12 sm:w-16 sm:h-16" },
              ].map((t) => (
                <div key={t.key} className={`${t.size} rounded-full bg-gradient-to-b ${t.bg}`} />
              ))}
            </div>
          </div>

          {/* 3 Numbered Cadra Lifecycle Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                1
              </div>

              <div className="py-5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-neutral-950 flex items-center justify-center">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-medium text-neutral-300">Epoch queue · Hook-owned custody</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Deposit into a Vault</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  Supply WETH/USDC into a curator&apos;s pool. Deposits queue cleanly to settle at epoch boundaries.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                2
              </div>

              <div className="py-4 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <p className="text-[11px] font-medium text-neutral-400 text-center">Mandate-Checked Ranges</p>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.05] text-white">
                    <span className="font-medium">WETH / USDC 0.05%</span>
                    <span className="text-emerald-400 text-[11px]">In Band</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] text-neutral-400">
                    <span>Max Shortfall</span>
                    <span className="text-[11px]">5.0% TWAP</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Curator Rebalances</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  The curator manages concentrated Uniswap v4 ticks within immutable on-chain mandate limits.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                3
              </div>

              <div className="py-5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[12px] font-medium">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Asymmetric Settlement</span>
                </div>
                <span className="text-[12px] text-neutral-400">Fees only above The Pace</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Settle Against The Pace</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  Beat The Pace and share surplus alpha; lag behind and the curator&apos;s USDC bond pays followers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BUILT FOR ALIGNMENT, SAFETY, AND CLARITY
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 sm:py-32 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-[46px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
            Built for alignment, safety, and clarity
          </h2>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            Cadra aligns liquidity curators and followers through enforceable Uniswap v4 hook rules—not off-chain trust.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: 3D Metallic Chrome Titanium Shield */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-64 h-72 sm:w-72 sm:h-80 flex items-center justify-center">
              <svg className="w-full h-full drop-shadow-[0_28px_40px_rgba(0,0,0,0.18)]" viewBox="0 0 240 280" fill="none">
                <defs>
                  <linearGradient id="shieldChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="28%" stopColor="#d4d4d8" />
                    <stop offset="55%" stopColor="#52525b" />
                    <stop offset="82%" stopColor="#e4e4e7" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>
                  <linearGradient id="shieldCore" x1="15%" y1="0%" x2="85%" y2="100%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="45%" stopColor="#111113" />
                    <stop offset="100%" stopColor="#050506" />
                  </linearGradient>
                </defs>
                <path
                  d="M120 18 L202 58 C202 162 162 222 120 262 C78 222 38 162 38 58 Z"
                  fill="url(#shieldChrome)"
                />
                <path
                  d="M120 32 L187 68 C187 152 153 207 120 242 C87 207 53 152 53 68 Z"
                  fill="url(#shieldCore)"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
                <path
                  d="M120 32 L187 68 C185 112 168 152 120 182 Z"
                  fill="#ffffff"
                  fillOpacity="0.06"
                />
                <g transform="translate(94, 108)">
                  <path
                    d="M8 24A24 24 0 0 1 50.39 8.57L41.96 15.64A13 13 0 0 0 19 24Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M0 28A24 24 0 0 0 42.39 43.43L33.96 36.36A13 13 0 0 1 11 28Z"
                    fill="#a1a1aa"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* Right: Clean Interactive Cadra Mechanism List */}
          <div className="lg:col-span-7 divide-y divide-neutral-200">
            {FEATURE_TABS.map((tab) => {
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className="w-full text-left py-6 first:pt-0 cursor-pointer group"
                >
                  <h3
                    className={`text-xl sm:text-[26px] font-semibold tracking-[-0.025em] transition-colors ${
                      isActive ? "text-neutral-950" : "text-neutral-400 group-hover:text-neutral-700"
                    }`}
                  >
                    {tab.title}
                  </h3>

                  {isActive && (
                    <div className="space-y-4 pt-3">
                      <p className="text-[15px] text-neutral-500 leading-relaxed max-w-lg">
                        {tab.description}
                      </p>
                      <div className="w-44 h-[2.5px] bg-[#2563EB] rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: THE PACE BENCHMARK (Interactive Cadra Settlement Demo)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="bg-[#09090B] text-white rounded-[32px] p-7 sm:p-12 space-y-10">
          {/* Header + Clean Segmented Selector */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-[12px] font-medium text-emerald-400">The Pace Benchmark</p>
              <h2 className="text-2xl sm:text-[34px] font-bold tracking-[-0.03em] leading-tight text-white">
                Pay only when your curator beats the market
              </h2>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                Preview how Cadra&apos;s Uniswap v4 hook settles performance fees, enforces USDC bond protection, and triggers automated TWAP parking.
              </p>
            </div>

            <div className="inline-flex items-center bg-white/[0.06] p-1 rounded-full self-start lg:self-auto">
              {[
                { id: "ahead" as const, label: "Curator Wins", icon: <TrendUpIcon className="w-3.5 h-3.5" /> },
                { id: "behind" as const, label: "Bond Protects", icon: <ShieldIcon className="w-3.5 h-3.5" /> },
                { id: "parked" as const, label: "Safety Brake", icon: <ActivityIcon className="w-3.5 h-3.5" /> },
              ].map((item) => {
                const active = activeScenario === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScenario(item.id)}
                    className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      active ? "bg-white text-neutral-950 font-semibold" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crisp Graph Surface */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.07] p-6 sm:p-8">
            <div className="h-48 sm:h-56 w-full">
              <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="aheadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="parkedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="50" x2="800" y2="50" stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="4 4" />

                {/* The Pace Passive Benchmark */}
                <path
                  d="M 0 140 Q 200 130, 400 120 T 800 100"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text x="16" y="124" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif" fontWeight="500">
                  The Pace (Passive Full-Range Benchmark)
                </text>

                {activeScenario === "ahead" && (
                  <>
                    <path d="M 0 140 Q 200 110, 400 80 T 800 46 L 800 200 L 0 200 Z" fill="url(#aheadFill)" />
                    <path d="M 0 140 Q 200 110, 400 80 T 800 46" fill="none" stroke="#34d399" strokeWidth="3" />
                    <circle cx="792" cy="47" r="5" fill="#34d399" />
                    <text x="640" y="34" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                      +$20 above The Pace
                    </text>
                  </>
                )}

                {activeScenario === "behind" && (
                  <>
                    <path d="M 0 140 Q 200 135, 400 146 T 800 136" fill="none" stroke="#52525b" strokeWidth="2.5" />
                    <path d="M 792 136 L 792 100" stroke="#34d399" strokeWidth="2.5" strokeDasharray="3 3" />
                    <circle cx="792" cy="100" r="5" fill="#10b981" />
                    <text x="560" y="88" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                      Curator USDC bond covers shortfall
                    </text>
                  </>
                )}

                {activeScenario === "parked" && (
                  <>
                    <path d="M 0 140 Q 200 145, 380 176 L 800 176 L 800 200 L 0 200 Z" fill="url(#parkedFill)" />
                    <path d="M 0 140 Q 200 145, 380 176 L 800 176" fill="none" stroke="#38bdf8" strokeWidth="3" />
                    <circle cx="380" cy="176" r="5" fill="#f87171" />
                    <text x="400" y="166" fill="#38bdf8" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                      Capital automatically parked into The Pace
                    </text>
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* 4-Column Outcome Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <span className="text-[12px] text-neutral-400 block">Your Deposit</span>
              <div className="text-xl font-bold font-mono text-white">$1,000.00</div>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <span className="text-[12px] text-neutral-400 block">The Pace</span>
              <div className="text-xl font-bold font-mono text-neutral-200">
                {activeScenario === "parked" ? "$950.00" : "$1,010.00"}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
              <span className="text-[12px] text-neutral-400 block">Curator Result</span>
              <div className="text-xl font-bold font-mono text-white">
                {activeScenario === "ahead"
                  ? "$1,030.00"
                  : activeScenario === "behind"
                  ? "$995.00"
                  : "$900.00"}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <span className="text-[12px] text-emerald-400 font-medium block">You Keep</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {activeScenario === "ahead"
                  ? "$1,026.00"
                  : activeScenario === "behind"
                  ? "$1,010.00"
                  : "$950.00"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CADRA FOOTER
         ========================================================================= */}
      <footer className="border-t border-neutral-100 pt-20 sm:pt-28 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-16 relative z-10">
          {/* Large Centered Display Headline */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-[52px] font-bold tracking-[-0.035em] leading-[1.08] text-neutral-950">
              Follow a curator. Beat the Pace.
            </h2>
          </div>

          {/* 4-Column Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-neutral-100">
            {/* Col 1: Brand Trust, Web App CTAs & Protocol Badges (4 cols) */}
            <div className="md:col-span-4 md:border-r md:border-neutral-100 md:pr-8 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <StarIcon key={idx} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[13px] font-medium text-neutral-700">
                  Start with Cadra on Uniswap v4
                </p>
              </div>

              {/* Clean Web App Launch Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleLaunchFollower}
                  className="px-4 py-2.5 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 text-[12px] font-semibold cursor-pointer"
                >
                  <span>Launch Web App</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLaunchCurator}
                  className="px-4 py-2.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-950 transition-colors text-[12px] font-semibold cursor-pointer"
                >
                  Curator Studio
                </button>
              </div>

              {/* Clean Protocol Verification Row */}
              <div className="flex items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  <ShieldIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Uniswap v4 Hook</span>
                </div>
                <span className="text-[11px] font-medium text-neutral-400">
                  Solidity 0.8.26 · Testnet
                </span>
              </div>
            </div>

            {/* Col 2: Protocol (3 cols) */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Protocol</h4>
              <ul className="space-y-2.5 text-[13px] text-neutral-500">
                <li>
                  <Link href="/follower/portfolio" className="hover:text-neutral-950 transition-colors">
                    Follower Portfolio
                  </Link>
                </li>
                <li>
                  <Link href="/follower/explore" className="hover:text-neutral-950 transition-colors">
                    Discover Curators
                  </Link>
                </li>
                <li>
                  <Link href="/follower/queue" className="hover:text-neutral-950 transition-colors">
                    Queue &amp; Epochs
                  </Link>
                </li>
                <li>
                  <Link href="/curator/overview" className="hover:text-neutral-950 transition-colors">
                    Curator Studio
                  </Link>
                </li>
                <li>
                  <Link href="/curator/mandate" className="hover:text-neutral-950 transition-colors">
                    Mandate &amp; Rules
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Tools (2 cols) */}
            <div className="md:col-span-2 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Tools</h4>
              <ul className="space-y-2.5 text-[13px] text-neutral-500">
                <li>
                  <Link href="/leaderboard" className="hover:text-neutral-950 transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                    Live Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/curator/rebalance" className="hover:text-neutral-950 transition-colors">
                    Range Rebalancer
                  </Link>
                </li>
                <li>
                  <Link href="/curator/settlements" className="hover:text-neutral-950 transition-colors">
                    Settlements &amp; Fees
                  </Link>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-950 transition-colors">
                    Smart Contracts
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Community (3 cols) */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Community</h4>
              <p className="text-[13px] text-neutral-500">hello@cadra.finance</p>

              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <TwitterXIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                  className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <DiscordIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <YouTubeIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Protocol Info Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-neutral-500 pb-28">
            <p>Built for Atrium Academy UHI11 Hookathon · Testnet Demo</p>
            <p>© 2026 Cadra Protocol · MIT License</p>
          </div>
        </div>

        {/* Subtle Tilted Geometric Watermark Pattern */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 inset-x-0 h-32 flex items-end justify-center gap-6 pointer-events-none select-none overflow-hidden"
        >
          {[...Array(10)].map((_, idx) => (
            <div
              key={idx}
              className={`w-24 h-28 rounded-tl-[36px] rounded-tr-xl rounded-b-xl transform -rotate-12 translate-y-8 shrink-0 ${
                idx % 2 === 0
                  ? "border border-dashed border-neutral-300 bg-transparent"
                  : "bg-neutral-200/65"
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
