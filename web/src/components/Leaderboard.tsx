"use client";

import React, { useState } from "react";
import { VaultData } from "../types/cadra";
import { ScaleIcon, TrendUpIcon, TrendDownIcon, ArrowRightIcon } from "./Icons";

interface LeaderboardProps {
  vaults: VaultData[];
  onSelectCurator: (vaultId: number) => void;
  onFollowCurator: (vaultId: number) => void;
  onOpenCuratorStudio?: () => void;
}

export function Leaderboard({
  vaults,
  onSelectCurator,
  onFollowCurator,
  onOpenCuratorStudio,
}: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<"ahead" | "multiplier" | "gap" | "capacity">("ahead");

  if (vaults.length === 0) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-10 sm:p-14 text-center space-y-5 shadow-2xl text-white">
          <div className="relative z-10 flex flex-col items-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shadow-sm">
              <ScaleIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">No Active Curator Vaults Yet</h2>
            <p className="text-sm text-neutral-300 leading-relaxed font-normal">
              No vaults have been opened on this pool yet. Curators can open the first vault by publishing a price mandate and posting bond collateral.
            </p>
            {onOpenCuratorStudio && (
              <div className="pt-2">
                <button
                  onClick={onOpenCuratorStudio}
                  className="px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
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

  // Calculate cumulative stats for each vault
  const augmentedVaults = vaults.map((vault) => {
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

  // Sort based on criteria
  const sortedVaults = [...augmentedVaults].sort((a, b) => {
    if (sortBy === "ahead") return b.aheadEpochs - a.aheadEpochs;
    if (sortBy === "multiplier") return b.capacityMultiplier - a.capacityMultiplier;
    if (sortBy === "gap") return b.cumulativeGap - a.cumulativeGap;
    if (sortBy === "capacity") return b.capacity - a.capacity;
    return 0;
  });

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Title & Filter Pills */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
            Curator Leaderboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Curators ranked by outperformance against the passive pool benchmark (The Pace).
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
      <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600 uppercase text-xs bg-neutral-50">
                <th className="py-4 px-5 font-semibold">#</th>
                <th className="py-4 px-5 font-semibold">Curator Strategy</th>
                <th className="py-4 px-5 font-semibold">Record</th>
                <th className="py-4 px-5 font-semibold">Alpha</th>
                <th className="py-4 px-5 font-semibold">Multiplier</th>
                <th className="py-4 px-5 font-semibold">Fee</th>
                <th className="py-4 px-5 font-semibold">Status</th>
                <th className="py-4 px-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedVaults.map((vault, idx) => {
                const isAheadOverall = vault.cumulativeGap >= 0;

                return (
                  <tr key={vault.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-neutral-400">
                      <span className="w-7 h-7 rounded-full bg-neutral-100 inline-flex items-center justify-center text-neutral-800 font-sans text-xs font-bold">
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-950 text-sm font-sans">{vault.name}</span>
                        <span className="text-xs text-neutral-500 mt-0.5">
                          ${vault.mandate.minPrice} – ${vault.mandate.maxPrice}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span className="text-emerald-700">{vault.aheadEpochs} Ahead</span>
                        <span className="text-neutral-400">/</span>
                        <span className="text-neutral-500">{vault.behindEpochs} Behind</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`font-bold flex items-center gap-1 text-sm ${
                          isAheadOverall ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {isAheadOverall ? <TrendUpIcon className="w-4 h-4" /> : <TrendDownIcon className="w-4 h-4" />}
                        {isAheadOverall ? "+" : ""}${vault.cumulativeGap.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div>
                        <span className="font-bold text-neutral-900 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs">
                          {vault.capacityMultiplier}×
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-neutral-900 font-bold text-xs">{vault.perfFeeBps / 100}%</span>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`text-xs uppercase font-bold px-3 py-1 rounded-full border ${
                          vault.isParked
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {vault.isParked ? "Parked" : "Active"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onFollowCurator(vault.id)}
                          className="px-4 py-2 rounded-full bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
                        >
                          Follow
                        </button>
                        <button
                          onClick={() => onSelectCurator(vault.id)}
                          className="px-3 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs transition-all cursor-pointer font-medium"
                        >
                          Mandate
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
}
