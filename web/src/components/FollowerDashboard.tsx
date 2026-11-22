"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { VaultData, UserPosition, ReactiveSafetyAction } from "../types/cadra";
import {
  ShieldIcon,
  TrendUpIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
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
  onDeposit: (vaultId: number, amount: number) => void | Promise<any>;
  onWithdraw: (vaultId: number, shares: number) => void | Promise<any>;
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
  const {
    connectedAddress,
    openConnectModal,
    reactiveSafetyFeed,
    userUsdcBalance = 0,
    mintTestTokens,
    isLoadingOnChain,
  } = useCadra();
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<number>(vaults[0]?.id || 1);
  const [amountInput, setAmountInput] = useState<string>("10");
  const [safetyFilter, setSafetyFilter] = useState<"all" | "rule_guard" | "shock_guard" | "settlement">("all");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

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
    setAmountInput("10");
    setModalError(null);
    setActiveModal("deposit");
  };

  const handleOpenWithdraw = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    const pos = userPositions[vaultId];
    setAmountInput(pos ? (pos.shares / 2).toString() : "0");
    setModalError(null);
    setActiveModal("withdraw");
  };

  const handleConfirmAction = async () => {
    if (!connectedAddress) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    if (activeModal === "deposit") {
      if (val < 5) {
        setModalError("Minimum deposit is $5 USDC.");
        return;
      }
      if (userUsdcBalance < val) {
        setModalError(`Insufficient USDC balance ($${userUsdcBalance.toLocaleString()} available). Please claim testnet USDC from the Circle Faucet.`);
        return;
      }
      const targetVault = vaults.find((v) => v.id === selectedVaultId);
      if (targetVault && (targetVault.bondAmount <= 0 || targetVault.capacity <= 0)) {
        setModalError(`Vault #${selectedVaultId} currently has $0 curator bond staked. Under Cadra's protocol rules, curators must stake cash bond collateral in Curator Studio before followers can deposit.`);
        return;
      }
      if (targetVault) {
        const remainingCap = targetVault.capacity - targetVault.totalFollowerValue;
        if (val > remainingCap) {
          setModalError(`Deposit amount ($${val.toLocaleString()}) exceeds the vault's remaining capacity of $${Math.max(0, remainingCap).toLocaleString()} USDC.`);
          return;
        }
      }
    }

    setIsSubmittingAction(true);
    setModalError(null);
    setActionNotice(null);
    const targetVault = vaults.find((v) => v.id === selectedVaultId);
    const vaultName = targetVault?.name || `Vault #${selectedVaultId}`;
    const actionLabel = activeModal === "deposit" ? `Depositing $${val.toLocaleString()} USDC` : `Withdrawing ${val.toLocaleString()} shares`;
    const toastId = toast.loading(`${actionLabel} on Unichain Sepolia...`);

    try {
      if (activeModal === "deposit") {
        await onDeposit(selectedVaultId, val);
        toast.success(`Successfully deposited $${val.toLocaleString()} USDC into ${vaultName}!`, { id: toastId });
        setActionNotice(`Successfully deposited $${val.toLocaleString()} USDC on-chain into ${vaultName}.`);
      } else if (activeModal === "withdraw") {
        await onWithdraw(selectedVaultId, val);
        toast.success(`Withdrawal queued for ${val.toLocaleString()} shares from ${vaultName}!`, { id: toastId });
        setActionNotice(`Successfully queued withdrawal of ${val.toLocaleString()} shares on-chain from ${vaultName}.`);
      }
      setActiveModal(null);
      setTimeout(() => setActionNotice(null), 8000);
    } catch (err: any) {
      const isRejected =
        err?.message?.includes("denied") ||
        err?.message?.includes("rejected") ||
        err?.shortMessage?.includes("rejected") ||
        err?.shortMessage?.includes("denied");

      if (isRejected) {
        toast.error("Transaction cancelled in wallet", { id: toastId });
        setModalError("Transaction was cancelled in your wallet.");
      } else {
        console.error("Action error:", err);
        const msg = err?.shortMessage || err?.message || "Transaction error";
        toast.error(`Transaction failed: ${msg}`, { id: toastId });
        setModalError(msg);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredSafetyFeed = reactiveSafetyFeed.filter((item) => {
    if (safetyFilter === "all") return true;
    return item.type === safetyFilter;
  });

  const NotificationBanner = actionNotice ? (
    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-neutral-950 text-white text-[13px] shadow-sm animate-in fade-in duration-200">
      <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-white">Action Confirmed</p>
        <p className="text-neutral-300 text-[12px] mt-0.5 leading-relaxed">{actionNotice}</p>
      </div>
      <button
        type="button"
        onClick={() => setActionNotice(null)}
        className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
      >
        ×
      </button>
    </div>
  ) : null;

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
        {NotificationBanner}
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
        {NotificationBanner}
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
      <div suppressHydrationWarning className="space-y-5 font-sans max-w-5xl mx-auto">
        {NotificationBanner}

        {/* Header & Filter Controls */}
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
            <p className="text-[13px] text-neutral-500 mt-0.5">
              Autonomous cross-chain guardian pulling assets to safety in ~1s with zero off-chain keeper bots.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono">
            {(["all", "rule_guard", "shock_guard", "settlement"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSafetyFilter(cat)}
                className={`px-3 py-1 rounded-full capitalize transition-all cursor-pointer font-semibold ${
                  safetyFilter === cat
                    ? "bg-white text-neutral-950 shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {cat === "all" ? "All" : cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 text-xs font-mono">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-neutral-200/60 shadow-2xs">
            <span className="text-neutral-500">Rule Guard</span>
            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">~1.1s Latency</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-neutral-200/60 shadow-2xs">
            <span className="text-neutral-500">Shock Guard</span>
            <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">~0.8s Shield</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-neutral-200/60 shadow-2xs">
            <span className="text-neutral-500">Keepers / Bots</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">0 (Autonomous)</span>
          </div>
        </div>

        {/* Events Stream List */}
        <div className="space-y-3">
          {filteredSafetyFeed.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
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
                  className="bg-white border border-neutral-200/80 rounded-2xl p-6 space-y-4 shadow-2xs hover:border-neutral-300 transition-colors"
                >
                  {/* Top Bar: Event Type, Summary & Timing */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono tracking-wide ${
                          isRule
                            ? "bg-red-50 text-red-700 border border-red-200/60"
                            : isShock
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}
                      >
                        {isRule ? "Rule Guard" : isShock ? "Shock Guard" : "Settlement"}
                      </span>
                      <span className="font-bold text-neutral-950 text-base sm:text-[17px] tracking-tight">{action.summary}</span>
                      <span className="text-sm text-neutral-500 font-medium">· {action.vaultName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-mono text-neutral-500 shrink-0">
                      <span className="font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-md">
                        {action.latencySeconds}s
                      </span>
                      <span>{action.timeFormatted}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-[15px] text-neutral-700 leading-relaxed font-normal">
                    {action.details}
                  </p>

                  {/* Proof Chain (Strictly on a Single Straight Horizontal Line) */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap text-xs sm:text-[13px] font-mono">
                    <span className="text-xs uppercase font-bold tracking-wider text-neutral-400 shrink-0">
                      Proof Chain
                    </span>
                    <div className="flex items-center flex-nowrap gap-2 shrink-0">
                      {/* Step 1: Origin */}
                      <a
                        href={
                          action.originChain.includes("Base")
                            ? `https://sepolia.basescan.org/tx/${action.originTxHash}`
                            : `https://sepolia.uniscan.xyz/tx/${action.originTxHash}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-950 transition-colors whitespace-nowrap"
                        title={`Origin Event on ${action.originChain}`}
                      >
                        <span className="text-neutral-400 font-normal">Origin:</span>
                        <span className="font-semibold">{action.originChain.includes("Base") ? "Base" : "Unichain"}</span>
                        <span className="text-neutral-400 font-mono">
                          ({action.originTxHash.length > 12 ? `${action.originTxHash.slice(0, 6)}...${action.originTxHash.slice(-4)}` : action.originTxHash})
                        </span>
                        <ArrowUpRightIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      </a>

                      <span className="shrink-0 text-neutral-400 font-bold px-0.5 select-none">&rarr;</span>

                      {/* Step 2: Reactive Lasna */}
                      <a
                        href={
                          action.reactiveTxHash.startsWith("0x0612")
                            ? `https://lasna-omni.reactscan.net/address/${action.reactiveTxHash}`
                            : `https://lasna-omni.reactscan.net/tx/${action.reactiveTxHash}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/60 text-purple-900 transition-colors whitespace-nowrap"
                        title="Reactive Lasna RSC Reaction"
                      >
                        <span className="text-purple-400 font-normal">Reactive:</span>
                        <span className="font-semibold">Lasna</span>
                        <span className="text-purple-500 font-mono">
                          ({action.reactiveTxHash.length > 12 ? `${action.reactiveTxHash.slice(0, 6)}...${action.reactiveTxHash.slice(-4)}` : action.reactiveTxHash})
                        </span>
                        <ArrowUpRightIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      </a>

                      <span className="shrink-0 text-neutral-400 font-bold px-0.5 select-none">&rarr;</span>

                      {/* Step 3: Callback */}
                      <a
                        href={
                          action.callbackTxHash.startsWith("0xb4Df")
                            ? `https://sepolia.uniscan.xyz/address/${action.callbackTxHash}`
                            : `https://sepolia.uniscan.xyz/tx/${action.callbackTxHash}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 text-emerald-900 transition-colors whitespace-nowrap"
                        title="Unichain Sepolia Hook Callback"
                      >
                        <span className="text-emerald-500 font-normal">Callback:</span>
                        <span className="font-semibold">Unichain</span>
                        <span className="text-emerald-600 font-mono">
                          ({action.callbackTxHash.length > 12 ? `${action.callbackTxHash.slice(0, 6)}...${action.callbackTxHash.slice(-4)}` : action.callbackTxHash})
                        </span>
                        <ArrowUpRightIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </a>
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
      {NotificationBanner}
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
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.14)] border border-neutral-200/80">
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
                onClick={() => {
                  setActiveModal(null);
                  setModalError(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertTriangleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed text-[12px]">{modalError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] font-semibold text-neutral-700 block">
                    {activeModal === "deposit" ? "Amount in USDC (Min $5)" : "Shares to Redeem"}
                  </label>
                  {activeModal === "deposit" && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-500 font-mono">
                        Balance: <strong className="text-neutral-900">${userUsdcBalance.toLocaleString()}</strong>
                      </span>
                      {userUsdcBalance < 5 && (
                        <button
                          type="button"
                          onClick={mintTestTokens}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold underline text-[11px] cursor-pointer"
                        >
                          + Circle Faucet (+20 USDC) ↗
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setModalError(null);
                  }}
                  className="w-full text-lg font-mono bg-white border border-neutral-200/90 rounded-2xl px-4 py-3 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 shadow-2xs transition-all"
                  placeholder="10"
                />

                {/* Quick Presets for Deposit */}
                {activeModal === "deposit" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-neutral-400 font-sans">Presets:</span>
                    {[5, 10, 15, 20].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmountInput(preset.toString());
                          setModalError(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                      >
                        +${preset}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Presets for Withdraw */}
                {activeModal === "withdraw" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-neutral-400 font-sans">Quick:</span>
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const maxShares = userPositions[selectedVaultId]?.shares || 0;
                      const amount = Math.floor(maxShares * ratio);
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            setAmountInput(amount.toString());
                            setModalError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                        >
                          {ratio === 1 ? "Max" : `${ratio * 100}%`}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Insufficient balance helper with Circle Faucet */}
                {activeModal === "deposit" && userUsdcBalance < (parseFloat(amountInput) || 0) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs space-y-2 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-950">Insufficient USDC Balance</p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Your wallet has ${userUsdcBalance.toLocaleString()} USDC on Unichain Sepolia. Claim 20 testnet USDC from the official Circle Faucet to complete your deposit.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={mintTestTokens}
                      className="w-full h-8.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Claim 20 USDC from Circle Faucet ↗</span>
                    </button>
                  </div>
                )}

                {/* Small deposit warning */}
                {activeModal === "deposit" &&
                  (parseFloat(amountInput) || 0) > 0 &&
                  (parseFloat(amountInput) || 0) < 5 && (
                    <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs flex items-center gap-2 mt-2">
                      <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-[11px]">
                        Minimum deposit is $5 USDC. Please use $5 or higher.
                      </span>
                    </div>
                  )}

                {/* Zero curator bond warning */}
                {activeModal === "deposit" && (() => {
                  const targetV = vaults.find((v) => v.id === selectedVaultId);
                  if (targetV && targetV.bondAmount <= 0) {
                    return (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1 mt-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-rose-950">Curator Cash Bond Required ($0 Capacity)</p>
                            <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                              This vault has $0 curator cash bond posted. In Cadra, curators must stake a USDC cash bond to guarantee shortfall coverage before followers can deposit.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Exceeded capacity warning */}
                {activeModal === "deposit" && (() => {
                  const targetV = vaults.find((v) => v.id === selectedVaultId);
                  if (targetV && targetV.bondAmount > 0) {
                    const remCap = Math.max(0, targetV.capacity - targetV.totalFollowerValue);
                    if ((parseFloat(amountInput) || 0) > remCap) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2 mt-2">
                          <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-950">Vault Capacity Exceeded</p>
                            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                              Remaining capacity is ${remCap.toLocaleString()} USDC based on curator&apos;s ${targetV.bondAmount.toLocaleString()} USDC bond ({targetV.capacityMultiplier}× multiplier).
                            </p>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 text-xs text-neutral-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Curator cash bond guarantees shortfall coverage.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>$0 deposit &amp; withdrawal fee. Platform fee is 1% only on profit.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>Processed at next settlement without front-running.</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setModalError(null);
                }}
                className="flex-1 h-[44px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold text-[13px] transition-all cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>

              {activeModal === "deposit" && userUsdcBalance < (parseFloat(amountInput) || 0) ? (
                <button
                  type="button"
                  onClick={mintTestTokens}
                  className="flex-1 h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Claim 20 USDC at Circle Faucet ↗</span>
                </button>
              ) : (() => {
                const targetV = vaults.find((v) => v.id === selectedVaultId);
                const isZeroBond = Boolean(targetV && targetV.bondAmount <= 0);
                const remCap = targetV ? Math.max(0, targetV.capacity - targetV.totalFollowerValue) : 0;
                const isCapExceeded = Boolean(targetV && !isZeroBond && (parseFloat(amountInput) || 0) > remCap);

                return (
                  <button
                    type="button"
                    disabled={
                      isSubmittingAction ||
                      (Boolean(connectedAddress) &&
                        activeModal === "deposit" && (
                          (parseFloat(amountInput) || 0) < 5 ||
                          isZeroBond ||
                          isCapExceeded
                        ))
                    }
                    onClick={handleConfirmAction}
                    className="flex-1 h-[44px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingAction ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : !connectedAddress ? (
                      "Connect Wallet"
                    ) : activeModal === "deposit" && isZeroBond ? (
                      "Curator Bond Required"
                    ) : activeModal === "deposit" && isCapExceeded ? (
                      "Capacity Exceeded"
                    ) : activeModal === "deposit" && (parseFloat(amountInput) || 0) < 5 ? (
                      "Min Deposit $5"
                    ) : (
                      `Confirm ${activeModal === "deposit" ? "Deposit" : "Withdrawal"}`
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
