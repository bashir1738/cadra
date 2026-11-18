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
  ChevronRightSmallIcon,
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
    id: "security" as const,
    title: "Security",
    description:
      "Non-custodial Uniswap v4 hooks backed by real curator cash bonds. If a curator lags The Pace benchmark, their posted collateral automatically covers your shortfall.",
  },
  {
    id: "support" as const,
    title: "24/7 Safety Brake",
    description:
      "Continuous on-chain TWAP monitoring protects your liquidity around the clock. If market conditions breach mandate bounds, capital parks automatically into the passive pool.",
  },
  {
    id: "interface" as const,
    title: "User-friendly interface",
    description:
      "One clean cockpit for following curators, tracking live performance against The Pace, and spending crypto yields across everyday merchants without DeFi friction.",
  },
];

export function LandingPage({ onNavigate, onSelectRole }: LandingPageProps) {
  const [activeScenario, setActiveScenario] = useState<"ahead" | "behind" | "parked">("ahead");
  const [activeFeatureTab, setActiveFeatureTab] = useState<"security" | "support" | "interface">("security");

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
          SECTION 1: HERO (Spenda-inspired Minimalist Layout)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-7 text-left">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EEF4FF] text-[#1D4ED8] text-[13px] font-medium">
              Spend &amp; Earn your Crypto with Ease
            </div>

            <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] font-bold tracking-[-0.04em] leading-[1.06] text-neutral-950">
              Crypto spending &amp; liquidity made easy
            </h1>

            <p className="text-[16px] sm:text-[17px] text-neutral-500 max-w-[480px] leading-[1.65] font-normal">
              Cadra reduces the steps required to earn curated Uniswap v4 yields, protect capital with real bonds, and spend crypto in your day-to-day life.
            </p>

            {/* Primary Web App Launch Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
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

          {/* Right Column: Soft Isometric Backdrop + Titanium Phone Mockup */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[480px] sm:min-h-[540px]">
            {/* Tilted Isometric White Tile Grid fading softly into white */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none hero-grid-mask">
              <div className="grid grid-cols-3 gap-4 transform -rotate-12 skew-y-6 scale-105">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-36 h-48 rounded-[24px] bg-gradient-to-br from-neutral-50 to-neutral-100/70 border border-neutral-200/70 shadow-[0_12px_30px_rgba(0,0,0,0.03)]"
                  />
                ))}
              </div>
            </div>

            {/* Sleek Titanium iPhone Mockup */}
            <div className="relative z-10 w-[290px] sm:w-[310px] rounded-[46px] bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200 p-[5px] shadow-[0_32px_70px_-20px_rgba(0,0,0,0.22)]">
              <div className="rounded-[41px] bg-neutral-950 p-[8px]">
                <div className="bg-white rounded-[34px] px-4 pt-3 pb-5 space-y-4">
                  {/* Dynamic Island */}
                  <div className="w-20 h-[18px] rounded-full bg-neutral-950 mx-auto" />

                  {/* Screen Header */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[13px] font-semibold text-neutral-950">Select crypto</span>
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Uniswap v4
                    </span>
                  </div>

                  {/* Quick Asset Pills */}
                  <div className="space-y-1.5">
                    <div className="px-3 py-2.5 rounded-xl bg-neutral-50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center p-1">
                          <BitcoinIcon className="w-full h-full" />
                        </div>
                        <span className="text-[12px] font-semibold text-neutral-900">BTC</span>
                      </div>
                      <ChevronRightSmallIcon className="w-3 h-3 text-neutral-400" />
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-neutral-50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 flex items-center justify-center p-1">
                          <TetherIcon className="w-full h-full" />
                        </div>
                        <span className="text-[12px] font-semibold text-neutral-900">USDT</span>
                      </div>
                      <ChevronRightSmallIcon className="w-3 h-3 text-neutral-400" />
                    </div>
                  </div>

                  {/* Network Selector Sheet */}
                  <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                    <p className="text-[12px] font-semibold text-neutral-950">Select Network</p>
                    <div className="p-2.5 rounded-xl bg-[#F4F7FF] text-[10px] text-neutral-600 leading-relaxed">
                      Choose a verified liquidity rail to deposit, follow curators, or spend instantly.
                    </div>

                    <div className="divide-y divide-neutral-100 text-[12px]">
                      {[
                        { name: "Ethereum (Uniswap v4)", badge: "+14.8% APY", highlight: true },
                        { name: "Bitcoin (BTC)", badge: null, highlight: false },
                        { name: "Base (BASE)", badge: null, highlight: false },
                        { name: "Solana (SOL)", badge: null, highlight: false },
                      ].map((net) => (
                        <div
                          key={net.name}
                          className="py-2.5 flex items-center justify-between"
                        >
                          <span className="font-medium text-neutral-800">{net.name}</span>
                          <div className="flex items-center gap-1.5">
                            {net.badge && (
                              <span className="text-[10px] font-semibold text-emerald-600">
                                {net.badge}
                              </span>
                            )}
                            <ChevronRightSmallIcon className="w-3 h-3 text-neutral-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BENTO CARDS — "Built for daily use." (Spenda Screenshot 2)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <p className="text-xl sm:text-2xl font-semibold text-neutral-400 tracking-[-0.02em]">
            Built for daily use.
          </p>
          <h2 className="text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
            Deposit and spend instantly
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Bento Card: Clean White Canvas + Minimal Phone Protruding */}
          <div className="bg-[#FAFAFA] border border-neutral-200/75 rounded-[32px] pt-10 px-8 sm:px-12 pb-0 flex flex-col justify-between overflow-hidden min-h-[480px]">
            <div className="space-y-2.5 max-w-sm">
              <h3 className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em] leading-tight">
                Live vault telemetry, zero custody risk
              </h3>
              <p className="text-[14px] text-neutral-500 leading-relaxed">
                Track your curated liquidity positions in real time as every epoch is benchmarked against The Pace.
              </p>
            </div>

            {/* Minimalist iPhone Frame Protruding from Bottom */}
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

          {/* Right Bento Card: Warm Peach Gradient + Sculpted 3D Coins */}
          <div className="bg-gradient-to-b from-[#FFF4EB] via-[#FFEFE2] to-[#FFE6D3] border border-[#FED7AA]/40 rounded-[32px] p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[480px] group">
            {/* Sculpted 3D Floating Gold BTC & Emerald USDT Coins */}
            <div className="relative h-56 sm:h-60 flex items-center justify-center">
              {/* Gold Bitcoin Coin */}
              <div className="absolute left-4 sm:left-10 top-2 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#B45309] via-[#F59E0B] to-[#FEF08A] p-1.5 shadow-[0_24px_48px_-12px_rgba(180,83,9,0.45)] transform -rotate-12 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                <div className="w-full h-full rounded-full border-[3px] border-yellow-200/70 bg-gradient-to-br from-[#FBBF24] via-[#D97706] to-[#92400E] flex items-center justify-center text-white p-5">
                  <BitcoinIcon className="w-full h-full drop-shadow-md" />
                </div>
              </div>

              {/* Emerald Tether Coin */}
              <div className="absolute right-4 sm:right-10 top-12 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#0F766E] via-[#14B8A6] to-[#99F6E4] p-1.5 shadow-[0_24px_48px_-12px_rgba(15,118,110,0.45)] transform rotate-12 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <div className="w-full h-full rounded-full border-[3px] border-teal-200/70 bg-gradient-to-br from-[#2DD4BF] via-[#0D9488] to-[#115E59] flex items-center justify-center text-white p-5">
                  <TetherIcon className="w-full h-full drop-shadow-md" />
                </div>
              </div>
            </div>

            {/* Bottom Clean Copy & CTA */}
            <div className="space-y-4 pt-6">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-[30px] font-bold text-neutral-950 tracking-[-0.03em] leading-[1.15]">
                  Deposit crypto. Get local cash instantly
                </h3>
                <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md">
                  Fund your Cadra account directly from any crypto wallet or vault and spend instantly with zero P2P friction.
                </p>
              </div>
              <div className="pt-1">
                <button
                  onClick={handleLaunchFollower}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Depositing</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: EVERYDAY SPENDING CATEGORIES & 3-SLIDE CAROUSEL
         ========================================================================= */}
      <section id="categories" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold text-neutral-400">Everyday Commerce</p>
            <h2 className="text-3xl sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
              Spend your yields anywhere
            </h2>
          </div>
          <p className="text-[14px] text-neutral-500 max-w-sm">
            Filter merchants across six everyday categories and settle straight from your Cadra balance.
          </p>
        </div>

        <CategoriesAndAdSlider onExploreProducts={() => handleLaunchFollower()} />
      </section>

      {/* =========================================================================
          SECTION 4: FULL-BLEED PURE BLACK SECTION (Spenda Screenshot 3)
          "Turn crypto into everyday spending"
         ========================================================================= */}
      <section className="w-full bg-black text-white py-24 sm:py-32 mt-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-[48px] font-bold tracking-[-0.035em] leading-[1.08] text-white">
              Turn crypto into everyday spending
            </h2>
            <p className="text-[15px] text-neutral-400 leading-relaxed">
              Cadra simplifies curated liquidity and crypto spending, making it effortless for both beginners and experienced users to transact seamlessly.
            </p>
          </div>

          {/* 3D Token Showcase + Mirror Floor Reflection */}
          <div className="relative py-6 max-w-2xl mx-auto">
            {/* Soft Ambient Depth Halo */}
            <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-24 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Subtle Blurred Receding Background Tokens */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 opacity-30 blur-[1px] -mb-4 scale-90 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-blue-600/60" />
              <div className="w-9 h-9 rounded-full bg-emerald-500/50" />
              <div className="w-10 h-10 rounded-full bg-indigo-500/50" />
              <div className="w-9 h-9 rounded-full bg-amber-500/50" />
            </div>

            {/* Primary Crisp Foreground Token Arc */}
            <div className="relative z-10 flex items-center justify-center gap-3.5 sm:gap-6">
              {[
                { key: "btc", bg: "from-amber-500 to-amber-700", ring: "ring-amber-400/30", size: "w-12 h-12 sm:w-16 sm:h-16", icon: <BitcoinIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> },
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
                { key: "btc-r", bg: "from-amber-500 to-amber-700", size: "w-12 h-12 sm:w-16 sm:h-16" },
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

          {/* 3 Numbered Obsidian Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                1
              </div>

              {/* Clean Mini Visual */}
              <div className="py-5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-neutral-950 flex items-center justify-center">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-medium text-neutral-300">Non-custodial wallet ready</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Deposit or Connect</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  Connect your wallet or fund your Cadra vault with USDC, ETH, or BTC in seconds.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                2
              </div>

              {/* Clean Mini Visual matching Spenda "Choose Your Token" */}
              <div className="py-4 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <p className="text-[11px] font-medium text-neutral-400 text-center">Choose Your Token</p>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.05] text-white">
                    <span className="font-medium">WETH / USDC v4</span>
                    <span className="text-emerald-400 text-[11px]">Active</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] text-neutral-400">
                    <span>USDC Virtual Card</span>
                    <span className="text-[11px]">Instant</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Choose Your Vault</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  Follow an audited curator strategy or allocate directly to your spending card.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] p-7 flex flex-col justify-between space-y-8 hover:border-white/[0.15] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white font-mono text-xs font-semibold flex items-center justify-center">
                3
              </div>

              {/* Clean Mini Visual */}
              <div className="py-5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[12px] font-medium">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Bond Protected</span>
                </div>
                <span className="text-[12px] text-neutral-400">Pay only when curator beats The Pace</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[18px] font-semibold text-white tracking-tight">Earn &amp; Spend Instantly</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">
                  Keep upside alpha, stay protected by curator cash bonds, and spend anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BUILT FOR SPEED, CLARITY, AND CONTROL (Spenda Screenshot 4)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 sm:py-32 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-[46px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
            Built for speed, clarity, and control
          </h2>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            Cadra helps you move from curated crypto liquidity to everyday payments securely and without stress.
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

          {/* Right: Clean Interactive Accordion List */}
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
          SECTION 6: THE PACE BENCHMARK (Cadra Core Mechanism Visualizer)
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
                Preview how Cadra&apos;s Uniswap v4 hook settles performance fees, enforces bond protection, and triggers the safety brake.
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
                  The Pace (Passive Pool Benchmark)
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
                    <text x="570" y="88" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                      Curator cash bond covers shortfall
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
          SECTION 7: SPEND YOUR CRYPTO YOUR WAY & FOOTER (Spenda Screenshot 5)
         ========================================================================= */}
      <footer className="border-t border-neutral-100 pt-20 sm:pt-28 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-16 relative z-10">
          {/* Large Centered Display Headline */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-[52px] font-bold tracking-[-0.035em] leading-[1.08] text-neutral-950">
              Spend your Crypto your way
            </h2>
          </div>

          {/* 4-Column Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-neutral-100">
            {/* Col 1: Brand Trust, Web App CTAs & Compliance (4 cols) */}
            <div className="md:col-span-4 md:border-r md:border-neutral-100 md:pr-8 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <StarIcon key={idx} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[13px] font-medium text-neutral-700">
                  Start with Cadra today
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

              {/* Clean Compliance Row */}
              <div className="flex items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  <ShieldIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NDPC Compliant</span>
                </div>
                <span className="text-[11px] font-medium text-neutral-400">
                  Uniswap v4 Hook
                </span>
              </div>
            </div>

            {/* Col 2: Product (3 cols) */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Product</h4>
              <ul className="space-y-2.5 text-[13px] text-neutral-500">
                <li>
                  <Link href="/follower/explore" className="hover:text-neutral-950 transition-colors">
                    Crypto deposit &amp; Vaults
                  </Link>
                </li>
                <li>
                  <Link href="/follower/portfolio" className="hover:text-neutral-950 transition-colors">
                    Fiat &amp; Local deposit
                  </Link>
                </li>
                <li>
                  <Link href="/curator/overview" className="hover:text-neutral-950 transition-colors">
                    Curator Studio
                  </Link>
                </li>
                <li>
                  <Link href="/follower/queue" className="hover:text-neutral-950 transition-colors">
                    Instant transfers
                  </Link>
                </li>
                <li>
                  <Link href="/#categories" className="hover:text-neutral-950 transition-colors">
                    Virtual cards
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Company (2 cols) */}
            <div className="md:col-span-2 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Company</h4>
              <ul className="space-y-2.5 text-[13px] text-neutral-500">
                <li>
                  <Link href="/leaderboard" className="hover:text-neutral-950 transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                    Simulator
                  </Link>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-950 transition-colors">
                    Docs
                  </a>
                </li>
                <li>
                  <span className="text-neutral-400">Privacy policy</span>
                </li>
                <li>
                  <span className="text-neutral-400">Terms of use</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact Us (3 cols) */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-[14px] font-semibold text-neutral-950">Contact Us</h4>
              <p className="text-[13px] text-neutral-500">support@cadra.fi</p>

              <div className="flex items-center gap-2.5 pt-1">
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
              </div>
            </div>
          </div>

          {/* Bottom Legal Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-neutral-500 pb-28">
            <p>22 Glover Road, Ikoyi, Lagos, Nigeria</p>
            <p>All rights reserved, 2026 Cadra</p>
          </div>
        </div>

        {/* Signature Tilted Rounded-Squircle Watermark Pattern (Spenda Screenshot 5) */}
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
