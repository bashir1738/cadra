"use client";

import React, { useState, useMemo } from "react";
import { VaultData } from "../types/cadra";
import { ScaleIcon, TrendUpIcon, TrendDownIcon, ArrowRightIcon, ShieldIcon } from "./Icons";

interface LeaderboardProps {
  vaults: VaultData[];
  onSelectCurator: (vaultId: number) => void;
  onFollowCurator: (vaultId: number) => void;
  onOpenCuratorStudio?: () => void;
}

export const Leaderboard = React.memo(function Leaderboard({
  vaults,
  onSelectCurator,
  onFollowCurator,
  onOpenCuratorStudio,
}: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<"ahead" | "multiplier" | "gap" | "capacity">("ahead");

  // Calculate and sort cumulative stats for each vault
  const sortedVaults = useMemo(() => {
    const augmented = vaults.map((vault) => {
      const aheadEpochs = vault.history.filter((h) => h.outcome === "ahead").length;
      const behindEpochs = vault.history.filter((h) => h.outcome === "behind").length;
      const cumulativeGap = vault.history.reduce((acc, h) => acc + h.gap, 0) + (vault.vaultValue - vault.paceValue);
      const capacityUsagePct = vault.capacity > 0 ? (vault.totalFollowerValue / vault.capacity) * 100 : 0;

      return {
        ...vault,
        aheadEpochs,
        behindEpochs,
        cumulativeGap,
        capacityUsagePct,
      };
    });

    return [...augmented].sort((a, b) => {
      if (sortBy === "ahead") return b.aheadEpochs - a.aheadEpochs;
      if (sortBy === "multiplier") return b.capacityMultiplier - a.capacityMultiplier;
      if (sortBy === "gap") return b.cumulativeGap - a.cumulativeGap;
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return 0;
    });
  }, [vaults, sortBy]);

  if (vaults.length === 0) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="rounded-[32px] bg-white border border-neutral-200/80 p-10 sm:p-14 text-center space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-neutral-950">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
              <ScaleIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-950 tracking-tight">No Active Curator Vaults Yet</h2>
            <p className="text-sm text-neutral-500 leading-relaxed font-normal">
              No vaults have been opened on this pool yet. Curators can open the first vault by publishing an honest mandate and staking USDC bond collateral.
            </p>
            {onOpenCuratorStudio && (
              <div className="pt-2">
                <button
                  onClick={onOpenCuratorStudio}
                  className="h-[42px] px-6 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Open Curator Studio</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Title & Filter Pills */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            Curator Leaderboard
          </h1>
          <p className="text-[14px] text-neutral-500 mt-1">
            Curators compete to beat the Pace. Ranked by verified on-chain outperformance and skin-in-the-game.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono">
          <span className="text-neutral-500 uppercase px-2 font-semibold">Rank By:</span>
          {(["ahead", "multiplier", "gap", "capacity"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSortBy(filter)}
              className={`px-3 py-1.5 rounded-full transition-all uppercase text-xs font-semibold cursor-pointer ${
                sortBy === filter
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {filter === "ahead" ? "Record" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Clean Leaderboard Table */}
      <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-neutral-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 uppercase text-[11px] font-semibold bg-neutral-50/70">
                <th className="py-4 px-5">#</th>
                <th className="py-4 px-5">Curator Vault</th>
                <th className="py-4 px-5">Alpha vs Pace</th>
                <th className="py-4 px-5">Bond Collateral</th>
                <th className="py-4 px-5">Curator Owns</th>
                <th className="py-4 px-5">Multiplier</th>
                <th className="py-4 px-5">Fee</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedVaults.map((vault, idx) => {
                const isAheadOverall = vault.cumulativeGap >= 0;
                const curatorSharePct = (vault.curatorOwnershipBps / 100).toFixed(0);

                return (
                  <tr key={vault.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-neutral-400">
                      <span className="w-6 h-6 rounded-full bg-neutral-100 inline-flex items-center justify-center text-neutral-800 font-sans text-xs font-bold">
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-950 text-sm font-sans">{vault.name}</span>
                        <span className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {vault.curatorAddress.slice(0, 6)}...{vault.curatorAddress.slice(-4)} · {vault.tag}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`font-bold flex items-center gap-1 text-sm ${
                          isAheadOverall ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {isAheadOverall ? <TrendUpIcon className="w-3.5 h-3.5" /> : <TrendDownIcon className="w-3.5 h-3.5" />}
                        {isAheadOverall ? "+" : ""}${vault.cumulativeGap.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 block font-normal mt-0.5">
                        {vault.aheadEpochs} Ahead / {vault.behindEpochs} Behind
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-neutral-950 font-bold text-xs">${vault.bondAmount.toLocaleString()} USDC</span>
                      <span className="text-[10px] text-neutral-400 block font-normal mt-0.5">Max ${vault.capacity.toLocaleString()}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-neutral-950 font-bold text-xs">{curatorSharePct}%</span>
                      <span className="text-[10px] text-neutral-400 block font-normal mt-0.5">Skin in game</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs">
                        {vault.capacityMultiplier}×
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-neutral-900 font-bold text-xs">{vault.perfFeeBps / 100}%</span>
                      <span className="text-[10px] text-neutral-400 block font-normal mt-0.5">on beat</span>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          vault.isParked
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                        }`}
                      >
                        {vault.isParked ? "Parked" : "Active"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onFollowCurator(vault.id)}
                          className="h-[34px] px-3.5 rounded-full bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                        >
                          Follow
                        </button>
                        <button
                          onClick={() => onSelectCurator(vault.id)}
                          className="h-[34px] px-3 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs transition-all cursor-pointer font-medium active:scale-[0.98]"
                        >
                          Rules
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
