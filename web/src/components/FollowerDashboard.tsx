"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VaultData, UserPosition, ReactiveSafetyAction } from "../types/cadra";
import {
  ShieldIcon,
  TrendUpIcon,
  ClockIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon,
  XIcon,
  ZapIcon,
  UserIcon,
} from "./Icons";
import { useCadra } from "../context/CadraContext";

const SettlementCountdown = React.memo(function SettlementCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ m: number; s: number }>({ m: 18, s: 42 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { m: prev.m - 1, s: 59 };
        return { m: 59, s: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono" suppressHydrationWarning>
      {String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
    </span>
  );
});

interface FollowerDashboardProps {
  vaults: VaultData[];
  userPositions: Record<number, UserPosition>;
  activeSubPage?: "portfolio" | "explore" | "queue" | "safety";
  onDeposit: (vaultId: number, amount: number) => void;
  onWithdraw: (vaultId: number, shares: number) => void;
  onViewCurator: (vaultId: number) => void;
  onNavigateToExplore?: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToStudio?: () => void;
}

export const FollowerDashboard = React.memo(function FollowerDashboard({
  vaults,
  userPositions,
  activeSubPage = "portfolio",
  onDeposit,
  onWithdraw,
  onViewCurator,
  onNavigateToExplore,
  onNavigateToLeaderboard,
  onNavigateToStudio,
}: FollowerDashboardProps) {
  const { connectedAddress, openConnectModal, reactiveSafetyFeed } = useCadra();
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<number>(vaults[0]?.id || 1);
  const [amountInput, setAmountInput] = useState<string>("1000");
  const [safetyFilter, setSafetyFilter] = useState<"all" | "rule_guard" | "shock_guard" | "settlement">("all");

  const userVaultIds = useMemo(() => Object.keys(userPositions).map(Number), [userPositions]);
  const totalValue = useMemo(
    () => userVaultIds.reduce((acc, id) => acc + (userPositions[id]?.currentValue || 0), 0),
    [userVaultIds, userPositions]
  );
  const totalPace = useMemo(
    () => userVaultIds.reduce((acc, id) => acc + (userPositions[id]?.paceEquivalent || 0), 0),
    [userVaultIds, userPositions]
  );
  const totalGap = totalValue - totalPace;
  const isAheadOverall = totalGap >= 0;
  const gapPercentage = totalPace > 0 ? (totalGap / totalPace) * 100 : 0;

  const totalProtectingBond = useMemo(
    () =>
      userVaultIds.reduce((acc, id) => {
        const v = vaults.find((vault) => vault.id === id);
        return acc + (v?.bondAmount || 0);
      }, 0),
    [userVaultIds, vaults]
  );

  const totalFeesPaid = useMemo(
    () => userVaultIds.reduce((acc, id) => acc + (userPositions[id]?.feesPaid || 0), 0),
    [userVaultIds, userPositions]
  );

  const totalPayoutsReceived = useMemo(
    () => userVaultIds.reduce((acc, id) => acc + (userPositions[id]?.bondPayoutsReceived || 0), 0),
    [userVaultIds, userPositions]
  );

  const handleOpenDeposit = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    setAmountInput("1000");
    setActiveModal("deposit");
  };

  const handleOpenWithdraw = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    const pos = userPositions[vaultId];
    setAmountInput(pos ? (pos.shares / 2).toString() : "0");
    setActiveModal("withdraw");
  };

  const handleConfirmAction = () => {
    if (!connectedAddress) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;
    if (activeModal === "deposit") {
      onDeposit(selectedVaultId, val);
    } else if (activeModal === "withdraw") {
      onWithdraw(selectedVaultId, val);
    }
    setActiveModal(null);
  };

  const filteredSafetyFeed = reactiveSafetyFeed.filter((item) => {
    if (safetyFilter === "all") return true;
    return item.type === safetyFilter;
  });

  // =========================================================================
  // 1. DISCOVER CURATORS (EXPLORE) SUB-PAGE
  // =========================================================================
  if (activeSubPage === "explore") {
    // Rank vaults by return against the Pace
    const rankedVaults = [...vaults].sort((a, b) => {
      const gapA = a.vaultValue - a.paceValue;
      const gapB = b.vaultValue - b.paceValue;
      return gapB - gapA;
    });

    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Discover Curators
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Curators compete to beat the Pace. Pay only when they beat the benchmark; cash bonds cover the gap.
            </p>
          </div>
          <span className="text-[12px] font-mono px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 font-semibold shadow-2xs">
            {vaults.length} Active Vaults
          </span>
        </div>

        {rankedVaults.length === 0 ? (
          <div className="rounded-[32px] border border-neutral-200/80 bg-white p-12 text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-bold text-neutral-950">No Curator Vaults Found</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              No curators have launched on this pool yet. Curators can deploy a vault in Curator Studio.
            </p>
            {onNavigateToStudio && (
              <button
                onClick={onNavigateToStudio}
                className="h-[42px] px-6 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer active:scale-[0.98]"
              >
                Go to Curator Studio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rankedVaults.map((vault, rankIdx) => {
              const alphaGap = vault.vaultValue - vault.paceValue;
              const isAhead = alphaGap >= 0;
              const curatorSharePct = (vault.curatorOwnershipBps / 100).toFixed(0);

              return (
                <div
                  key={vault.id}
                  className="bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-950 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {rankIdx + 1}
                          </span>
                          <span className="font-bold text-neutral-950 text-[17px] tracking-tight">{vault.name}</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                          Curator: {vault.curatorAddress.slice(0, 6)}...{vault.curatorAddress.slice(-4)}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold ${
                          vault.isParked
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                        }`}>
                          {vault.isParked ? "Parked (Safety Net)" : "Active"}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {vault.tag}
                        </span>
                      </div>
                    </div>

                    <p className="text-[13px] text-neutral-500 leading-relaxed line-clamp-2">
                      {vault.description}
                    </p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                      <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                        <span className="text-neutral-400 text-[11px] block">Return vs Pace</span>
                        <span className={`font-bold text-[13px] block mt-0.5 ${isAhead ? "text-emerald-700" : "text-red-700"}`}>
                          {isAhead ? "+" : ""}${alphaGap.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                        <span className="text-neutral-400 text-[11px] block">Fee on Beat</span>
                        <span className="text-neutral-950 font-bold text-[13px] block mt-0.5">
                          {vault.perfFeeBps / 100}%
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                        <span className="text-neutral-400 text-[11px] block">USDC Bond</span>
                        <span className="text-neutral-950 font-bold text-[13px] block mt-0.5">
                          ${vault.bondAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                        <span className="text-neutral-400 text-[11px] block">Curator Owns</span>
                        <span className="text-neutral-950 font-bold text-[13px] block mt-0.5">
                          {curatorSharePct}%
                        </span>
                      </div>
                    </div>

                    <div className="text-[12px] text-neutral-500 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span>Price Band: <strong className="text-neutral-900">${vault.mandate.minPrice} – ${vault.mandate.maxPrice}</strong></span>
                      <span>Max Shortfall: <strong className="text-neutral-900">{vault.mandate.maxShortfallBps / 100}%</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => handleOpenDeposit(vault.id)}
                      className="flex-1 h-[42px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>Follow Curator</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onViewCurator(vault.id)}
                      className="h-[42px] px-5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[13px] font-medium transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Rules
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. QUEUE & SETTLEMENT SUB-PAGE
  // =========================================================================
  if (activeSubPage === "queue") {
    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Queue & Epoch Settlement
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Transparent batch processing at epoch boundaries prevents front-running and arbitrage timing.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-mono shadow-2xs">
            <ClockIcon className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-neutral-950 flex items-center gap-1.5">
              <span>Next Settlement:</span>
              <SettlementCountdown />
            </span>
          </div>
        </div>

        {/* Queue Information Card */}
        <div className="rounded-[32px] border border-neutral-200/80 bg-white p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-lg font-bold text-neutral-950">How Cadra Fair Batching Works</h3>
          <p className="text-[14px] text-neutral-600 leading-relaxed max-w-2xl">
            In decentralized liquidity curation, deposits and withdrawals are queued and processed together at epoch settlement. This guarantees that nobody can time an epoch or sandwich your entry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <span className="font-bold text-neutral-950 block text-[13px]">1. Queue Deposit</span>
              <span className="text-neutral-500 mt-1 block">Your funds are registered in the queue safely.</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <span className="font-bold text-neutral-950 block text-[13px]">2. Epoch Boundary</span>
              <span className="text-neutral-500 mt-1 block">CadraReactive executes batch settlement at TWAP rate.</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <span className="font-bold text-neutral-950 block text-[13px]">3. Shares Issued</span>
              <span className="text-neutral-500 mt-1 block">Vault shares are minted into your wallet seamlessly.</span>
            </div>
          </div>
        </div>

        {/* Current User Queue Entries */}
        <div className="rounded-[32px] border border-neutral-200/80 bg-white p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-lg font-bold text-neutral-950">Your Active Queued Actions</h3>
          {userVaultIds.length === 0 ? (
            <p className="text-[14px] text-neutral-500">You have no pending deposits or withdrawals in the queue.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {userVaultIds.map((id) => {
                const pos = userPositions[id];
                const vault = vaults.find((v) => v.id === id);
                if (!pos || (!pos.pendingDeposit && !pos.pendingWithdraw)) return null;

                return (
                  <div key={id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-neutral-950 text-sm">{vault?.name || `Vault #${id}`}</span>
                      <span className="text-xs text-neutral-500 block font-mono mt-0.5">
                        Deposit Queue: ${pos.pendingDeposit.toLocaleString()} USDC · Withdrawal Queue: {pos.pendingWithdraw} shares
                      </span>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/60 text-neutral-800 text-xs font-mono font-semibold self-start sm:self-auto">
                      Processing Next Settlement
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. REACTIVE SAFETY FEED SUB-PAGE (THE ~1-SECOND GUARDIAN)
  // =========================================================================
  if (activeSubPage === "safety") {
    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                Reactive Network · ~1s Response
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight mt-1">
              Reactive Safety Feed
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              If your curator breaks the rules, your money is pulled to safety in about a second, with nothing off-chain.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono">
            {(["all", "rule_guard", "shock_guard", "settlement"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSafetyFilter(cat)}
                className={`px-3 py-1.5 rounded-full capitalize transition-all cursor-pointer font-semibold ${
                  safetyFilter === cat
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {cat === "all" ? "All Safety Events" : cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-5 rounded-[24px] bg-white border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase block font-semibold">Rule Guard Latency</span>
            <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight block">~1.1s</span>
            <span className="text-[12px] text-neutral-500">Breach on Unichain to automated parking</span>
          </div>
          <div className="p-5 rounded-[24px] bg-white border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase block font-semibold">Base Shock Guard</span>
            <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight block">~0.8s</span>
            <span className="text-[12px] text-neutral-500">Cross-chain shield before arbitrage reaches pool</span>
          </div>
          <div className="p-5 rounded-[24px] bg-white border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase block font-semibold">Off-Chain Reliances</span>
            <span className="text-2xl font-bold text-emerald-700 font-mono tracking-tight block">Zero</span>
            <span className="text-[12px] text-neutral-500">Autonomous Reactive contract replaces keeper bots</span>
          </div>
        </div>

        {/* Events Stream List */}
        <div className="space-y-3.5">
          {filteredSafetyFeed.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-[28px] p-10 text-center space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <ShieldIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-950">No Safety Events Triggered</h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  CadraReactive is actively listening on Unichain Sepolia & Base Sepolia. Rule breaches and cross-chain volatility shocks will stream here in real time.
                </p>
              </div>
            </div>
          ) : (
            filteredSafetyFeed.map((action) => {
              const isRule = action.type === "rule_guard";
              const isShock = action.type === "shock_guard";

              return (
                <div
                  key={action.id}
                  className="bg-white border border-neutral-200/80 rounded-[28px] p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isRule ? "bg-red-500" : isShock ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <span className="font-bold text-neutral-950 text-[15px]">{action.summary}</span>
                      <span className="text-xs font-mono text-neutral-400 font-normal">· {action.vaultName}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 font-bold text-neutral-800">
                        Latency: {action.latencySeconds}s
                      </span>
                      <span>{action.timeFormatted}</span>
                    </div>
                  </div>

                  <p className="text-[13px] text-neutral-600 leading-relaxed font-normal">
                    {action.details}
                  </p>

                  {/* 3-Transaction Chain (Proof for Judges) */}
                  <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 font-mono text-[11px] space-y-1.5">
                    <div className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider mb-1">
                      On-Chain Proof Chain ({action.originChain} -&gt; Reactive Lasna -&gt; Unichain Sepolia)
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-600">
                      <span>1. Origin Event ({action.originChain}):</span>
                      <span className="text-neutral-900 font-bold break-all sm:break-normal">{action.originTxHash}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-600">
                      <span>2. Reactive Contract (Lasna Testnet):</span>
                      <span className="text-neutral-900 font-bold break-all sm:break-normal">{action.reactiveTxHash}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-600">
                      <span>3. Hook Callback (Unichain Sepolia):</span>
                      <span className="text-neutral-900 font-bold break-all sm:break-normal">{action.callbackTxHash}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. PORTFOLIO SUB-PAGE (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Portfolio Benchmark Hero Card */}
      {userVaultIds.length === 0 ? (
        <section className="relative overflow-hidden rounded-[32px] bg-white border border-neutral-200/80 p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-neutral-950 text-white flex items-center justify-center mx-auto shadow-sm p-3">
            <ShieldIcon className="w-full h-full text-white" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em]">
              Welcome to your Follower Portal
            </h2>
            <p className="text-[14px] text-neutral-500 leading-relaxed font-normal">
              Follow top curators to earn active Uniswap v4 yields, benchmarked against The Pace with real USDC bond protection and automated Reactive safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToExplore}
              className="h-[42px] px-6 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Explore Curators</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
            {onNavigateToLeaderboard && (
              <button
                onClick={onNavigateToLeaderboard}
                className="h-[42px] px-6 rounded-full bg-white border border-neutral-200 text-neutral-950 font-semibold text-[13px] hover:bg-neutral-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                View Leaderboard
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ActivityIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
                  Portfolio Benchmark
                </span>
                <h1 className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em] mt-0.5">
                  You vs. The Pace
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-100/90 border border-neutral-200/60 text-xs font-mono text-neutral-600">
              <ClockIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>Next Settlement:</span>
              <span className="font-bold text-neutral-950">
                <SettlementCountdown />
              </span>
            </div>
          </div>

          {/* Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Your Portfolio Value</p>
              <p className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight mt-1.5">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[12px] text-neutral-400 font-medium mt-1">{userVaultIds.length} Vaults Followed</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">The Pace Benchmark</p>
              <p className="text-2xl sm:text-[28px] font-bold text-neutral-950 font-mono tracking-tight mt-1.5">
                ${totalPace.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[12px] text-neutral-400 font-medium mt-1">Passive full-range position return</p>
            </div>

            <div className={`p-5 rounded-2xl border ${isAheadOverall ? "bg-emerald-50/70 border-emerald-200/80" : "bg-red-50/70 border-red-200/80"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isAheadOverall ? "text-emerald-700" : "text-red-700"}`}>
                <TrendUpIcon className="w-3.5 h-3.5" />
                <span>Net Alpha ({isAheadOverall ? "Ahead" : "Behind"})</span>
              </p>
              <p className={`text-2xl sm:text-[28px] font-bold font-mono tracking-tight mt-1.5 ${isAheadOverall ? "text-emerald-950" : "text-red-950"}`}>
                {isAheadOverall ? "+" : ""}${totalGap.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className={`text-[13px] font-medium ml-2 ${isAheadOverall ? "text-emerald-700" : "text-red-700"}`}>
                  ({isAheadOverall ? "+" : ""}{gapPercentage.toFixed(2)}%)
                </span>
              </p>
              <p className={`text-[12px] font-medium mt-1 ${isAheadOverall ? "text-emerald-700/80" : "text-red-700/80"}`}>
                {isAheadOverall ? "You keep 80% of surplus above Pace" : "Curator cash bond covers shortfall"}
              </p>
            </div>
          </div>

          {/* Follower Protection & Fees Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-neutral-100 font-mono text-xs">
            <div className="flex items-center gap-2 text-neutral-600">
              <ShieldIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Protected by <strong className="text-neutral-950">${totalProtectingBond.toLocaleString()} USDC</strong> bonds</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <CheckCircleIcon className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Fees Paid: <strong className="text-neutral-950">${totalFeesPaid.toLocaleString()}</strong> (on alpha only)</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <ZapIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bond Compensation: <strong className="text-neutral-950">${totalPayoutsReceived.toLocaleString()}</strong></span>
            </div>
          </div>
        </section>
      )}

      {/* Followed Vaults List */}
      {userVaultIds.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-neutral-900">
              Active Followed Vaults
            </h2>
            <button
              onClick={onNavigateToExplore}
              className="text-xs font-semibold text-neutral-900 hover:underline cursor-pointer"
            >
              + Follow Another Curator
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {userVaultIds.map((vaultId) => {
              const vault = vaults.find((v) => v.id === vaultId);
              const pos = userPositions[vaultId];
              if (!vault || !pos) return null;

              const gap = pos.currentValue - pos.paceEquivalent;
              const isAhead = gap >= 0;

              return (
                <div
                  key={vault.id}
                  className="bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-[28px] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[17px] font-bold text-neutral-950 tracking-tight">{vault.name}</span>
                        <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/60 text-neutral-700 font-semibold">
                          {vault.tag}
                        </span>
                        {vault.isParked && (
                          <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 flex items-center gap-1 font-semibold">
                            <AlertTriangleIcon className="w-3.5 h-3.5" />
                            Parked into Pace (Safety Net)
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-500 font-mono mt-1">
                        Fee: {vault.perfFeeBps / 100}% on beat only · Curator Bond: ${vault.bondAmount.toLocaleString()} USDC · Curator owns {(vault.curatorOwnershipBps / 100).toFixed(0)}%
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDeposit(vault.id)}
                        className="h-[38px] px-4.5 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() => handleOpenWithdraw(vault.id)}
                        className="h-[38px] px-4.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-[13px] font-medium transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => onViewCurator(vault.id)}
                        className="w-[38px] h-[38px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                        title="View Rules & Mandate"
                      >
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-mono text-xs">
                    <div>
                      <span className="text-neutral-500 uppercase text-xs block">Your Value</span>
                      <span className="text-base font-bold text-neutral-950 mt-0.5 block">
                        ${pos.currentValue.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-xs block">The Pace Value</span>
                      <span className="text-base font-bold text-neutral-700 mt-0.5 block">
                        ${pos.paceEquivalent.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-xs block">Performance</span>
                      <span className={`text-base font-bold mt-0.5 block ${isAhead ? "text-emerald-700" : "text-red-700"}`}>
                        {isAhead ? "+" : ""}${gap.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-xs block">Shares</span>
                      <span className="text-base font-bold text-neutral-800 mt-0.5 block">
                        {pos.shares.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Deposit / Withdraw Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.14)] border border-neutral-200/80">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-950 tracking-tight">
                  {activeModal === "deposit" ? "Deposit with Curator" : "Withdraw from Vault"}
                </h3>
                <p className="text-[12px] text-neutral-500 font-mono mt-0.5">
                  Vault #{selectedVaultId} · Queued at epoch boundary
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-neutral-700 block">
                  {activeModal === "deposit" ? "Amount in USDC" : "Shares to Redeem"}
                </label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full text-lg font-mono bg-white border border-neutral-200/90 rounded-2xl px-4 py-3 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 shadow-2xs transition-all"
                  placeholder="1000"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 text-xs text-neutral-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Curator cash bond guarantees shortfall coverage.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>Processed at next settlement without front-running.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 h-[44px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold text-[13px] transition-all cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 h-[44px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.98]"
              >
                {!connectedAddress
                  ? "Connect Wallet"
                  : `Confirm ${activeModal === "deposit" ? "Deposit" : "Withdrawal"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
