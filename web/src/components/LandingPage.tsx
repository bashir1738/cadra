"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldIcon,
  ArrowRightIcon,
  TrendUpIcon,
  LockIcon,
  EthereumIcon,
  UsdcIcon,
  CheckCircleIcon,
} from "./Icons";
import { TabKey } from "./Navigation";
import { CategoriesAndAdSlider } from "./CategoriesAndAdSlider";
import { PaceLiveChart } from "./PaceLiveChart";
import { useCadra } from "../context/CadraContext";

interface LandingPageProps {
  onNavigate: (tab: TabKey) => void;
  onSelectRole: (role: string) => void;
}

function HeroVisual() {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative mt-8 sm:mt-10 lg:mt-12 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] aspect-square select-none cursor-pointer group"
      style={{
        perspective: "1000px",
      }}
    >
      {/* Subtle ambient backlight glow */}

      {/* Main card with interactive 3D tilt */}
      <div
        className="w-full h-full rounded-[28px] sm:rounded-[32px] overflow-hidden duration-300 ease-out flex items-center justify-center"
        style={{
          transform: isHovered
            ? `rotateX(${tilt.y.toFixed(2)}deg) rotateY(${tilt.x.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        <video
          src="/security.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Cadra on-chain security visual"
          className="w-full h-full object-cover scale-[1.14] transition-transform duration-500"
        />
      </div>
    </div>
  );
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

const CADRA_STACK = [
  {
    layer: "01",
    title: "Follower Liquidity",
    tag: "Hook-owned",
    summary:
      "Deposits sit in hook-owned Uniswap v4 pools. Curators rebalance ticks, never withdraw.",
  },
  {
    layer: "02",
    title: "Mandate Guardrails",
    tag: "Inline checks",
    summary:
      "Every rebalance is checked on-chain against price bounds, range width, and TWAP limits.",
  },
  {
    layer: "03",
    title: "The Pace Benchmark",
    tag: "Full-range LP",
    summary:
      "Tracks what your capital would earn in a passive full-range pool, swap fees included.",
  },
  {
    layer: "04",
    title: "Bond & Settlement",
    tag: "USDC backed",
    summary:
      "Curators earn fees only above The Pace. Any shortfall is paid from their USDC bond.",
  },
];

export function LandingPage({ onNavigate, onSelectRole }: LandingPageProps) {
  const { vaults } = useCadra();
  const [activeFeatureTab, setActiveFeatureTab] = useState<"mandate" | "parking" | "capacity">("mandate");
  const [timerKey, setTimerKey] = useState<number>(0);
  const [activeStackIndex, setActiveStackIndex] = useState<number>(0);
  const mechanismVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-advancing tab timer: runs for 6s (matching the video loop), then advances to next tab
  useEffect(() => {
    if (mechanismVideoRef.current) {
      mechanismVideoRef.current.currentTime = 0;
      mechanismVideoRef.current.play().catch(() => {});
    }

    const timer = setTimeout(() => {
      setActiveFeatureTab((curr) => {
        const idx = FEATURE_TABS.findIndex((t) => t.id === curr);
        return FEATURE_TABS[(idx + 1) % FEATURE_TABS.length].id;
      });
      setTimerKey((k) => k + 1);
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeFeatureTab, timerKey]);

  const handleSelectFeatureTab = (tabId: "mandate" | "parking" | "capacity") => {
    setActiveFeatureTab(tabId);
    setTimerKey((k) => k + 1);
  };

  const handleLaunchFollower = () => {
    onSelectRole("follower");
    onNavigate("follower");
  };

  const handleLaunchCurator = () => {
    onSelectRole("curator-tight");
    onNavigate("curator-studio");
  };

  return (
    <div className="font-sans text-neutral-950 bg-white overflow-x-clip">
      {/* =========================================================================
          SECTION 1: HERO (Minimal Centered Text Above + Interactive Centerpiece Below)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 lg:pt-16 pb-14 sm:pb-20 lg:pb-24">
        <div className="flex flex-col items-center text-center">
          {/* Top Minimal Copy */}
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <h1 className="text-[36px] sm:text-[50px] md:text-[58px] lg:text-[64px] font-bold tracking-[-0.035em] leading-[1.08] text-neutral-950">
              Follow a curator. Beat the Pace.
            </h1>

            <p className="text-[15px] sm:text-[17px] text-neutral-500 max-w-3xl leading-relaxed font-normal mt-3 sm:mt-4">
              Curated Uniswap v4 liquidity backed by real USDC bonds, with Reactive Network quietly watching over every vault when markets move outside the rules.
            </p>

            {/* Primary Actions: Two-Tone Medicine Pill Capsule */}
            <div className="relative inline-flex items-stretch rounded-full overflow-hidden border border-neutral-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] mt-6 sm:mt-7 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.18)] transition-all active:scale-[0.99] group/pill">
              {/* Subtle Pill Shell Specular Sheen */}
              <div className="pointer-events-none absolute inset-x-3 top-0.5 h-[40%] rounded-t-full bg-gradient-to-b from-white/25 to-transparent z-20" />

              {/* Left Capsule Half: Dark */}
              <button
                onClick={handleLaunchFollower}
                className="relative z-10 h-11 sm:h-12 pl-6 sm:pl-7 pr-5 sm:pr-6 bg-neutral-950 text-white hover:bg-neutral-900 active:bg-black transition-colors inline-flex items-center justify-center gap-2 text-[13px] sm:text-[14px] font-semibold cursor-pointer group/btn"
              >
                <span>Launch App</span>
                <ArrowRightIcon className="w-4 h-4 text-white/80 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-transform" />
              </button>

              {/* Pill Center Seam / Interlocking Joint */}
              <div className="w-[1.5px] bg-neutral-300 self-stretch relative z-20 shadow-[inset_0_0_1px_rgba(0,0,0,0.1)]" />

              {/* Right Capsule Half: White */}
              <button
                onClick={handleLaunchCurator}
                className="relative z-10 h-11 sm:h-12 pl-5 sm:pl-6 pr-6 sm:pr-7 bg-white text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 transition-colors inline-flex items-center justify-center gap-1.5 text-[13px] sm:text-[14px] font-semibold cursor-pointer"
              >
                <span>Curator Studio</span>
              </button>
            </div>
          </div>

          {/* Interactive Looping Visual Centerpiece */}
          <HeroVisual />
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
                  Curators rebalance positions atomically inside Uniswap v4 but can never withdraw follower funds. Every epoch is measured live against The Pace, while Reactive Network listens for breaches and dispatches authenticated safety callbacks across chains.
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
                    <p className="text-[26px] font-bold tracking-[-0.03em] text-neutral-950 font-mono" suppressHydrationWarning>
                      {(() => {
                        const totalTvl = vaults.reduce((acc, v) => acc + v.totalFollowerValue + v.bondAmount, 0);
                        return totalTvl > 0
                          ? `$${totalTvl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "$12,450.80";
                      })()}
                    </p>
                    <p className="text-[12px] font-medium text-emerald-600" suppressHydrationWarning>
                      {(() => {
                        const best = vaults
                          .filter((v) => v.paceValue > 0)
                          .sort((a, b) => (b.vaultValue - b.paceValue) - (a.vaultValue - a.paceValue))[0];
                        if (best) {
                          const pct = ((best.vaultValue - best.paceValue) / best.paceValue) * 100;
                          return pct >= 0
                            ? `+${pct.toFixed(1)}% ahead of The Pace`
                            : `${pct.toFixed(1)}% vs The Pace`;
                        }
                        return "+18.4% ahead of The Pace";
                      })()}
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
      <section id="strategies" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-8">
        <div className="space-y-2 max-w-xl">
          <p className="text-[12px] font-medium tracking-[0.12em] uppercase text-neutral-400">
            Vault Strategies
          </p>
          <h2 className="text-3xl sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.08] text-neutral-950">
            Curated liquidity for every risk profile
          </h2>
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
          SECTION 4: THE CADRA STACK (Clean Interactive Layer Stack Concept)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="bg-[#050506] text-white rounded-[32px] sm:rounded-[40px] py-16 sm:py-24 px-6 sm:px-12 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-56 bg-white/[0.035] blur-3xl rounded-full pointer-events-none"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Minimal Heading + Progress Rail */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <p className="text-[12px] font-medium tracking-[0.12em] uppercase text-neutral-500">
                  The Cadra Stack
                </p>
                <h2 className="text-3xl sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.08] text-white">
                  Active liquidity, simplified
                </h2>
                <p className="text-[15px] text-neutral-400 leading-relaxed max-w-sm">
                  Four on-chain layers enforced inside one Uniswap v4 hook.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {CADRA_STACK.map((item, idx) => (
                  <button
                    key={item.layer}
                    type="button"
                    onClick={() => setActiveStackIndex(idx)}
                    aria-label={`Select layer ${item.layer}`}
                    className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                      activeStackIndex === idx
                        ? "w-10 bg-white"
                        : "w-4 bg-white/20 hover:bg-white/35"
                    }`}
                  />
                ))}
                <span className="ml-2 text-[12px] font-mono text-neutral-500">
                  0{activeStackIndex + 1} / 04
                </span>
              </div>
            </div>

            {/* Right Column: Clean Interactive Layered Stack */}
            <div className="lg:col-span-7">
              <div className="space-y-2.5">
                {CADRA_STACK.map((item, idx) => {
                  const isActive = activeStackIndex === idx;
                  const icons = [
                    <ShieldIcon key="0" className="w-4 h-4" />,
                    <LockIcon key="1" className="w-4 h-4" />,
                    <TrendUpIcon key="2" className="w-4 h-4" />,
                    <CheckCircleIcon key="3" className="w-4 h-4" />,
                  ];

                  return (
                    <button
                      key={item.layer}
                      type="button"
                      onClick={() => setActiveStackIndex(idx)}
                      className={`w-full text-left rounded-[24px] border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-[#111114] border-white/[0.18] px-6 sm:px-7 py-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
                          : "bg-[#09090B] border-white/[0.07] hover:border-white/[0.13] px-6 sm:px-7 py-4 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`text-[12px] font-mono font-medium shrink-0 transition-colors ${
                              isActive ? "text-emerald-400" : "text-neutral-500"
                            }`}
                          >
                            {item.layer}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isActive
                                ? "bg-white text-neutral-950"
                                : "bg-white/[0.05] text-neutral-400"
                            }`}
                          >
                            {icons[idx]}
                          </div>
                          <span
                            className={`text-[16px] font-semibold tracking-tight truncate transition-colors ${
                              isActive ? "text-white" : "text-neutral-300"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-500 shrink-0">
                          {item.tag}
                        </span>
                      </div>

                      {isActive && (
                        <p className="pt-3.5 mt-3.5 border-t border-white/[0.08] text-[14px] text-neutral-400 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </button>
                  );
                })}
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
          {/* Left: Mechanism Visual Video (Seamless without border or white background card) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square flex items-center justify-center">
              <video
                ref={mechanismVideoRef}
                src="/user_friendly_interface.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label="Cadra mechanism visual preview"
                className="w-full h-full object-contain"
              />
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
                  onClick={() => handleSelectFeatureTab(tab.id)}
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
                      {/* Active timer bar: fills smoothly from 0% to 100% and opens next section */}
                      <div className="w-48 sm:w-56 h-[3px] bg-neutral-200/70 rounded-full overflow-hidden">
                        <div
                          key={`timer-${tab.id}-${timerKey}`}
                          className="h-full bg-[#2563EB] rounded-full animate-progress-timer"
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: THE PACE BENCHMARK (Interactive Live Hover Chart)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24 sm:pb-32">
        <PaceLiveChart />
      </section>

      {/* =========================================================================
          SECTION 7: MINIMAL CADRA FOOTER
         ========================================================================= */}
      <footer className="border-t border-neutral-100 pt-20 sm:pt-28 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-14 relative z-10">
          {/* Centered Display Headline */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-[52px] font-bold tracking-[-0.035em] leading-[1.08] text-neutral-950">
              Follow a curator. Beat the Pace.
            </h2>
          </div>

          {/* Single Clean Footer Bar */}
          <div className="border-t border-neutral-100 pt-8 pb-28 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Brand (Icon Only) */}
            <Link href="/" aria-label="Cadra" className="flex items-center shrink-0">
              <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center p-1.5 hover:bg-neutral-800 transition-colors shadow-sm">
                <img
                  src="/cadra/logo/cadra-mark-white.svg"
                  alt="Cadra"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>

            {/* Minimal Navigation */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-neutral-500">
              <Link href="/follower/explore" className="hover:text-neutral-950 transition-colors">
                Vaults
              </Link>
              <Link href="/curator/overview" className="hover:text-neutral-950 transition-colors">
                Studio
              </Link>
              <Link href="/leaderboard" className="hover:text-neutral-950 transition-colors">
                Leaderboard
              </Link>
              <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                Simulator
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-[12px] text-neutral-400">© 2026 Cadra</p>
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
