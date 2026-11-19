"use client";

import React, { useState, useEffect, useRef } from "react";
import { VaultData, RangePosition } from "../types/cadra";
import { BotLogEvent } from "@/bots";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ShieldIcon,
  ActivityIcon,
  ZapIcon,
  ClockIcon,
  ScaleIcon,
  TrendUpIcon,
  TrendDownIcon,
  UserIcon,
} from "./Icons";

interface LiveSimulatorProps {
  vaults: VaultData[];
  onTriggerEnforce: (vaultId: number) => void;
  onTriggerSettle: (vaultId: number, simulatedGap: number) => void;
  onUpdateRanges?: (vaultId: number, newRanges: RangePosition[]) => void;
  onSeedArchetypes?: () => void;
  onResetDemo: () => void;
}

export function LiveSimulator({
  vaults,
  onTriggerEnforce,
  onTriggerSettle,
  onUpdateRanges,
  onSeedArchetypes,
  onResetDemo,
}: LiveSimulatorProps) {
  // Master Bot Running State
  const [isRunningAllBots, setIsRunningAllBots] = useState<boolean>(false);

  // Individual Bot Toggles
  const [swapperEnabled, setSwapperEnabled] = useState<boolean>(true);
  const [curatorsEnabled, setCuratorsEnabled] = useState<boolean>(true);
  const [keeperEnabled, setKeeperEnabled] = useState<boolean>(true);

  // Live Market State
  const [spotPrice, setSpotPrice] = useState<number>(3120);
  const [priceChangeDir, setPriceChangeDir] = useState<"up" | "down" | "neutral">("neutral");

  // Metrics Counters
  const [totalSwaps, setTotalSwaps] = useState<number>(0);
  const [totalVolumeUsdc, setTotalVolumeUsdc] = useState<number>(0);
  const [totalRebalances, setTotalRebalances] = useState<number>(0);
  const [totalEnforcements, setTotalEnforcements] = useState<number>(0);
  const [totalSettlements, setTotalSettlements] = useState<number>(0);

  // Stream Log State
  const [logs, setLogs] = useState<BotLogEvent[]>([
    {
      id: "init-1",
      time: "12:00:00",
      bot: "hook",
      type: "info",
      message: "Cadra Autonomous Bot Engine initialized. WETH/USDC (0.05%) pool ready.",
    },
    {
      id: "init-2",
      time: "12:00:00",
      bot: "keeper",
      type: "info",
      message: "Keeper daemon standing by. Monitoring vault price corridors and epoch deadlines.",
    },
  ]);
  const [activeFilter, setActiveFilter] = useState<"all" | "swapper" | "curator" | "keeper">("all");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (
    bot: "swapper" | "curator" | "keeper" | "hook",
    type: "info" | "alert" | "success" | "warn",
    message: string
  ) => {
    const newEntry: BotLogEvent = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      bot,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-120), newEntry]);
  };

  // =========================================================================
  // BOT 1: SWAPPER BOT EXECUTION
  // =========================================================================
  const executeSwapperStep = (currentPrice: number) => {
    const isBuy = Math.random() > 0.48;
    const delta = isBuy
      ? Math.floor(Math.random() * 18 + 2)
      : -Math.floor(Math.random() * 18 + 2);
    const newPrice = Math.max(1800, Math.min(4500, currentPrice + delta));
    const ethAmount = (Math.random() * 1.5 + 0.1).toFixed(2);
    const volume = Math.round(parseFloat(ethAmount) * newPrice);

    setSpotPrice(newPrice);
    setPriceChangeDir(delta >= 0 ? "up" : "down");
    setTotalSwaps((prev) => prev + 1);
    setTotalVolumeUsdc((prev) => prev + volume);

    const tokenDirection = isBuy ? "USDC -> WETH" : "WETH -> USDC";
    addLog(
      "swapper",
      "info",
      `[Swapper] Trade executed: ${tokenDirection} (${ethAmount} ETH / $${volume.toLocaleString()}). Spot price moved to $${newPrice}.`
    );

    // Check if new price breaches any vault mandate corridor
    vaults.forEach((v) => {
      const breached = newPrice < v.mandate.minPrice || newPrice > v.mandate.maxPrice;
      if (breached && !v.isParked) {
        addLog(
          "hook",
          "alert",
          `[CadraHook] afterSwap: Spot $${newPrice} exited corridor [$${v.mandate.minPrice}, $${v.mandate.maxPrice}] for ${v.name}! BandLeft callback flagged.`
        );
      }
    });

    return newPrice;
  };

  // =========================================================================
  // BOT 2: CURATOR SWARM EXECUTION
  // =========================================================================
  const executeCuratorStep = (currentPrice: number) => {
    if (vaults.length === 0) return;

    // Rotate through active curator archetypes
    const archetypeChoice = Math.floor(Math.random() * 4);

    if (archetypeChoice === 0) {
      // 1. Tight Curator (Vault #1)
      const tightVault = vaults.find((v) => v.tag.includes("Tight")) || vaults[0];
      const midCorridor = (tightVault.mandate.minPrice + tightVault.mandate.maxPrice) / 2;
      const deviation = Math.abs(currentPrice - midCorridor);

      if (deviation > 60 && onUpdateRanges) {
        const newLower = Math.max(tightVault.mandate.minPrice, currentPrice - 100);
        const newUpper = Math.min(tightVault.mandate.maxPrice, currentPrice + 100);
        onUpdateRanges(tightVault.id, [
          {
            id: `r_tight_${Date.now()}`,
            lowerTick: -60000,
            upperTick: -58000,
            lowerPrice: newLower,
            upperPrice: newUpper,
            liquidityPercent: 100,
          },
        ]);
        setTotalRebalances((prev) => prev + 1);
        addLog(
          "curator",
          "success",
          `[Tight Curator] Re-centering active corridor to [$${newLower}, $${newUpper}] around spot $${currentPrice}. 100% ticks in-band.`
        );
      } else {
        addLog(
          "curator",
          "info",
          `[Tight Curator] Spot $${currentPrice} is within middle 50% of range. Current corridor optimal.`
        );
      }
    } else if (archetypeChoice === 1) {
      // 2. Wide Curator (Vault #2)
      addLog(
        "curator",
        "info",
        `[Wide Curator] Spot $${currentPrice} safely nestled in wide defensive perimeter ($2,000–$4,500). Passive yield compounding.`
      );
    } else if (archetypeChoice === 2) {
      // 3. Lazy Curator (Vault #3)
      addLog(
        "curator",
        "warn",
        `[Lazy Curator] Inactive. Corridors unadjusted; benchmark divergence tracking.`
      );
    } else {
      // 4. Reckless Curator (Vault #4)
      addLog(
        "curator",
        "warn",
        `[Reckless Curator] Submitting speculative rebalance outside mandate bounds (Tick 999999)...`
      );
      addLog(
        "hook",
        "alert",
        `[CadraHook] [REVERT] CadraHook__MandateBreached(). Out-of-bounds rebalance blocked on-chain. Capital safe.`
      );
    }
  };

  // =========================================================================
  // BOT 3: KEEPER DAEMON EXECUTION
  // =========================================================================
  const executeKeeperStep = (currentPrice: number) => {
    if (vaults.length === 0) return;

    // 1. Scan for BandLeft or Breached corridors needing enforcement
    const breachedVault = vaults.find(
      (v) =>
        !v.isParked &&
        (v.bandLeft || currentPrice < v.mandate.minPrice || currentPrice > v.mandate.maxPrice)
    );

    if (breachedVault) {
      onTriggerEnforce(breachedVault.id);
      setTotalEnforcements((prev) => prev + 1);
      addLog(
        "keeper",
        "alert",
        `[Keeper] [ALERT] BandLeft breach detected for ${breachedVault.name}! Calling enforce(vaultId=${breachedVault.id})...`
      );
      addLog(
        "keeper",
        "alert",
        `[Keeper] [PARKED] TWAP shortfall confirmed (>5%). Emergency brake tripped: ${breachedVault.name} PARKED into The Pace! Curator frozen.`
      );
      return;
    }

    // 2. Scan for epoch settlement
    const settleCandidate = vaults.find((v) => !v.isParked);
    if (settleCandidate && Math.random() > 0.65) {
      const simulatedGapUsdc = Math.floor((Math.random() - 0.35) * 450);
      onTriggerSettle(settleCandidate.id, simulatedGapUsdc);
      setTotalSettlements((prev) => prev + 1);

      if (simulatedGapUsdc >= 0) {
        const fee = (simulatedGapUsdc * (settleCandidate.perfFeeBps / 10000)).toFixed(2);
        addLog(
          "keeper",
          "success",
          `[Keeper] [SETTLED] Epoch settlement complete for ${settleCandidate.name}: Outperformed Pace by +$${simulatedGapUsdc}. Curator earned $${fee} fee. Capacity expanded.`
        );
      } else {
        addLog(
          "keeper",
          "warn",
          `[Keeper] [SETTLED] Epoch settlement complete for ${settleCandidate.name}: Lagged Pace by -$${Math.abs(simulatedGapUsdc)}. Curator bond reimbursed followers.`
        );
      }
    }
  };

  // =========================================================================
  // MASTER TICK CYCLE (Runs all active bots together)
  // =========================================================================
  useEffect(() => {
    if (!isRunningAllBots) return;

    let localPrice = spotPrice;

    // Swapper interval (every 2.4s)
    const swapperTimer = setInterval(() => {
      if (swapperEnabled) {
        localPrice = executeSwapperStep(localPrice);
      }
    }, 2400);

    // Curator swarm interval (every 3.6s)
    const curatorTimer = setInterval(() => {
      if (curatorsEnabled) {
        executeCuratorStep(localPrice);
      }
    }, 3600);

    // Keeper daemon interval (every 4.8s)
    const keeperTimer = setInterval(() => {
      if (keeperEnabled) {
        executeKeeperStep(localPrice);
      }
    }, 4800);

    return () => {
      clearInterval(swapperTimer);
      clearInterval(curatorTimer);
      clearInterval(keeperTimer);
    };
  }, [
    isRunningAllBots,
    swapperEnabled,
    curatorsEnabled,
    keeperEnabled,
    vaults,
    spotPrice,
  ]);

  // Master Run / Pause Toggle
  const handleToggleRunAll = () => {
    if (!isRunningAllBots) {
      setIsRunningAllBots(true);
      addLog(
        "hook",
        "success",
        "Master Switch: ALL AUTONOMOUS BOTS STARTED SIMULTANEOUSLY (Swapper + Curators + Keeper)."
      );
    } else {
      setIsRunningAllBots(false);
      addLog("hook", "info", "Master Switch: All bots paused.");
    }
  };

  // Force Sharp Shock (-15% Crash) for Parking Demonstration
  const handleTriggerSharpShock = () => {
    const droppedPrice = Math.round(spotPrice * 0.85);
    setSpotPrice(droppedPrice);
    setPriceChangeDir("down");
    setTotalSwaps((prev) => prev + 1);
    setTotalVolumeUsdc((prev) => prev + 155000);

    addLog(
      "swapper",
      "alert",
      `[Swapper] [SELL SHOCK] 50.0 ETH ($155,000 USDC) swapped into pool!`
    );
    addLog(
      "swapper",
      "alert",
      `[Swapper] [PRICE CRASH] Pool price crashed to $${droppedPrice} (-15%)! Curator corridors breached!`
    );

    // Immediately trigger hook flag & keeper enforcement
    vaults.forEach((v) => {
      if (!v.isParked && (droppedPrice < v.mandate.minPrice || droppedPrice > v.mandate.maxPrice)) {
        addLog(
          "hook",
          "alert",
          `[CadraHook] afterSwap: Mandate boundary exit confirmed for ${v.name}. Flagging BandLeft.`
        );
        onTriggerEnforce(v.id);
        setTotalEnforcements((prev) => prev + 1);
        addLog(
          "keeper",
          "alert",
          `[Keeper] [EMERGENCY BRAKE] Evaluated ${v.name} at TWAP. 100% funds PARKED into The Pace! Curator frozen.`
        );
      }
    });
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "swapper") return log.bot === "swapper";
    if (activeFilter === "curator") return log.bot === "curator";
    if (activeFilter === "keeper") return log.bot === "keeper";
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 font-sans max-w-5xl mx-auto">
      {/* =========================================================================
          1. MASTER CONTROL & BOT STATUS HERO CARD
         ========================================================================= */}
      <section className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRunningAllBots ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
                }`}
              />
              <span className="text-[12px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Autonomous Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Bot Control Center
            </h1>
            <p className="text-[14px] text-neutral-500 max-w-lg leading-relaxed font-normal">
              Run the Swapper, Curator Swarm, and Keeper daemon simultaneously in the browser. Watch trades shift the tick, curators rebalance corridors, and keepers enforce TWAP parking live.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onResetDemo}
              className="h-[42px] px-4 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
              title="Reset vaults to archetype state"
            >
              <RefreshCwIcon className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>

            {/* Force Sharp Shock Button */}
            <button
              onClick={handleTriggerSharpShock}
              className="h-[42px] px-4.5 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
              title="Instantly executes large swap to breach bands and test keeper parking"
            >
              <ZapIcon className="w-3.5 h-3.5 text-red-600" />
              <span>Price Shock (-15%)</span>
            </button>

            {/* Master Toggle Button */}
            <button
              onClick={handleToggleRunAll}
              className={`h-[42px] px-6 rounded-full font-semibold text-[13px] transition-all cursor-pointer flex items-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.98] ${
                isRunningAllBots
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-neutral-950 hover:bg-neutral-800 text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRunningAllBots ? "bg-white animate-pulse" : "bg-emerald-400"}`} />
              <span>{isRunningAllBots ? "All Bots Running" : "Run All Bots"}</span>
            </button>
          </div>
        </div>

        {/* Live Market & Telemetry KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Pool Spot Price */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-400 text-[11px] uppercase font-mono font-medium">
              <span>Pool Spot Price</span>
              {priceChangeDir === "up" && <TrendUpIcon className="w-3.5 h-3.5 text-emerald-600" />}
              {priceChangeDir === "down" && <TrendDownIcon className="w-3.5 h-3.5 text-red-600" />}
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight">
                ${spotPrice.toLocaleString()}
              </span>
              <span className="text-[12px] font-mono text-neutral-500">ETH/USDC</span>
            </div>
          </div>

          {/* Swapper Volume */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <span className="text-neutral-400 text-[11px] uppercase font-mono font-medium block">
              Swapper Volume
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight">
                {totalSwaps}
              </span>
              <span className="text-[12px] font-mono text-neutral-500">
                (${Math.round(totalVolumeUsdc / 1000)}k vol)
              </span>
            </div>
          </div>

          {/* Curator Rebalances */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <span className="text-neutral-400 text-[11px] uppercase font-mono font-medium block">
              Curator Rebalances
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight">
                {totalRebalances}
              </span>
              <span className="text-[12px] font-mono text-neutral-500">active moves</span>
            </div>
          </div>

          {/* Keeper Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <span className="text-neutral-400 text-[11px] uppercase font-mono font-medium block">
              Keeper Actions
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight">
                {totalEnforcements + totalSettlements}
              </span>
              <span className="text-[12px] font-mono text-neutral-500">
                ({totalEnforcements} parked / {totalSettlements} settled)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. THE 3 CONCURRENT BOTS STATUS CARDS
         ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bot A: Swapper Bot */}
        <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
                  <ActivityIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-950 text-[15px]">Swapper Bot</h3>
                  <span className="text-[11px] text-neutral-400 block font-mono">Market Maker</span>
                </div>
              </div>

              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                  isRunningAllBots && swapperEnabled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {isRunningAllBots && swapperEnabled ? "Active (2.4s)" : "Paused"}
              </span>
            </div>

            <p className="text-[13px] text-neutral-500 leading-relaxed font-normal">
              Executes continuous random-walk trades to generate pool swap fees and drive organic tick movement across Uniswap v4.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-mono">Frequency: 2.4s</span>
            <button
              onClick={() => setSwapperEnabled(!swapperEnabled)}
              className={`px-3 py-1 rounded-full font-semibold text-[11px] transition-all cursor-pointer ${
                swapperEnabled
                  ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                  : "bg-neutral-50 text-neutral-400 border border-neutral-200"
              }`}
            >
              {swapperEnabled ? "Enabled" : "Muted"}
            </button>
          </div>
        </div>

        {/* Bot B: Curator Swarm */}
        <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-950 text-[15px]">Curator Swarm</h3>
                  <span className="text-[11px] text-neutral-400 block font-mono">4 Vault Managers</span>
                </div>
              </div>

              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                  isRunningAllBots && curatorsEnabled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {isRunningAllBots && curatorsEnabled ? "Active (3.6s)" : "Paused"}
              </span>
            </div>

            <p className="text-[13px] text-neutral-500 leading-relaxed font-normal">
              Simulates Tight (+/-1%), Wide (+/-10%), Lazy (passive), and Reckless (mandate testing) curators reacting to ticks on-chain.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-mono">Frequency: 3.6s</span>
            <button
              onClick={() => setCuratorsEnabled(!curatorsEnabled)}
              className={`px-3 py-1 rounded-full font-semibold text-[11px] transition-all cursor-pointer ${
                curatorsEnabled
                  ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                  : "bg-neutral-50 text-neutral-400 border border-neutral-200"
              }`}
            >
              {curatorsEnabled ? "Enabled" : "Muted"}
            </button>
          </div>
        </div>

        {/* Bot C: Keeper Daemon */}
        <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
                  <ShieldIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-950 text-[15px]">Keeper Daemon</h3>
                  <span className="text-[11px] text-neutral-400 block font-mono">Enforce & Settle</span>
                </div>
              </div>

              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                  isRunningAllBots && keeperEnabled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {isRunningAllBots && keeperEnabled ? "Active (4.8s)" : "Paused"}
              </span>
            </div>

            <p className="text-[13px] text-neutral-500 leading-relaxed font-normal">
              Detects BandLeft breaches, calls enforce() to TWAP-park failing vaults, and settles epochs to distribute 20% alpha fees.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-mono">Frequency: 4.8s</span>
            <button
              onClick={() => setKeeperEnabled(!keeperEnabled)}
              className={`px-3 py-1 rounded-full font-semibold text-[11px] transition-all cursor-pointer ${
                keeperEnabled
                  ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                  : "bg-neutral-50 text-neutral-400 border border-neutral-200"
              }`}
            >
              {keeperEnabled ? "Enabled" : "Muted"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. LIVE BOT EVENT STREAM TERMINAL
         ========================================================================= */}
      <section className="bg-[#0A0A0C] border border-neutral-800 rounded-[32px] p-6 sm:p-8 space-y-4 text-white font-mono text-xs shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunningAllBots ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
              }`}
            />
            <span className="font-bold text-white uppercase text-[12px] tracking-wider">
              Live Bot Telemetry Stream
            </span>
            <span className="text-[11px] text-neutral-400 font-normal">
              ({filteredLogs.length} events)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-white/[0.05] p-1 rounded-full text-[11px]">
              {(["all", "swapper", "curator", "keeper"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full capitalize transition-all cursor-pointer ${
                    activeFilter === filter
                      ? "bg-white text-neutral-950 font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer ${
                autoScroll
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                  : "border-white/[0.1] text-neutral-400 hover:text-white"
              }`}
            >
              Auto-scroll
            </button>

            <button
              onClick={() => setLogs([])}
              className="px-3 py-1.5 rounded-full text-[11px] border border-white/[0.1] text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Event Logs Container */}
        <div
          ref={logContainerRef}
          className="h-80 overflow-y-auto space-y-2 text-neutral-300 pr-2 scrollbar-none font-mono text-[12px] leading-relaxed"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-neutral-600">
              No events matching current filter. Click &quot;Run All Bots&quot; to start live telemetry stream.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isAlert = log.type === "alert" || log.message.includes("REVERT") || log.message.includes("PARKED");
              const isSuccess = log.type === "success";
              const isWarn = log.type === "warn";

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isAlert
                      ? "bg-red-950/30 border-red-500/40 text-red-300"
                      : isSuccess
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : isWarn
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                      : "bg-white/[0.025] border-white/[0.06] text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-neutral-500">{log.time}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        log.bot === "swapper"
                          ? "bg-sky-950 text-sky-400 border border-sky-800"
                          : log.bot === "curator"
                          ? "bg-purple-950 text-purple-400 border border-purple-800"
                          : log.bot === "keeper"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {log.bot}
                    </span>
                  </div>
                  <div className="pl-1">{log.message}</div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
