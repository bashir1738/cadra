"use client";

import React, { useState } from "react";
import { ShieldIcon, UserIcon, ArrowRightIcon, ActivityIcon, CheckCircleIcon, TrendUpIcon } from "./Icons";
import { TabKey } from "./Navigation";
import { CadraBlackSpotlightCard } from "./CadraSpotlightCard";

interface LandingPageProps {
  onNavigate: (tab: TabKey) => void;
  onSelectRole: (role: string) => void;
}

export function LandingPage({ onNavigate, onSelectRole }: LandingPageProps) {
  const [activeScenario, setActiveScenario] = useState<"ahead" | "behind" | "parked">("ahead");

  const handleLaunchFollower = () => {
    onSelectRole("follower");
    onNavigate("follower");
  };

  const handleLaunchCurator = () => {
    onSelectRole("curator-tight");
    onNavigate("curator-studio");
  };

  return (
    <div className="font-sans text-neutral-800 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-20 bg-white">
      {/* 1. Hero Section: Warm, Approachable & Clear */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/90 text-xs text-neutral-800 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-neutral-900">Uniswap v4 Hook</span>
          <span className="text-neutral-400">·</span>
          <span>Curated Liquidity with Continuous Protection</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-950">
          Follow expert curators. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 via-neutral-800 to-neutral-900">
            Pay only when they actually beat the Pace.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Managing concentrated liquidity is tricky. Cadra lets you copy top curators with complete peace of mind.
          We measure everything against <strong>The Pace</strong>—what your money would have earned doing nothing in a plain passive pool.
          If your curator outperforms, they earn a fair fee. If they fall behind, their personal cash bond pays you right back.
        </p>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleLaunchFollower}
            className="px-7 py-3.5 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Start Earning (Follow)</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLaunchCurator}
            className="px-7 py-3.5 rounded-full bg-neutral-100 border border-neutral-200 hover:bg-neutral-200/70 text-neutral-900 font-semibold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Manage a Vault (Curate)</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigate("simulator")}
            className="px-5 py-3.5 text-neutral-500 hover:text-neutral-900 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ActivityIcon className="w-4 h-4 text-neutral-600" />
            <span>Try the Playground Demo</span>
          </button>
        </div>
      </section>

      {/* 2. Official Cadra Brand Spotlight Card with Black Background & Telemetry */}
      <section>
        <CadraBlackSpotlightCard
          onFollowClick={handleLaunchFollower}
          onCurateClick={handleLaunchCurator}
        />
      </section>

      {/* 3. Interactive "The Pace" Visualizer with High-Contrast Sleek Black Cockpit */}
      <section className="bg-neutral-50/80 border border-neutral-200/90 rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest text-neutral-500 uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>INTERACTIVE DEMO</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
              How Cadra Protects Your Money
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Click a scenario below to see how fees, cash bonds, and safety nets protect your capital:
            </p>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-200/70 p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setActiveScenario("ahead")}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeScenario === "ahead"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              ✨ Curator Wins (+Alpha)
            </button>
            <button
              onClick={() => setActiveScenario("behind")}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeScenario === "behind"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              🛡️ Curator Lags (Bond Protects)
            </button>
            <button
              onClick={() => setActiveScenario("parked")}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeScenario === "parked"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              🪂 Market Drops Fast (Safety Net)
            </button>
          </div>
        </div>

        {/* Visual Graph with Sleek Black Background & Animated Scenario Details */}
        <div className="p-6 rounded-3xl bg-[#09090b] border border-neutral-800 shadow-xl space-y-6 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side: Interactive SVG Curve Graph */}
            <div className="w-full lg:w-2/3 h-52 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curatorAheadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="parkedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="50" x2="800" y2="50" stroke="#27272a" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#27272a" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#27272a" strokeDasharray="4 4" />

                {/* The Pace Benchmark Line (Crisp Silver Dashed) */}
                <path
                  d="M 0 140 Q 200 130, 400 120 T 800 100"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <text x="30" y="125" fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="600">
                  THE PACE BENCHMARK (Passive Pool)
                </text>

                {/* Curator Strategy Curve */}
                {activeScenario === "ahead" && (
                  <>
                    <path
                      d="M 0 140 Q 200 110, 400 80 T 800 48"
                      fill="url(#curatorAheadGrad)"
                    />
                    <path
                      d="M 0 140 Q 200 110, 400 80 T 800 48"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3.5"
                    />
                    <circle cx="800" cy="48" r="6" fill="#34d399" className="animate-pulse" />
                    <text x="630" y="38" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
                      ✨ +$20 Above The Pace!
                    </text>
                  </>
                )}

                {activeScenario === "behind" && (
                  <>
                    {/* Underlying Curator lag */}
                    <path
                      d="M 0 140 Q 200 135, 400 145 T 800 135"
                      fill="none"
                      stroke="#52525b"
                      strokeWidth="2.5"
                    />
                    {/* Bond Compensation Vector bringing follower back up */}
                    <path
                      d="M 800 135 L 800 100"
                      stroke="#34d399"
                      strokeWidth="3"
                      strokeDasharray="3 3"
                    />
                    <circle cx="800" cy="100" r="6" fill="#10b981" />
                    <text x="540" y="90" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
                      🛡️ Curator cash bond covers -$15 shortfall!
                    </text>
                  </>
                )}

                {activeScenario === "parked" && (
                  <>
                    <path
                      d="M 0 140 Q 200 145, 380 180 L 800 180"
                      fill="url(#parkedGrad)"
                    />
                    <path
                      d="M 0 140 Q 200 145, 380 180 L 800 180"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="3"
                    />
                    <circle cx="380" cy="180" r="7" fill="#ef4444" />
                    <text x="400" y="172" fill="#38bdf8" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                      🪂 Emergency brake: capital safely parked into The Pace
                    </text>
                  </>
                )}
              </svg>
            </div>

            {/* Right side: Clean Telemetry Scenario Card */}
            <div className="w-full lg:w-1/3 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
              {activeScenario === "ahead" && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                    <TrendUpIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      +ALPHA GENERATED
                    </span>
                    <h4 className="text-sm font-bold text-white">Curator Wins &amp; Earns Fee</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Curator earns 20% of profits, you keep the remaining 80%!
                    </p>
                  </div>
                </>
              )}
              {activeScenario === "behind" && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                    <ShieldIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      BOND PROTECTED
                    </span>
                    <h4 className="text-sm font-bold text-white">Curator Bond Pays Back</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Curator&apos;s personal bond makes you whole. Zero loss on trail!
                    </p>
                  </div>
                </>
              )}
              {activeScenario === "parked" && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
                    <ActivityIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-sky-400 block font-mono">
                      SAFETY BRAKE ENGAGED
                    </span>
                    <h4 className="text-sm font-bold text-white">Automated TWAP Parking</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Hook automatically liquidated active band and parked funds safely.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Numeric Breakdown Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 uppercase text-xs font-semibold block">Your Deposit</span>
              <div className="text-xl font-bold text-white">$1,000.00</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 uppercase text-xs font-semibold block">The Pace (Normal Pool)</span>
              <div className="text-xl font-bold text-neutral-200">
                {activeScenario === "parked" ? "$950.00" : "$1,010.00"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 uppercase text-xs font-semibold block">Curator Result</span>
              <div className="text-xl font-bold text-white">
                {activeScenario === "ahead" ? "$1,030.00" : activeScenario === "behind" ? "$995.00" : "$900.00 (Parked)"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-1">
              <span className="text-emerald-400 uppercase text-xs font-bold block">You Take Home</span>
              <div className="text-xl font-bold text-emerald-400">
                {activeScenario === "ahead" ? "$1,026.00" : activeScenario === "behind" ? "$1,010.00" : "$950.00"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-neutral-300">
            <p className="leading-relaxed">
              {activeScenario === "ahead" && (
                <>
                  <strong className="text-white font-semibold">Fair Win-Win:</strong> Your curator beat the passive pool by +$20. They earned a 20% performance fee ($4), and you kept the rest ($1,026).
                </>
              )}
              {activeScenario === "behind" && (
                <>
                  <strong className="text-white font-semibold">Honest Downside Protection:</strong> The curator lagged the normal pool by -$15. You didn&apos;t pay a single cent in fees, and the curator&apos;s cash bond paid you back so you finished with the full $1,010.
                </>
              )}
              {activeScenario === "parked" && (
                <>
                  <strong className="text-white font-semibold">Automatic Emergency Brake:</strong> The vault fell 5% behind the normal pool. The hook automatically paused the curator and shifted your funds into the safe benchmark pool.
                </>
              )}
            </p>
            <button
              onClick={() => onNavigate("simulator")}
              className="text-white hover:text-emerald-400 shrink-0 font-medium text-xs underline cursor-pointer transition-colors"
            >
              Test it in the Playground →
            </button>
          </div>
        </div>
      </section>

      {/* 4. Dual Role Showcase: Follower vs Curator (High-Contrast White & Black Cards) */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-mono tracking-widest text-neutral-500 font-bold">
            CHOOSE YOUR ADVENTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Two Simple Ways to Use Cadra
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Follower Card (Clean Crisp White) */}
          <div className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-7 shadow-xs hover:shadow-md transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
                  <UserIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold">
                  Passive Earners
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-neutral-950 tracking-tight">Follower Portal</h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">For Liquidity Providers & Everyday Earners</p>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Follow top liquidity curators without worrying about underperformance. You never pay fees for simple market luck, and cash bonds protect your downside.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100 text-xs text-neutral-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Zero fee on luck:</strong> Only pay when your manager beats passive holding</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Cash bond guarantee:</strong> Curators reimburse you if they underperform</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Safety net parking:</strong> Automated pause on unexpected market swings</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchFollower}
              className="w-full py-3.5 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Explore Follower Portal</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Curator Card (Sleek Black Background) */}
          <div className="bg-[#09090b] border border-neutral-800 hover:border-neutral-700 rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-7 shadow-xl hover:shadow-2xl transition-all text-white">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center shadow-xs">
                  <ShieldIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-semibold">
                  Active Managers
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Curator Studio</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">For Active Strategists & Liquidity Pros</p>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                Publish a clear strategy, manage pooled liquidity across Uniswap v4 ranges, and scale your managing capacity as your record proves itself.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-neutral-800 text-xs text-neutral-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Honest 20% performance fee:</strong> Earn real rewards for real skill</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Growing capacity:</strong> Scale from 5× up to 20× your posted bond</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Instant rule checker:</strong> Rebalance smoothly within agreed bounds</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchCurator}
              className="w-full py-3.5 rounded-full bg-white text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Open Curator Studio</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Three Simple Promises with Black Accent Badges */}
      <section className="border-t border-neutral-200 pt-16 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Three Simple Promises
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <span className="text-sm font-bold font-mono">01</span>
            </div>
            <h3 className="font-bold text-neutral-950 text-base">Rules Enforced by Smart Contracts</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-normal">
              Curators publish clear price bands and limits. The Uniswap hook automatically rejects any move that breaks the rules.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <span className="text-sm font-bold font-mono">02</span>
            </div>
            <h3 className="font-bold text-neutral-950 text-base">The Pace Baseline</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-normal">
              We measure performance against what you would have earned doing nothing in the standard pool. True alpha only.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <span className="text-sm font-bold font-mono">03</span>
            </div>
            <h3 className="font-bold text-neutral-950 text-base">Curator Cash Bonds</h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-normal">
              Curators post real cash (USDC) before taking followers. If they trail the market, their bond pays you back.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
