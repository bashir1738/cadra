"use client";

import React, { useState, useEffect } from "react";
import { VaultData, UserPosition } from "../types/cadra";
import { ShieldIcon, TrendUpIcon, ClockIcon, ArrowRightIcon, AlertTriangleIcon, CheckCircleIcon, ActivityIcon } from "./Icons";

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Discover Curators
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Select an expert curator. Your capital is protected by cash bonds.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
            {vaults.length} Active Vaults
          </span>
        </div>

        {vaults.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-12 text-center space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">No Curator Vaults Found</h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              No curators have launched on this pool yet. Curators can deploy a vault in Curator Studio.
            </p>
            {onNavigateToStudio && (
              <button
                onClick={onNavigateToStudio}
                className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Go to Curator Studio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-950 text-lg">{vault.name}</span>
                    <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold">
                      {vault.tag}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">{vault.description}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                      <span className="text-neutral-500 text-xs block">Fee</span>
                      <span className="text-neutral-950 font-bold text-sm">{vault.perfFeeBps / 100}% on beat</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                      <span className="text-neutral-500 text-xs block">Cash Bond</span>
                      <span className="text-neutral-950 font-bold text-sm">${vault.bondAmount.toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                      <span className="text-neutral-500 text-xs block">Price Band</span>
                      <span className="text-neutral-950 font-bold text-sm">
                        ${vault.mandate.minPrice}–${vault.mandate.maxPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleOpenDeposit(vault.id)}
                    className="flex-1 py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Follow Curator</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onViewCurator(vault.id)}
                    className="px-4 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-all cursor-pointer"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Queue & Epoch Settlement
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Transparent batch processing at epoch boundaries to prevent sandwich attacks.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono">
            <ClockIcon className="w-4 h-4 text-neutral-600" />
            <span className="font-semibold text-neutral-900">
              Next Epoch: {String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Queue Information Card */}
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-neutral-950">How Cadra Fair Batching Works</h3>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
            In decentralized liquidity curation, deposits and withdrawals are queued and processed together at epoch settlement. This guarantees that no trader can sandwich or front-run your liquidity entry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm">1. Queue Deposit</span>
              <span className="text-neutral-500 mt-1 block">Your funds are registered in the queue safely.</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm">2. Epoch Boundary</span>
              <span className="text-neutral-500 mt-1 block">Keeper executes batch settlement at TWAP rate.</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm">3. Shares Issued</span>
              <span className="text-neutral-500 mt-1 block">Vault shares are minted into your wallet seamlessly.</span>
            </div>
          </div>
        </div>

        {/* Current User Queue Entries */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-neutral-950">Your Active Queued Actions</h3>
          {userVaultIds.length === 0 ? (
            <p className="text-sm text-neutral-500">You have no pending deposits or withdrawals in the queue.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {userVaultIds.map((id) => {
                const pos = userPositions[id];
                const vault = vaults.find((v) => v.id === id);
                if (!pos || (!pos.pendingDeposit && !pos.pendingWithdraw)) return null;

                return (
                  <div key={id} className="py-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-900 text-sm">{vault?.name || `Vault #${id}`}</span>
                      <span className="text-xs text-neutral-500 block font-mono">
                        Deposit Queue: ${pos.pendingDeposit.toLocaleString()} · Withdrawal Queue: {pos.pendingWithdraw} shares
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-mono font-semibold">
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
        <section className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 text-white shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white mx-auto shadow-sm">
            <ShieldIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to your Follower Portal
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              You haven&apos;t followed any curators yet! Follow top managers to earn passive yields, benchmarked against The Pace with 100% bond protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToExplore}
              className="px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <span>Explore Curators</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
            {onNavigateToLeaderboard && (
              <button
                onClick={onNavigateToLeaderboard}
                className="px-6 py-3 rounded-full bg-neutral-800 border border-neutral-700 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-700 transition-all cursor-pointer"
              >
                View Leaderboard
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sky-400 shrink-0 hidden sm:flex shadow-sm">
                <ActivityIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold block">
                  PORTFOLIO BENCHMARK
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                  You vs. The Pace
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-mono">
              <ClockIcon className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-neutral-400 block text-xs">Next Settlement</span>
                <span className="text-white font-bold text-xs">
                  {String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700">
              <p className="text-xs font-mono text-neutral-400 uppercase">Your Portfolio Value</p>
              <p className="text-3xl font-extrabold text-white mt-1">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-1">{userVaultIds.length} Vaults Followed</p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700">
              <p className="text-xs font-mono text-neutral-400 uppercase">The Pace Benchmark</p>
              <p className="text-3xl font-extrabold text-neutral-300 mt-1">
                ${totalPace.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-1">Passive pool return</p>
            </div>

            <div className={`p-5 rounded-2xl border ${isAheadOverall ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/40 border-red-500/40 text-red-300"}`}>
              <p className={`text-xs font-mono uppercase flex items-center gap-1 font-semibold ${isAheadOverall ? "text-emerald-400" : "text-red-400"}`}>
                <TrendUpIcon className="w-4 h-4" />
                Net Alpha ({isAheadOverall ? "Ahead" : "Behind"})
              </p>
              <p className={`text-3xl font-extrabold mt-1 ${isAheadOverall ? "text-emerald-400" : "text-red-400"}`}>
                {isAheadOverall ? "+" : ""}${totalGap.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-normal ml-2 font-mono">
                  ({isAheadOverall ? "+" : ""}{gapPercentage.toFixed(2)}%)
                </span>
              </p>
              <p className="text-xs font-mono mt-1 opacity-80">
                {isAheadOverall ? "You keep 80% of outperformance" : "Curator bond covers deficit"}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-emerald-400" />
              <span>Downside protected by <strong>${totalProtectingBond.toLocaleString()} USDC</strong> curator bonds</span>
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
                  className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-3xl p-6 shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-neutral-950">{vault.name}</span>
                        <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold">
                          {vault.tag}
                        </span>
                        {vault.isParked && (
                          <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 flex items-center gap-1 font-semibold">
                            <AlertTriangleIcon className="w-3.5 h-3.5" />
                            Parked (Safety Net)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-1">
                        Fee: {vault.perfFeeBps / 100}% on beat only · Bond: ${vault.bondAmount.toLocaleString()} USDC
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDeposit(vault.id)}
                        className="px-4 py-2 rounded-full bg-neutral-900 text-white font-semibold text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() => handleOpenWithdraw(vault.id)}
                        className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-all cursor-pointer"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => onViewCurator(vault.id)}
                        className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-950">
                  {activeModal === "deposit" ? "Deposit with Curator" : "Withdraw from Vault"}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Vault #{selectedVaultId} · Queued at epoch boundary
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">
                  {activeModal === "deposit" ? "Amount in USDC" : "Shares to Redeem"}
                </label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full text-lg font-mono bg-neutral-50 border border-neutral-300 rounded-2xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  placeholder="1000"
                />
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2">
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
                className="flex-1 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
              >
                Confirm {activeModal === "deposit" ? "Deposit" : "Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
