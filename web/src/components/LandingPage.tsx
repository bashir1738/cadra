"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldIcon,
  UserIcon,
  ArrowRightIcon,
  ActivityIcon,
  CheckCircleIcon,
  TrendUpIcon,
  StarIcon,
  YouTubeIcon,
  InstagramIcon,
  TwitterXIcon,
  DiscordIcon,
} from "./Icons";
import { TabKey } from "./Navigation";
import { CategoriesAndAdSlider } from "./CategoriesAndAdSlider";

interface LandingPageProps {
  onNavigate: (tab: TabKey) => void;
  onSelectRole: (role: string) => void;
}

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
    <div className="font-sans text-neutral-900 bg-white space-y-24 sm:space-y-32 overflow-hidden">
      {/* =========================================================================
          SECTION 1: HERO (Matching Screenshot 1)
          - Light blue pill badge
          - Huge bold black heading
          - Clean friendly subtitle
          - Google Play & App Store black buttons
          - Tilted 3D floating tile grid backdrop with sleek iPhone 16 mockup
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Prop & App Store CTAs */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            {/* Pill Badge matching Spenda "Spend your Crypto with Ease" */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF4FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Spend &amp; Earn your Crypto with Ease</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-neutral-950">
              Crypto spending &amp; liquidity made easy for everyone
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed font-normal">
              Cadra aims to make crypto adoption and Uniswap v4 liquidity effortless by reducing the amount of steps required to earn, protect, and spend crypto in our day to day lives.
            </p>

            {/* Download Buttons: Google Play & App Store (Matching Screenshot 1) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Google Play Button */}
              <button
                onClick={handleLaunchFollower}
                className="px-5 py-3 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800 transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-3 cursor-pointer"
              >
                {/* Google Play Icon */}
                <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.793 12 3.61 22.186a2.235 2.235 0 0 1-.22-.962V2.776c0-.361.08-.696.22-.962zm11.242 11.244L4.85 23.059c.307.086.64.072.969-.117l11.534-6.61-2.502-3.274zm0-2.116l2.502-3.274L5.819 1.058c-.329-.189-.662-.203-.969-.117l10 10.001zm1.488 1.058l3.655 2.095c1.066.611 1.066 1.603 0 2.214l-3.655 2.095-2.095-3.202 2.095-3.202z" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                    Get it on
                  </div>
                  <div className="text-sm font-bold tracking-tight">Play Store</div>
                </div>
              </button>

              {/* App Store Button */}
              <button
                onClick={handleLaunchCurator}
                className="px-5 py-3 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800 transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-3 cursor-pointer"
              >
                {/* Apple Icon */}
                <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.49 2.65-1.24z" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                    Download on
                  </div>
                  <div className="text-sm font-bold tracking-tight">App Store</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate("simulator")}
                className="px-4 py-3 text-neutral-600 hover:text-neutral-950 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Try web simulator →</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tilted 3D Floating Grid + Sleek Phone Mockup (Matching Screenshot 1) */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
            {/* Tilted Isometric Floating Tiles in Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-60">
              <div
                className="grid grid-cols-3 gap-4 transform -rotate-12 skew-y-6 scale-95"
                style={{ perspective: "1000px" }}
              >
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-32 h-44 rounded-3xl bg-neutral-50/90 border border-neutral-200/80 shadow-md backdrop-blur-xs transition-transform hover:scale-105"
                  />
                ))}
              </div>
            </div>

            {/* Sleek iPhone 16 Pro Device Mockup in Foreground */}
            <div className="relative z-10 w-[300px] sm:w-[320px] rounded-[44px] bg-neutral-900 border-[6px] border-neutral-300 shadow-2xl p-3 text-white transition-all transform hover:scale-[1.01]">
              {/* Dynamic Island */}
              <div className="w-24 h-5 rounded-full bg-black mx-auto mb-3 flex items-center justify-end px-2">
                <span className="w-2 h-2 rounded-full bg-neutral-800" />
              </div>

              {/* App Screen Inside Phone */}
              <div className="bg-white text-neutral-900 rounded-[34px] p-4 space-y-4 shadow-inner min-h-[430px] flex flex-col justify-between">
                {/* Screen Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span className="font-semibold text-neutral-900">Select Vault / Asset</span>
                    <span className="text-emerald-600 font-bold">● Active v4</span>
                  </div>

                  {/* Network Notice Card (Matching Spenda Screenshot 1) */}
                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Select Network</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-tight">
                      Select the blockchain network to view all verified liquidity vaults and everyday spending rails.
                    </p>
                  </div>
                </div>

                {/* Token / Vault Rows (Matching Spenda Phone List) */}
                <div className="space-y-2 text-xs">
                  {/* BTC */}
                  <div className="p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-xs">
                        ₿
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Bitcoin (BTC)</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Pace Benchmark Vault</p>
                      </div>
                    </div>
                    <span className="text-neutral-400 font-mono">›</span>
                  </div>

                  {/* ETH */}
                  <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 font-bold flex items-center justify-center text-xs">
                        Ξ
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Ethereum (Uniswap v4)</p>
                        <p className="text-[10px] text-emerald-600 font-mono font-semibold">+14.8% APY Active</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-mono font-bold">›</span>
                  </div>

                  {/* USDC */}
                  <div className="p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 font-bold flex items-center justify-center text-xs">
                        $
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">USDC (Circle)</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Virtual Dollar Card Rail</p>
                      </div>
                    </div>
                    <span className="text-neutral-400 font-mono">›</span>
                  </div>

                  {/* CADRA */}
                  <div className="p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-950 text-white font-bold flex items-center justify-center text-[10px]">
                        C
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Cadra (CADRA)</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Curator Bond Reserve</p>
                      </div>
                    </div>
                    <span className="text-neutral-400 font-mono">›</span>
                  </div>
                </div>

                {/* Instant Action CTA inside Phone */}
                <button
                  onClick={handleLaunchFollower}
                  className="w-full py-2.5 rounded-full bg-neutral-950 text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Deposit &amp; Start Earning
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BENTO CARDS (Matching Screenshot 2)
          "Built for daily use. Deposit and spend instantly"
          - Left Card: Clean white card with phone mockup showing live portfolio
          - Right Card: Warm peach/sand card with 3D gold & emerald crypto coins
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-neutral-500 tracking-normal">
            Built for daily use.
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
            Deposit and spend instantly
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Bento Card 1 (Left - Crisp White with App Phone Mockup) */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-4 max-w-md z-10">
              <span className="text-xs font-mono font-semibold uppercase text-neutral-400 tracking-wider">
                PORTFOLIO TELEMETRY
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
                Live On-Chain Balances &amp; Yields
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Follow top curators without custody risk. Monitor your positions in real time as Uniswap v4 Hook contracts track and benchmark every tick against The Pace.
              </p>
            </div>

            {/* Inner Phone Illustration on Card 1 */}
            <div className="pt-8 flex justify-center z-10">
              <div className="w-64 rounded-t-3xl border-t-[5px] border-x-[5px] border-neutral-300 bg-neutral-950 p-2 shadow-xl">
                <div className="w-16 h-3 rounded-full bg-black mx-auto mb-2" />
                <div className="bg-white rounded-t-2xl p-4 text-center space-y-2 text-xs">
                  <div className="w-10 h-10 rounded-full bg-neutral-950 text-white mx-auto flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <div className="font-bold text-lg text-neutral-950">$12,450.80</div>
                  <div className="text-[11px] text-emerald-600 font-mono font-medium">
                    +18.4% above The Pace
                  </div>
                  <div className="pt-2 flex gap-1.5 justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-800">
                      Deposit
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-800">
                      Withdraw
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2 (Right - Warm Peach/Sand Card with 3D Floating Coins - Matching Screenshot 2) */}
          <div className="bg-[#FFF7F2] border border-[#FED7AA] rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between overflow-hidden relative group">
            {/* Top 3D Floating Gold Bitcoin & Emerald Tether Coins */}
            <div className="relative h-44 sm:h-52 flex items-center justify-center">
              {/* Gold Bitcoin Coin 3D Vector */}
              <div className="absolute left-6 sm:left-12 top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1.5 shadow-2xl transform -rotate-12 transition-transform group-hover:scale-105">
                <div className="w-full h-full rounded-full border-4 border-amber-300/80 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-extrabold shadow-inner">
                  ₿
                </div>
              </div>

              {/* Emerald Tether / Cadra Coin 3D Vector */}
              <div className="absolute right-6 sm:right-12 top-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-200 p-1.5 shadow-2xl transform rotate-12 transition-transform group-hover:scale-105">
                <div className="w-full h-full rounded-full border-4 border-emerald-300/80 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-extrabold shadow-inner">
                  ₮
                </div>
              </div>
            </div>

            {/* Bottom Content (Matching Screenshot 2 Text) */}
            <div className="space-y-3 pt-6 z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                Deposit crypto. Get local cash instantly
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Fund your Cadra account directly from crypto wallets. Convert your yields into direct everyday spending or withdraw to bank accounts with 0% P2P friction.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleLaunchFollower}
                  className="px-6 py-3 rounded-full bg-neutral-950 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Deposit &amp; Trade Now</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: EVERYDAY SPENDING CATEGORIES & 3-SLIDE AD CAROUSEL
          All categories, Food & groceries, Fashion, Beauty, Electronics, Home & office
         ========================================================================= */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <CategoriesAndAdSlider
          onExploreProducts={(cat) => {
            handleLaunchFollower();
          }}
        />
      </section>

      {/* =========================================================================
          SECTION 4: PURE BLACK SECTION (Matching Screenshot 3)
          "Turn crypto into everyday spending"
          - Heading & Subtitle on black
          - Arc of glowing 3D crypto tokens with ground reflection
          - 3 Numbered step cards (1, 2, 3)
         ========================================================================= */}
      <section className="bg-black text-white py-20 sm:py-28 relative overflow-hidden rounded-3xl sm:rounded-[48px] max-w-7xl mx-auto px-6 sm:px-12 shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-16 text-center">
          {/* Section Header */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Turn crypto into everyday spending
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Cadra simplifies crypto transactions and concentrated liquidity, making it effortless for both beginners and experienced users to transact seamlessly.
            </p>
          </div>

          {/* Arc of Floating 3D Glowing Crypto Tokens with Floor Reflection (Matching Screenshot 3) */}
          <div className="relative py-6 max-w-2xl mx-auto">
            {/* Tokens Arc */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
              {/* Bitcoin */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 transform hover:-translate-y-1 transition-transform">
                <div className="w-full h-full rounded-full bg-amber-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  ₿
                </div>
              </div>

              {/* USDC */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-700 via-blue-500 to-sky-300 p-0.5 shadow-lg shadow-blue-500/20 transform hover:-translate-y-1 transition-transform">
                <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  $
                </div>
              </div>

              {/* Ethereum */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-700 via-slate-600 to-indigo-300 p-0.5 shadow-xl shadow-indigo-500/30 transform hover:-translate-y-2 transition-transform -mt-2">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                  Ξ
                </div>
              </div>

              {/* Cadra Hook Token */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-300 p-0.5 shadow-xl shadow-emerald-500/30 transform hover:-translate-y-2 transition-transform -mt-2">
                <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400 text-xl sm:text-2xl font-black">
                  C
                </div>
              </div>

              {/* Solana */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-700 via-purple-500 to-fuchsia-300 p-0.5 shadow-lg shadow-purple-500/20 transform hover:-translate-y-1 transition-transform">
                <div className="w-full h-full rounded-full bg-purple-700 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  ◎
                </div>
              </div>

              {/* Tether */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-teal-700 via-teal-500 to-emerald-300 p-0.5 shadow-lg shadow-teal-500/20 transform hover:-translate-y-1 transition-transform">
                <div className="w-full h-full rounded-full bg-teal-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  ₮
                </div>
              </div>
            </div>

            {/* Realistic Mirrored Reflection Floor Gradient */}
            <div className="w-full h-8 bg-gradient-to-b from-white/10 to-transparent blur-sm rounded-full mx-auto mt-2" />
          </div>

          {/* 3 Numbered Step Cards (Matching Screenshot 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-6">
            {/* Step 1 */}
            <div className="p-7 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Deposit or Connect</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your Web3 wallet or fund your non-custodial Cadra account with USDC, ETH, or fiat in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Choose Your Vault or Token</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select an audited curator strategy or allocate directly to everyday spending categories with automated rule enforcement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 shadow-xl hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Earn, Protect &amp; Spend</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enjoy continuous alpha returns, curator bond downside protection, and instant virtual card checkouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BUILT FOR SPEED, CLARITY, AND CONTROL (Matching Screenshot 4)
          - Left: 3D titanium dark metallic shield badge with chrome beveled rim
          - Right: Interactive tabs: Security (active with blue bar), 24/7 Support, User-friendly interface
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
            Built for speed, clarity, and control
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
            Cadra helps you move from crypto to cash to everyday payments securely and without stress.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 3D Titanium Metallic Security Shield (Matching Screenshot 4) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-64 h-72 sm:w-72 sm:h-80 flex items-center justify-center">
              {/* Chrome Silver Outer Bevel Shield */}
              <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 240 280" fill="none">
                <defs>
                  {/* Chrome Border Gradient */}
                  <linearGradient id="shieldChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#d1d5db" />
                    <stop offset="60%" stopColor="#6b7280" />
                    <stop offset="85%" stopColor="#e5e7eb" />
                    <stop offset="100%" stopColor="#1f2937" />
                  </linearGradient>

                  {/* Dark Titanium Body Gradient */}
                  <linearGradient id="shieldTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="50%" stopColor="#18181b" />
                    <stop offset="100%" stopColor="#09090b" />
                  </linearGradient>
                </defs>

                {/* Outer Silver Beveled Shield Rim */}
                <path
                  d="M120 20 L200 60 C200 160 160 220 120 260 C80 220 40 160 40 60 Z"
                  fill="url(#shieldChrome)"
                  stroke="#9ca3af"
                  strokeWidth="2"
                />

                {/* Inner Titanium Core */}
                <path
                  d="M120 34 L185 70 C185 150 152 205 120 240 C88 205 55 150 55 70 Z"
                  fill="url(#shieldTitanium)"
                  stroke="#3f3f46"
                  strokeWidth="2"
                />

                {/* Inner Ambient Highlight */}
                <path
                  d="M120 34 L185 70 C185 110 170 150 120 180 Z"
                  fill="#ffffff"
                  fillOpacity="0.06"
                />

                {/* Cadra Center Emblem */}
                <g transform="translate(93, 105) scale(1)">
                  <path
                    d="M8 24A24 24 0 0 1 50.39 8.57L41.96 15.64A13 13 0 0 0 19 24Z"
                    fill="#34d399"
                  />
                  <path
                    d="M0 28A24 24 0 0 0 42.39 43.43L33.96 36.36A13 13 0 0 1 11 28Z"
                    fill="#ffffff"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* Right Column: Interactive Tab Menu (Matching Screenshot 4) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab 1: Security */}
            <div
              onClick={() => setActiveFeatureTab("security")}
              className="border-b border-neutral-200 pb-5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-xl sm:text-2xl font-bold transition-colors ${
                    activeFeatureTab === "security" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  Security
                </h3>
              </div>

              {activeFeatureTab === "security" && (
                <div className="space-y-3 pt-3">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Spenda &amp; Cadra help you move from crypto to cash to everyday payments securely and without stress. Non-custodial contracts, personal curator cash bonds, and automated smart vault accounting ensure your capital is always safeguarded.
                  </p>
                  {/* Blue Active Indicator Bar */}
                  <div className="w-40 h-1 bg-blue-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Tab 2: 24/7 Support & Liquidity */}
            <div
              onClick={() => setActiveFeatureTab("support")}
              className="border-b border-neutral-200 pb-5 cursor-pointer"
            >
              <h3
                className={`text-xl sm:text-2xl font-bold transition-colors ${
                  activeFeatureTab === "support" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
                }`}
              >
                24/7 Support
              </h3>

              {activeFeatureTab === "support" && (
                <div className="space-y-3 pt-3">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Continuous automated market maker liquidity depth. Automated TWAP safety brake parks your assets immediately if market conditions diverge unexpectedly, keeping your money accessible around the clock.
                  </p>
                  <div className="w-40 h-1 bg-blue-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Tab 3: User-friendly interface */}
            <div
              onClick={() => setActiveFeatureTab("interface")}
              className="border-b border-neutral-200 pb-5 cursor-pointer"
            >
              <h3
                className={`text-xl sm:text-2xl font-bold transition-colors ${
                  activeFeatureTab === "interface" ? "text-neutral-950" : "text-neutral-400 hover:text-neutral-700"
                }`}
              >
                User-friendly interface
              </h3>

              {activeFeatureTab === "interface" && (
                <div className="space-y-3 pt-3">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Transparent telemetry cockpit, one-click rebalancing, and direct category spending. Designed to be as friendly and intuitive as everyday banking, with none of the typical DeFi confusion.
                  </p>
                  <div className="w-40 h-1 bg-blue-600 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: INTERACTIVE DEMO (THE PACE BENCHMARK)
          Preserving Cadra's original smart contract mechanism visualizer
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest text-neutral-500 uppercase font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>INTERACTIVE MECHANISM DEMO</span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
                How The Pace Benchmark Protects Your Money
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Click a scenario below to see how fees, cash bonds, and safety nets protect your capital:
              </p>
            </div>

            {/* Scenario Selector Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-200/70 p-1 rounded-full text-xs font-medium">
              <button
                onClick={() => setActiveScenario("ahead")}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeScenario === "ahead"
                    ? "bg-neutral-900 text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <TrendUpIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Curator Wins (+Alpha)</span>
              </button>
              <button
                onClick={() => setActiveScenario("behind")}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeScenario === "behind"
                    ? "bg-neutral-900 text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Curator Lags (Bond Protects)</span>
              </button>
              <button
                onClick={() => setActiveScenario("parked")}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeScenario === "parked"
                    ? "bg-neutral-900 text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <ActivityIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Emergency Safety Brake</span>
              </button>
            </div>
          </div>

          {/* Interactive Graph Cockpit */}
          <div className="p-6 rounded-3xl bg-[#09090b] border border-neutral-800 shadow-xl space-y-6 text-white">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* SVG Graph */}
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

                  <line x1="0" y1="50" x2="800" y2="50" stroke="#27272a" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#27272a" strokeDasharray="4 4" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#27272a" strokeDasharray="4 4" />

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

                  {activeScenario === "ahead" && (
                    <>
                      <path d="M 0 140 Q 200 110, 400 80 T 800 48" fill="url(#curatorAheadGrad)" />
                      <path d="M 0 140 Q 200 110, 400 80 T 800 48" fill="none" stroke="#34d399" strokeWidth="3.5" />
                      <circle cx="800" cy="48" r="6" fill="#34d399" className="animate-pulse" />
                      <text x="630" y="38" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
                        +$20 Above The Pace!
                      </text>
                    </>
                  )}

                  {activeScenario === "behind" && (
                    <>
                      <path d="M 0 140 Q 200 135, 400 145 T 800 135" fill="none" stroke="#52525b" strokeWidth="2.5" />
                      <path d="M 800 135 L 800 100" stroke="#34d399" strokeWidth="3" strokeDasharray="3 3" />
                      <circle cx="800" cy="100" r="6" fill="#10b981" />
                      <text x="540" y="90" fill="#34d399" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
                        Curator cash bond covers shortfall!
                      </text>
                    </>
                  )}

                  {activeScenario === "parked" && (
                    <>
                      <path d="M 0 140 Q 200 145, 380 180 L 800 180" fill="url(#parkedGrad)" />
                      <path d="M 0 140 Q 200 145, 380 180 L 800 180" fill="none" stroke="#f87171" strokeWidth="3" />
                      <circle cx="380" cy="180" r="7" fill="#ef4444" />
                      <text x="400" y="172" fill="#38bdf8" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                        Emergency brake: capital safely parked into The Pace
                      </text>
                    </>
                  )}
                </svg>
              </div>

              {/* Status Card */}
              <div className="w-full lg:w-1/3 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
                {activeScenario === "ahead" && (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <TrendUpIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 block font-mono">+ALPHA GENERATED</span>
                      <h4 className="text-sm font-bold text-white">Curator Wins &amp; Earns Fee</h4>
                      <p className="text-xs text-neutral-400">Curator earns 20% of profits, you keep the rest!</p>
                    </div>
                  </>
                )}
                {activeScenario === "behind" && (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 block font-mono">BOND PROTECTED</span>
                      <h4 className="text-sm font-bold text-white">Curator Bond Pays Back</h4>
                      <p className="text-xs text-neutral-400">Curator&apos;s bond makes you whole. Zero loss on trail!</p>
                    </div>
                  </>
                )}
                {activeScenario === "parked" && (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <ActivityIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-sky-400 block font-mono">SAFETY BRAKE ENGAGED</span>
                      <h4 className="text-sm font-bold text-white">Automated TWAP Parking</h4>
                      <p className="text-xs text-neutral-400">Hook automatically parked funds into the benchmark pool.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Numbers Tile */}
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
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: SPEND YOUR CRYPTO YOUR WAY & FOOTER (Matching Screenshot 5)
          - Title: Spend your Crypto your way
          - 5 Stars rating: 4.9/5 Download Cadra today
          - Play Store & App Store buttons
          - NDPC & Uniswap v4 Audited badge
          - 4 columns: Product, Company, Contact Us (with circular black social buttons)
          - Floating card shapes watermark in footer background
         ========================================================================= */}
      <section className="border-t border-neutral-200 pt-16 sm:pt-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 relative z-10">
          {/* Big Heading matching Screenshot 5 */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
              Spend your Crypto your way
            </h2>
          </div>

          {/* 4 Columns Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-16 border-b border-neutral-200">
            {/* Col 1: Stars, Download Buttons & Compliance (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon className="w-4 h-4 fill-amber-400" />
                  <StarIcon className="w-4 h-4 fill-amber-400" />
                  <StarIcon className="w-4 h-4 fill-amber-400" />
                  <StarIcon className="w-4 h-4 fill-amber-400" />
                  <StarIcon className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs font-semibold text-neutral-800">
                  Download Cadra today · 4.9/5 Rating
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 pt-1">
                <button
                  onClick={handleLaunchFollower}
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 transition-all flex items-center gap-2.5 text-xs font-semibold cursor-pointer w-fit"
                >
                  <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.793 12 3.61 22.186a2.235 2.235 0 0 1-.22-.962V2.776c0-.361.08-.696.22-.962zm11.242 11.244L4.85 23.059c.307.086.64.072.969-.117l11.534-6.61-2.502-3.274zm0-2.116l2.502-3.274L5.819 1.058c-.329-.189-.662-.203-.969-.117l10 10.001zm1.488 1.058l3.655 2.095c1.066.611 1.066 1.603 0 2.214l-3.655 2.095-2.095-3.202 2.095-3.202z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] text-neutral-400 uppercase font-mono">Get it on</div>
                    <div className="text-xs font-bold">Play Store</div>
                  </div>
                </button>

                <button
                  onClick={handleLaunchCurator}
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 transition-all flex items-center gap-2.5 text-xs font-semibold cursor-pointer w-fit"
                >
                  <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.49 2.65-1.24z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] text-neutral-400 uppercase font-mono">Download on</div>
                    <div className="text-xs font-bold">App Store</div>
                  </div>
                </button>
              </div>

              {/* Compliance & Audit Badges */}
              <div className="pt-2 flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>NDPC Compliant</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px] font-mono font-semibold">
                  Uniswap v4 Hook
                </div>
              </div>
            </div>

            {/* Col 2: Product (3 cols) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-sm font-bold text-neutral-950">Product</h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/follower/explore" className="hover:text-neutral-950 transition-colors">
                    Crypto deposit &amp; Vaults
                  </Link>
                </li>
                <li>
                  <Link href="/follower/portfolio" className="hover:text-neutral-950 transition-colors">
                    Naira &amp; Fiat deposit
                  </Link>
                </li>
                <li>
                  <Link href="/curator/overview" className="hover:text-neutral-950 transition-colors">
                    Stablecoin transfer
                  </Link>
                </li>
                <li>
                  <Link href="/follower/queue" className="hover:text-neutral-950 transition-colors">
                    Instant bank transfers
                  </Link>
                </li>
                <li>
                  <Link href="/#categories" className="hover:text-neutral-950 transition-colors">
                    Virtual cards &amp; Commerce
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Company (2 cols) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-sm font-bold text-neutral-950">Company</h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/leaderboard" className="hover:text-neutral-950 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                    Download
                  </Link>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-950 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <span className="text-neutral-400">Privacy policy</span>
                </li>
                <li>
                  <span className="text-neutral-400">Terms of use</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact Us & Socials (3 cols) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-sm font-bold text-neutral-950">Contact Us</h4>
              <p className="text-xs text-neutral-600 font-mono">
                support@cadra.fi
              </p>

              {/* Circular Social Buttons (Matching Screenshot 5) */}
              <div className="flex items-center gap-2 pt-2">
                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <YouTubeIcon className="w-3.5 h-3.5" />
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
                {/* X / Twitter */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X / Twitter"
                  className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <TwitterXIcon className="w-3.5 h-3.5" />
                </a>
                {/* Discord */}
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                  className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                  <DiscordIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Row: Address & Copyright matching Screenshot 5 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 pb-12">
            <p className="font-sans">
              22 Glover Road, Ikoyi, Lagos, Nigeria
            </p>
            <p className="font-sans">
              All rights reserved, 2026 Cadra
            </p>
          </div>
        </div>

        {/* Floating rounded square card shapes watermark in footer background (Matching Screenshot 5) */}
        <div className="absolute bottom-0 inset-x-0 h-40 flex items-end justify-center gap-4 pointer-events-none opacity-30 overflow-hidden">
          {[...Array(12)].map((_, idx) => (
            <div
              key={idx}
              className={`w-28 h-36 rounded-3xl bg-neutral-200/60 transform translate-y-12 ${
                idx % 2 === 0 ? "border-2 border-dashed border-neutral-300 bg-transparent" : ""
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
