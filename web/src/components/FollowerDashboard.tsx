"use client";

import React, { useState, useEffect } from "react";
import { VaultData, UserPosition } from "../types/cadra";
import { ShieldIcon, TrendUpIcon, ClockIcon, ArrowRightIcon, AlertTriangleIcon, CheckCircleIcon, ActivityIcon, XIcon } from "./Icons";
import { useCadra } from "../context/CadraContext";

interface FollowerDashboardProps {
  vaults: VaultData[];
  userPositions: Record<number, UserPosition>;
  activeSubPage?: "portfolio" | "explore" | "queue";
  onDeposit: (vaultId: number, amount: number) => void;
  onWithdraw: (vaultId: number, shares: number) => void;
  onViewCurator: (vaultId: number) => void;
  onNavigateToExplore?: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToStudio?: () => void;
}

export function FollowerDashboard({
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
  const { connectedAddress, openConnectModal } = useCadra();
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<number>(vaults[0]?.id || 1);
  const [amountInput, setAmountInput] = useState<string>("1000");

  // Countdown timer simulation for epoch
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

  const userVaultIds = Object.keys(userPositions).map(Number);
  const totalValue = userVaultIds.reduce(
    (acc, id) => acc + (userPositions[id]?.currentValue || 0),
    0
  );
  const totalPace = userVaultIds.reduce(
    (acc, id) => acc + (userPositions[id]?.paceEquivalent || 0),
    0
  );
  const totalGap = totalValue - totalPace;
  const isAheadOverall = totalGap >= 0;
  const gapPercentage = totalPace > 0 ? (totalGap / totalPace) * 100 : 0;

  const totalProtectingBond = userVaultIds.reduce((acc, id) => {
    const v = vaults.find((vault) => vault.id === id);
    return acc + (v?.bondAmount || 0);
  }, 0);

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

  // 1. DISCOVER CURATORS SUB-PAGE
  if (activeSubPage === "explore") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Discover Curators
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Select an expert curator. Your capital is protected by cash bonds.
            </p>
          </div>
          <span className="text-[12px] font-mono px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 font-semibold shadow-2xs">
            {vaults.length} Active Vaults
          </span>
        </div>

        {vaults.length === 0 ? (
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
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-950 text-[17px] tracking-tight">{vault.name}</span>
                    <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/60 text-neutral-700 font-semibold">
                      {vault.tag}
                    </span>
                  </div>

                  <p className="text-[13px] text-neutral-500 leading-relaxed line-clamp-2">{vault.description}</p>

                  <div className="grid grid-cols-3 gap-2.5 pt-1 font-mono">
                    <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                      <span className="text-neutral-400 text-[11px] block">Fee</span>
                      <span className="text-neutral-950 font-bold text-[13px]">{vault.perfFeeBps / 100}% on beat</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                      <span className="text-neutral-400 text-[11px] block">Cash Bond</span>
                      <span className="text-neutral-950 font-bold text-[13px]">${vault.bondAmount.toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60">
                      <span className="text-neutral-400 text-[11px] block">Price Band</span>
                      <span className="text-neutral-950 font-bold text-[13px]">
                        ${vault.mandate.minPrice}–${vault.mandate.maxPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
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
                    Mandate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. QUEUE & ACTIVITY SUB-PAGE
  if (activeSubPage === "queue") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Queue & Epoch Settlement
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Transparent batch processing at epoch boundaries to prevent sandwich attacks.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-mono shadow-2xs">
            <ClockIcon className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-neutral-950">
              Next Epoch: {String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Queue Information Card */}
        <div className="rounded-[32px] border border-neutral-200/80 bg-white p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-lg font-bold text-neutral-950">How Cadra Fair Batching Works</h3>
          <p className="text-[14px] text-neutral-600 leading-relaxed max-w-2xl">
            In decentralized liquidity curation, deposits and withdrawals are queued and processed together at epoch settlement. This guarantees that no trader can sandwich or front-run your liquidity entry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <span className="font-bold text-neutral-950 block text-[13px]">1. Queue Deposit</span>
              <span className="text-neutral-500 mt-1 block">Your funds are registered in the queue safely.</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
              <span className="font-bold text-neutral-950 block text-[13px]">2. Epoch Boundary</span>
              <span className="text-neutral-500 mt-1 block">Keeper executes batch settlement at TWAP rate.</span>
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
                  <div key={id} className="py-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-950 text-sm">{vault?.name || `Vault #${id}`}</span>
                      <span className="text-xs text-neutral-500 block font-mono mt-0.5">
                        Deposit Queue: ${pos.pendingDeposit.toLocaleString()} · Withdrawal Queue: {pos.pendingWithdraw} shares
                      </span>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/60 text-neutral-800 text-xs font-mono font-semibold">
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

  // 3. PORTFOLIO SUB-PAGE (DEFAULT)
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
              Follow top curators to earn active Uniswap v4 yields, benchmarked against The Pace with real USDC bond protection.
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
                {String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
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
              <p className="text-[12px] text-neutral-400 font-medium mt-1">Passive pool return</p>
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
                {isAheadOverall ? "You keep 80% of outperformance" : "Curator bond covers deficit"}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[12px] text-neutral-500">
            <span className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-emerald-600" />
              <span>Downside protected by <strong className="text-neutral-900">${totalProtectingBond.toLocaleString()} USDC</strong> curator bonds</span>
            </span>
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
                            Parked (Safety Net)
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-500 font-mono mt-1">
                        Fee: {vault.perfFeeBps / 100}% on beat only · Bond: ${vault.bondAmount.toLocaleString()} USDC
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
                        title="View Mandate"
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
}
