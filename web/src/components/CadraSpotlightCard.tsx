"use client";

import React from "react";
import { ShieldIcon, ActivityIcon, TrendUpIcon, ArrowRightIcon } from "./Icons";

/**
 * Cadra High-Contrast Black Spotlight Showcase Card
 * Features an authentic black background matching the official Cadra brand,
 * with clean live telemetry metrics, performance comparisons, and hook status indicators.
 */
export function CadraBlackSpotlightCard({
  onFollowClick,
  onCurateClick,
}: {
  onFollowClick?: () => void;
  onCurateClick?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#000000] border border-neutral-800 text-white p-6 sm:p-10 shadow-2xl">
      {/* Subtle interior ambient lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Side: Brand & Value Prop */}
        <div className="space-y-6 max-w-xl text-center lg:text-left">
          {/* Top Brand Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-medium">Cadra Protocol v4</span>
            <span className="text-neutral-600">|</span>
            <span className="text-emerald-400">Pace-Benchmarked</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              The fairer way to earn on{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Uniswap v4
              </span>
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              Curators manage ranges within strict mandate rules. Followers enjoy passive outperformance.
              And if the curator underperforms, their posted cash bond pays you right back.
            </p>
          </div>

          {/* Quick Metrics Bar on Black */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs uppercase font-mono text-neutral-400 block font-semibold">Benchmark</span>
              <span className="text-sm sm:text-base font-bold text-white mt-1 block">The Pace</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs uppercase font-mono text-neutral-400 block font-semibold">Protection</span>
              <span className="text-sm sm:text-base font-bold text-white mt-1 block">100% Bond</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs uppercase font-mono text-neutral-400 block font-semibold">Safety Brake</span>
              <span className="text-sm sm:text-base font-bold text-white mt-1 block">Automated</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            {onFollowClick && (
              <button
                onClick={onFollowClick}
                className="px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Find a Curator</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {onCurateClick && (
              <button
                onClick={onCurateClick}
                className="px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-semibold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Become a Curator</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Clean Telemetry Cockpit on Black */}
        <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">Live Telemetry</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">Uniswap v4 Hook</span>
          </div>

          {/* Performance Comparison Bar */}
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <TrendUpIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Top Curator APY
                </span>
                <span className="text-emerald-400 font-bold">+24.8%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[82%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5 text-sky-400" />
                  The Pace Baseline
                </span>
                <span className="text-sky-400 font-bold">+14.2%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full w-[47%]" />
              </div>
            </div>
          </div>

          {/* Live Protection Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 block text-xs uppercase">Net Alpha</span>
              <span className="text-emerald-400 font-bold text-sm">+10.6% ($g &gt; 0)</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 block text-xs uppercase">Bond Reserve</span>
              <span className="text-white font-bold text-sm">$100,000 USDC</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-mono text-emerald-400">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-emerald-400" />
              <span>Downside Coverage:</span>
            </div>
            <span className="font-bold">100% Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
