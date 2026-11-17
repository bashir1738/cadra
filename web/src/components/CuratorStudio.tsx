"use client";

import React, { useState } from "react";
import { VaultData, RangePosition } from "../types/cadra";
import { ShieldIcon, CheckCircleIcon, AlertTriangleIcon, PlusIcon, TrashIcon } from "./Icons";

interface CuratorStudioProps {
  vault?: VaultData;
  activeSubPage?: "overview" | "rebalance" | "mandate" | "settlements";
  connectedAddress?: string | null;
  onCreateVault?: (newVault: VaultData) => void;
  onUpdateRanges: (vaultId: number, newRanges: RangePosition[]) => void;
  onPostBond: (vaultId: number, amount: number) => void;
  onProposeMandate: (vaultId: number, mandate: VaultData["mandate"]) => void;
}

export function CuratorStudio({
  vault,
  activeSubPage = "overview",
  connectedAddress,
  onCreateVault,
  onUpdateRanges,
  onPostBond,
  onProposeMandate,
}: CuratorStudioProps) {
  // Vault creation form state
  const [createName, setCreateName] = useState("Alpha Dynamic Corridor");
  const [createTag, setCreateTag] = useState("Tight Range Active");
  const [createDesc, setCreateDesc] = useState("Dynamic rebalancing within tight ETH price corridor.");
  const [createFee, setCreateFee] = useState("20");
  const [createMinPrice, setCreateMinPrice] = useState("2400");
  const [createMaxPrice, setCreateMaxPrice] = useState("3600");
  const [createMaxConc, setCreateMaxConc] = useState("50");
  const [createMinTicks, setCreateMinTicks] = useState("200");
  const [createShortfall, setCreateShortfall] = useState("5");
  const [createBond, setCreateBond] = useState("10000");

  // Range editor state for existing vault
  const [ranges, setRanges] = useState<RangePosition[]>(vault?.activeRanges || []);
  const [bondInput, setBondInput] = useState<string>("5000");

  // Propose mandate state
  const [newMinPrice, setNewMinPrice] = useState<number>(vault?.mandate.minPrice || 2400);
  const [newMaxPrice, setNewMaxPrice] = useState<number>(vault?.mandate.maxPrice || 3600);
  const [newMaxConcentration, setNewMaxConcentration] = useState<number>(
    (vault?.mandate.maxConcentrationBps || 5000) / 100
  );
  const [mandateSuccessNotice, setMandateSuccessNotice] = useState<boolean>(false);

  // 1. Vault Deployment Interface (When no vault exists)
  if (!vault) {
    const handleDeploy = () => {
      const minP = parseFloat(createMinPrice) || 2000;
      const maxP = parseFloat(createMaxPrice) || 5000;
      const feeBps = (parseFloat(createFee) || 20) * 100;
      const bondAmt = parseFloat(createBond) || 5000;
      const concBps = (parseFloat(createMaxConc) || 50) * 100;
      const shortfallBps = (parseFloat(createShortfall) || 5) * 100;
      const minWidth = parseInt(createMinTicks, 10) || 200;

      const newVault: VaultData = {
        id: Date.now(),
        name: createName,
        tag: createTag,
        description: createDesc,
        curatorAddress: (connectedAddress as `0x${string}`) || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        perfFeeBps: feeBps,
        bondAmount: bondAmt,
        capacity: bondAmt * 5,
        capacityMultiplier: 5,
        totalFollowerValue: 0,
        followerShares: 0,
        paceValue: 0,
        vaultValue: 0,
        carriedDeficit: 0,
        epoch: 1,
        epochStart: Math.floor(Date.now() / 1000),
        epochDuration: 3600,
        isParked: false,
        bandLeft: false,
        mandate: {
          minTick: -69060,
          maxTick: -46080,
          minPrice: minP,
          maxPrice: maxP,
          maxConcentrationBps: concBps,
          minRangeWidth: minWidth,
          maxShortfallBps: shortfallBps,
        },
        activeRanges: [],
        history: [],
      };

      if (onCreateVault) {
        onCreateVault(newVault);
      }
    };

    return (
      <div className="space-y-6 font-sans max-w-2xl mx-auto">
        {/* Curator Bond Spotlight Card */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
            <ShieldIcon className="w-7 h-7" />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-neutral-800 text-emerald-400 font-semibold">
              Skin In The Game · 5× to 20× Capacity
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Deploy Your Curator Vault
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Curators stake a USDC bond to back their mandate. You earn 20% on all alpha above The Pace, with capacity multiplying as you win!
            </p>
          </div>
        </div>

        {/* Vault Configuration Form */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Strategy & Mandate Parameters
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Parameters are enforced on-chain by the Cadra Uniswap v4 hook.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Strategy Presets */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-mono text-neutral-500 block font-semibold">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Alpha Dynamic Corridor");
                    setCreateTag("Tight Range Active");
                    setCreateDesc("Dynamic concentrated rebalancing inside tight ETH corridor.");
                    setCreateFee("20");
                    setCreateMinPrice("2400");
                    setCreateMaxPrice("3600");
                    setCreateMaxConc("50");
                    setCreateMinTicks("200");
                    setCreateShortfall("5");
                    setCreateBond("10000");
                  }}
                  className="px-3.5 py-2 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Active Corridor (±1%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Defensive Wide Perimeter");
                    setCreateTag("Wide Range Defensive");
                    setCreateDesc("Wide safety perimeter for conservative long-term liquidity.");
                    setCreateFee("15");
                    setCreateMinPrice("2000");
                    setCreateMaxPrice("4500");
                    setCreateMaxConc("35");
                    setCreateMinTicks("600");
                    setCreateShortfall("8");
                    setCreateBond("15000");
                  }}
                  className="px-3.5 py-2 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Safe & Wide (±10%)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-700 font-semibold block text-xs">Vault Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Strategy Tag</label>
                <input
                  type="text"
                  value={createTag}
                  onChange={(e) => setCreateTag(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Performance Fee (%)</label>
                <input
                  type="number"
                  value={createFee}
                  onChange={(e) => setCreateFee(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Min Price ($)</label>
                <input
                  type="number"
                  value={createMinPrice}
                  onChange={(e) => setCreateMinPrice(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Max Price ($)</label>
                <input
                  type="number"
                  value={createMaxPrice}
                  onChange={(e) => setCreateMaxPrice(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Max Conc. (%)</label>
                <input
                  type="number"
                  value={createMaxConc}
                  onChange={(e) => setCreateMaxConc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Min Width (Ticks)</label>
                <input
                  type="number"
                  value={createMinTicks}
                  onChange={(e) => setCreateMinTicks(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Parking Gap (%)</label>
                <input
                  type="number"
                  value={createShortfall}
                  onChange={(e) => setCreateShortfall(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-neutral-700 font-semibold block text-xs">Curator Cash Bond (USDC)</label>
              <input
                type="number"
                value={createBond}
                onChange={(e) => setCreateBond(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
              />
              <span className="text-xs text-neutral-500 font-mono block mt-1">
                Initial capacity: ${(parseFloat(createBond) || 0) * 5} USDC (5× multiplier).
              </span>
            </div>

            <button
              onClick={handleDeploy}
              className="w-full py-3.5 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md mt-4 cursor-pointer"
            >
              Deploy Vault On-Chain
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Range Validation Logic
  const mandate = vault.mandate;
  const validationErrors: string[] = [];

  ranges.forEach((r, idx) => {
    if (r.lowerPrice < mandate.minPrice || r.upperPrice > mandate.maxPrice) {
      validationErrors.push(
        `Range #${idx + 1} ($${r.lowerPrice} - $${r.upperPrice}) breaches mandate price band ($${mandate.minPrice} - $${mandate.maxPrice})`
      );
    }
  });

  ranges.forEach((r, idx) => {
    const width = r.upperPrice - r.lowerPrice;
    if (width < 50) {
      validationErrors.push(
        `Range #${idx + 1} width ($${width}) is narrower than minimum allowed width`
      );
    }
  });

  ranges.forEach((r, idx) => {
    if (r.liquidityPercent > mandate.maxConcentrationBps / 100) {
      validationErrors.push(
        `Range #${idx + 1} concentration (${r.liquidityPercent}%) exceeds ${mandate.maxConcentrationBps / 100}% cap`
      );
    }
  });

  const totalAllocation = ranges.reduce((acc, r) => acc + r.liquidityPercent, 0);
  if (totalAllocation !== 100 && ranges.length > 0) {
    validationErrors.push(`Total liquidity allocation must equal 100% (currently ${totalAllocation}%)`);
  }

  const isValidRebalance = validationErrors.length === 0 && ranges.length > 0;

  const handleAddRange = () => {
    const newId = `r_${Date.now()}`;
    setRanges([
      ...ranges,
      {
        id: newId,
        lowerTick: -60000,
        upperTick: -58000,
        lowerPrice: mandate.minPrice + 100,
        upperPrice: mandate.minPrice + 500,
        liquidityPercent: ranges.length === 0 ? 100 : 20,
      },
    ]);
  };

  const handleRemoveRange = (idx: number) => {
    setRanges(ranges.filter((_, i) => i !== idx));
  };

  const handleUpdateRangeField = (
    idx: number,
    field: "lowerPrice" | "upperPrice" | "liquidityPercent",
    val: number
  ) => {
    const updated = [...ranges];
    updated[idx] = { ...updated[idx], [field]: val };
    setRanges(updated);
  };

  const handleApplyRebalance = () => {
    if (!isValidRebalance) return;
    onUpdateRanges(vault.id, ranges);
  };

  const handleProposeMandate = () => {
    onProposeMandate(vault.id, {
      ...vault.mandate,
      minPrice: newMinPrice,
      maxPrice: newMaxPrice,
      maxConcentrationBps: newMaxConcentration * 100,
    });
    setMandateSuccessNotice(true);
    setTimeout(() => setMandateSuccessNotice(false), 4000);
  };

  // Reusable Top HUD Component
  const TopHUD = (
    <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 shrink-0 hidden sm:flex shadow-sm">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-mono uppercase tracking-widest font-semibold block">
              CURATOR CONTROL ROOM
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              {vault.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 font-mono text-xs">
          <span className="text-neutral-400">Capacity Multiplier:</span>
          <span className="font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
            {vault.capacityMultiplier}×
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700">
          <span className="text-neutral-400 uppercase text-xs block">Curator Bond</span>
          <span className="text-base font-bold text-white mt-1 block">
            ${vault.bondAmount.toLocaleString()} USDC
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700">
          <span className="text-neutral-400 uppercase text-xs block">Max Capacity</span>
          <span className="text-base font-bold text-white mt-1 block">
            ${vault.capacity.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700">
          <span className="text-neutral-400 uppercase text-xs block">Deposited</span>
          <span className="text-base font-bold text-neutral-200 mt-1 block">
            ${vault.totalFollowerValue.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700">
          <span className="text-neutral-400 uppercase text-xs block">Status</span>
          <span
            className={`text-xs font-bold uppercase mt-1 inline-flex items-center gap-1.5 ${
              vault.isParked ? "text-red-400" : "text-emerald-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${vault.isParked ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
            {vault.isParked ? "Parked (Frozen)" : "Active & Healthy"}
          </span>
        </div>
      </div>
    </div>
  );

  // 3. REBALANCE SUB-PAGE
  if (activeSubPage === "rebalance") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                Range Rebalancer
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active ticks must remain within mandate bounds (${mandate.minPrice}–${mandate.maxPrice}).
              </p>
            </div>

            <button
              onClick={handleAddRange}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-900 transition-all font-medium cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Range
            </button>
          </div>

          {/* Range Rows */}
          {ranges.length === 0 ? (
            <div className="p-10 rounded-2xl text-center border border-dashed border-neutral-200 text-neutral-500 text-xs">
              No active ranges configured. Click &quot;Add Range&quot; to define your first concentrated position.
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {ranges.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50 items-center text-xs"
                >
                  <div className="sm:col-span-1 text-neutral-600 font-bold">#{idx + 1}</div>
                  <div className="sm:col-span-3">
                    <span className="text-xs text-neutral-500 uppercase block">Min Price ($)</span>
                    <input
                      type="number"
                      value={r.lowerPrice}
                      onChange={(e) => handleUpdateRangeField(idx, "lowerPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-xs text-neutral-500 uppercase block">Max Price ($)</span>
                    <input
                      type="number"
                      value={r.upperPrice}
                      onChange={(e) => handleUpdateRangeField(idx, "upperPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-xs text-neutral-500 uppercase block">Allocation (%)</span>
                    <input
                      type="number"
                      value={r.liquidityPercent}
                      onChange={(e) => handleUpdateRangeField(idx, "liquidityPercent", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={() => handleRemoveRange(idx)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove Range"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Validation Box */}
          <div
            className={`p-4 rounded-2xl border text-xs font-mono ${
              isValidRebalance
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {isValidRebalance ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span>All checks passed! Your rebalance complies with the mandate.</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                  <span>Mandate Violations ({validationErrors.length})</span>
                </>
              )}
            </div>
            {validationErrors.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-neutral-700 text-xs mt-2">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={handleApplyRebalance}
            disabled={!isValidRebalance}
            className={`w-full py-3.5 rounded-full font-semibold text-xs uppercase tracking-wider transition-all shadow-xs ${
              isValidRebalance
                ? "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 cursor-pointer"
                : "bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            Apply Rebalance On-Chain
          </button>
        </div>
      </div>
    );
  }

  // 4. MANDATE & RULES SUB-PAGE
  if (activeSubPage === "mandate") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Mandate Card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-neutral-950">Active Published Mandate</h3>
            <p className="text-xs text-neutral-500">
              The Uniswap v4 hook validates every rebalance against these limits:
            </p>
            <div className="space-y-2.5 font-mono text-xs pt-1">
              <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
                <span className="text-neutral-500">Price Corridor</span>
                <span className="font-bold text-neutral-900">${mandate.minPrice} – ${mandate.maxPrice}</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
                <span className="text-neutral-500">Max Concentration</span>
                <span className="font-bold text-neutral-900">{mandate.maxConcentrationBps / 100}% per range</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
                <span className="text-neutral-500">Min Range Width</span>
                <span className="font-bold text-neutral-900">{mandate.minRangeWidth} ticks</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
                <span className="text-neutral-500">Parking Shortfall Gap</span>
                <span className="font-bold text-neutral-900">{mandate.maxShortfallBps / 100}%</span>
              </div>
            </div>
          </div>

          {/* Propose Updated Mandate */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-neutral-950">Propose Rules for Next Epoch</h3>
            <p className="text-xs text-neutral-500">
              Followers can inspect proposed changes and exit before the new epoch starts.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block">New Min Price ($)</label>
                <input
                  type="number"
                  value={newMinPrice}
                  onChange={(e) => setNewMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block">New Max Price ($)</label>
                <input
                  type="number"
                  value={newMaxPrice}
                  onChange={(e) => setNewMaxPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                />
              </div>
            </div>

            {mandateSuccessNotice && (
              <p className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Mandate proposed! Takes effect at next epoch settlement.</span>
              </p>
            )}

            <button
              onClick={handleProposeMandate}
              className="w-full py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer shadow-xs mt-2"
            >
              Publish Proposed Rules
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. SETTLEMENTS & FEES SUB-PAGE
  if (activeSubPage === "settlements") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-neutral-950">Settlement Epoch History</h3>
          <p className="text-xs text-neutral-500">
            Performance fees are earned at 20% on all alpha above The Pace. Any deficit must be fully recovered before new fees accrue.
          </p>

          {vault.history.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-200 rounded-2xl text-xs text-neutral-500 font-mono">
              No historical settlements yet. The keeper will settle at the next epoch boundary.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-xs">
                    <th className="py-3 px-4 font-semibold">Epoch</th>
                    <th className="py-3 px-4 font-semibold">Vault Value</th>
                    <th className="py-3 px-4 font-semibold">Pace Benchmark</th>
                    <th className="py-3 px-4 font-semibold">Alpha Gap</th>
                    <th className="py-3 px-4 font-semibold">Fee / Bond Paid</th>
                    <th className="py-3 px-4 font-semibold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {vault.history.map((h, i) => (
                    <tr key={i} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-4 font-bold text-neutral-800">Epoch #{h.epoch}</td>
                      <td className="py-3 px-4">${h.vaultValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-neutral-600">${h.paceValue.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-bold ${h.gap >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {h.gap >= 0 ? "+" : ""}${h.gap.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">${h.feeOrPayout.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          h.outcome === "ahead" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                        }`}>
                          {h.outcome === "ahead" ? "Ahead" : "Behind"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 6. DEFAULT OVERVIEW SUB-PAGE
  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {TopHUD}

      {/* Bond Collateral Expansion Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-neutral-950">Add Bond Collateral</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Deposit USDC bond to expand your managing capacity ({vault.capacityMultiplier}× capacity per USDC).
          </p>

          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-neutral-700 font-semibold block">Bond Amount (USDC)</label>
            <div className="flex items-center border border-neutral-300 bg-neutral-50 rounded-2xl px-4 py-2.5">
              <input
                type="number"
                value={bondInput}
                onChange={(e) => setBondInput(e.target.value)}
                className="bg-transparent text-neutral-900 w-full focus:outline-none font-mono"
                placeholder="5000"
              />
              <span className="text-neutral-500 font-bold">USDC</span>
            </div>
          </div>

          <button
            onClick={() => {
              const val = parseFloat(bondInput);
              if (val > 0) onPostBond(vault.id, val);
            }}
            className="w-full py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
          >
            Deposit Bond Collateral
          </button>
        </div>

        {/* Quick Strategy Summary */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-neutral-950">Strategy Mandate Summary</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your mandate sets bounds on price ranges, concentration caps, and emergency safety parking.
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
              <span className="text-neutral-500">Corridor</span>
              <span className="font-bold text-neutral-900">${mandate.minPrice} – ${mandate.maxPrice}</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
              <span className="text-neutral-500">Max Concentration</span>
              <span className="font-bold text-neutral-900">{mandate.maxConcentrationBps / 100}% per range</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 flex justify-between">
              <span className="text-neutral-500">Capacity</span>
              <span className="font-bold text-neutral-900">${vault.capacity.toLocaleString()} max</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
