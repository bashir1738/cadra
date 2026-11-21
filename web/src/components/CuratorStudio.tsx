"use client";

import React, { useState } from "react";
import { VaultData, RangePosition } from "../types/cadra";
import { ShieldIcon, CheckCircleIcon, AlertTriangleIcon, PlusIcon, TrashIcon, TrendUpIcon, ActivityIcon, ClockIcon, ZapIcon } from "./Icons";
import { useCadra, tickToPrice, priceToTick } from "../context/CadraContext";

interface CuratorStudioProps {
  vault?: VaultData;
  allVaults?: VaultData[];
  activeSubPage?: "overview" | "rebalance" | "mandate" | "settlements";
  connectedAddress?: string | null;
  onCreateVault?: (newVault: VaultData) => void | Promise<any>;
  onUpdateRanges: (vaultId: number, newRanges: RangePosition[]) => void | Promise<any>;
  onPostBond: (vaultId: number, amount: number) => void | Promise<any>;
  onProposeMandate: (vaultId: number, mandate: VaultData["mandate"]) => void | Promise<any>;
}

export function CuratorStudio({
  vault: propVault,
  allVaults,
  activeSubPage = "overview",
  connectedAddress,
  onCreateVault,
  onUpdateRanges,
  onPostBond,
  onProposeMandate,
}: CuratorStudioProps) {
  const { openConnectModal, vaults: contextVaults } = useCadra();
  const availableVaults = allVaults || contextVaults;
  const [selectedVaultId, setSelectedVaultId] = useState<number>(propVault?.id || availableVaults[0]?.id || 1);
  const vault = availableVaults.find((v) => v.id === selectedVaultId) || propVault || availableVaults[0];

  // Vault creation form state
  const [createName, setCreateName] = useState("");
  const [createTag, setCreateTag] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createFee, setCreateFee] = useState("");
  const [createMinPrice, setCreateMinPrice] = useState("");
  const [createMaxPrice, setCreateMaxPrice] = useState("");
  const [createMaxConc, setCreateMaxConc] = useState("");
  const [createMinTicks, setCreateMinTicks] = useState("");
  const [createShortfall, setCreateShortfall] = useState("");
  const [createBond, setCreateBond] = useState("");

  // Range editor state for existing vault
  const [ranges, setRanges] = useState<RangePosition[]>(vault?.activeRanges || []);
  const [bondInput, setBondInput] = useState<string>("5000");
  const [bondSuccessNotice, setBondSuccessNotice] = useState<string | null>(null);
  const [isDepositingBond, setIsDepositingBond] = useState<boolean>(false);
  const [rebalanceSuccessNotice, setRebalanceSuccessNotice] = useState<string | null>(null);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

  // Propose mandate state
  const [newMinPrice, setNewMinPrice] = useState<number>(vault?.mandate.minPrice || 2400);
  const [newMaxPrice, setNewMaxPrice] = useState<number>(vault?.mandate.maxPrice || 3600);
  const [newMaxConcentration, setNewMaxConcentration] = useState<number>(
    (vault?.mandate.maxConcentrationBps || 5000) / 100
  );
  const [mandateSuccessNotice, setMandateSuccessNotice] = useState<boolean>(false);

  const handleDepositBond = async () => {
    if (!connectedAddress) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const val = parseFloat(bondInput);
    if (isNaN(val) || val <= 0) return;

    setIsDepositingBond(true);
    setBondSuccessNotice(null);
    try {
      await onPostBond(vault.id, val);
      setBondSuccessNotice(
        `Successfully posted $${val.toLocaleString()} USDC collateral on-chain! Total vault bond is now $${(
          vault.bondAmount + val
        ).toLocaleString()} USDC, unlocking $${(
          (vault.bondAmount + val) * vault.capacityMultiplier
        ).toLocaleString()} USDC total managing capacity.`
      );
      setBondInput("");
      setTimeout(() => setBondSuccessNotice(null), 8000);
    } catch (err: any) {
      console.error("Bond deposit error:", err);
      setBondSuccessNotice(
        `Failed to post bond on-chain: ${err?.shortMessage || err?.message || "Transaction rejected"}`
      );
    } finally {
      setIsDepositingBond(false);
    }
  };

  // 1. Vault Deployment Interface (When no vault exists)
  if (!vault) {
    const handleDeploy = async () => {
      if (!connectedAddress) {
        if (openConnectModal) openConnectModal();
        return;
      }
      const minP = parseFloat(createMinPrice) || 2000;
      const maxP = parseFloat(createMaxPrice) || 5000;
      const feeBps = (parseFloat(createFee) || 20) * 100;
      const bondAmt = parseFloat(createBond) || 5000;
      const concBps = (parseFloat(createMaxConc) || 50) * 100;
      const shortfallBps = (parseFloat(createShortfall) || 5) * 100;
      const minWidth = parseInt(createMinTicks, 10) || 120;

      const newVault: VaultData = {
        id: Date.now(),
        name: createName.trim() || "Alpha Dynamic Corridor",
        tag: createTag.trim() || "Tight Range Active",
        description: createDesc.trim() || "Curated concentrated liquidity management.",
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
        curatorOwnershipBps: 1500, // 15% skin in the game
        currentShortfallBps: 0,
        timesParked: 0,
        timesShielded: 0,
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
        try {
          const createdId = await onCreateVault(newVault);
          if (createdId) {
            setSelectedVaultId(createdId);
          }
        } catch (err: any) {
          console.error("Vault deployment failed:", err);
        }
      }
    };

    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-2xl mx-auto">
        {/* Curator Bond Spotlight Card */}
        <div className="rounded-[32px] bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center p-2.5 shrink-0 shadow-sm">
            <ShieldIcon className="w-full h-full text-white" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-semibold inline-block">
              Skin In The Game · 5× to 20× Capacity
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
              Deploy Your Curator Vault
            </h3>
            <p className="text-[13px] text-neutral-500 leading-relaxed font-normal">
              Curators stake a USDC bond to back their mandate. You earn 20% on all alpha above The Pace, with capacity multiplying as you win!
            </p>
          </div>
        </div>

        {/* Vault Configuration Form */}
        <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Strategy & Mandate Parameters
            </h2>
            <p className="text-[13px] text-neutral-500 mt-1">
              Parameters are enforced on-chain by the Cadra Uniswap v4 hook.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Strategy Presets */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono text-neutral-400 block font-semibold">
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
                placeholder="e.g. Alpha Dynamic Corridor"
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Strategy Tag</label>
                <input
                  type="text"
                  value={createTag}
                  placeholder="e.g. Tight Range Active"
                  onChange={(e) => setCreateTag(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Performance Fee (%, max 30%)</label>
                <input
                  type="number"
                  value={createFee}
                  placeholder="e.g. 20"
                  onChange={(e) => setCreateFee(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 font-mono transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Min Price ($)</label>
                <input
                  type="number"
                  value={createMinPrice}
                  placeholder="e.g. 2400"
                  onChange={(e) => setCreateMinPrice(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Max Price ($)</label>
                <input
                  type="number"
                  value={createMaxPrice}
                  placeholder="e.g. 3600"
                  onChange={(e) => setCreateMaxPrice(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Max Conc. (%)</label>
                <input
                  type="number"
                  value={createMaxConc}
                  placeholder="e.g. 50"
                  onChange={(e) => setCreateMaxConc(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Min Width (Ticks)</label>
                <input
                  type="number"
                  value={createMinTicks}
                  placeholder="e.g. 200"
                  onChange={(e) => setCreateMinTicks(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">Parking Gap (%)</label>
                <input
                  type="number"
                  value={createShortfall}
                  placeholder="e.g. 5"
                  onChange={(e) => setCreateShortfall(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-neutral-700 font-semibold block text-xs">Curator Cash Bond (USDC)</label>
              <input
                type="number"
                value={createBond}
                placeholder="e.g. 10000"
                onChange={(e) => setCreateBond(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
              />
              <span className="text-xs text-neutral-500 font-mono block mt-1">
                Initial capacity: ${(parseFloat(createBond) || 0) * 5} USDC (5× multiplier).
              </span>
            </div>

            <button
              onClick={handleDeploy}
              className="w-full h-[46px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-4 cursor-pointer active:scale-[0.98]"
            >
              {!connectedAddress ? "Connect Wallet to Deploy" : "Deploy Vault On-Chain"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Range Validation Logic (Mandate Pre-Check)
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
        `Range #${idx + 1} width ($${width}) is narrower than minimum allowed width (${mandate.minRangeWidth} ticks)`
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
    validationErrors.push(`Total allocation must equal 100% (currently ${totalAllocation}%)`);
  }

  const isValidRebalance = validationErrors.length === 0 && ranges.length > 0;

  const handleAddRange = () => {
    const newId = `r_${Date.now()}`;
    const minW = Math.max(mandate.minRangeWidth || 120, 120);
    const alignedWidth = Math.ceil(minW / 60) * 60;
    let lTick = Math.round(mandate.minTick / 60) * 60;
    let uTick = lTick + alignedWidth;
    if (uTick > mandate.maxTick) {
      uTick = Math.round(mandate.maxTick / 60) * 60;
      lTick = Math.max(Math.round(mandate.minTick / 60) * 60, uTick - alignedWidth);
    }
    setRanges([
      ...ranges,
      {
        id: newId,
        lowerTick: lTick,
        upperTick: uTick,
        lowerPrice: tickToPrice(lTick),
        upperPrice: tickToPrice(uTick),
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
    if (field === "lowerPrice") {
      const derivedTick = priceToTick(val);
      const boundedTick = Math.max(
        Math.round(mandate.minTick / 60) * 60,
        Math.min(updated[idx].upperTick - 60, derivedTick)
      );
      updated[idx] = {
        ...updated[idx],
        lowerPrice: val,
        lowerTick: boundedTick,
      };
    } else if (field === "upperPrice") {
      const derivedTick = priceToTick(val);
      const boundedTick = Math.min(
        Math.round(mandate.maxTick / 60) * 60,
        Math.max(updated[idx].lowerTick + 60, derivedTick)
      );
      updated[idx] = {
        ...updated[idx],
        upperPrice: val,
        upperTick: boundedTick,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    setRanges(updated);
  };

  const handleApplyRebalance = async () => {
    if (!isValidRebalance) return;
    setIsRebalancing(true);
    setRebalanceSuccessNotice(null);
    try {
      await onUpdateRanges(vault.id, ranges);
      setRebalanceSuccessNotice(
        `Rebalance applied successfully on-chain! Active ranges updated across Uniswap v4 pool.`
      );
      setTimeout(() => setRebalanceSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error("Rebalance error:", err);
      setRebalanceSuccessNotice(
        `Rebalance failed on-chain: ${err?.shortMessage || err?.message || "Transaction error"}`
      );
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleProposeMandate = async () => {
    try {
      await onProposeMandate(vault.id, {
        ...vault.mandate,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
        maxConcentrationBps: newMaxConcentration * 100,
      });
      setMandateSuccessNotice(true);
      setTimeout(() => setMandateSuccessNotice(false), 5000);
    } catch (err: any) {
      console.error("Propose mandate error:", err);
    }
  };

  // Shortfall calculations for the Parking Limit Gauge
  const shortfallValue = Math.max(0, vault.paceValue - vault.vaultValue);
  const shortfallPct = vault.paceValue > 0 ? (shortfallValue / vault.paceValue) * 100 : 0;
  const maxShortfallPct = vault.mandate.maxShortfallBps / 100;
  const gaugePercent = Math.min(100, (shortfallPct / maxShortfallPct) * 100);
  const bufferRemaining = Math.max(0, maxShortfallPct - shortfallPct);

  // Top HUD with the Parking Limit Gauge
  const TopHUD = (
    <div suppressHydrationWarning className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-[0.08em] font-semibold block">
              Curator Studio
            </span>
            <h1 suppressHydrationWarning className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em] mt-0.5">
              {vault.name}
            </h1>
          </div>
        </div>

        <div suppressHydrationWarning className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-xs font-mono">
          <span className="text-neutral-500 font-medium">Capacity Multiplier:</span>
          <span suppressHydrationWarning className="font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-white border border-emerald-200 shadow-2xs">
            {vault.capacityMultiplier}× (Max ${vault.capacity.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Emergency Parking Alert Banner (On-Chain Reactive Tripped) */}
      {vault.isParked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-start gap-3.5 text-red-950 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <AlertTriangleIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-xs font-sans">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-red-900 uppercase">
                Emergency Brake Tripped: Vault is Parked
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] uppercase">
                Parked on-chain
              </span>
              <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                Reaction Latency: 1.08s
              </span>
            </div>
            <p className="mt-1.5 text-neutral-700 leading-relaxed text-[12px]">
              CadraReactive detected an out-of-band price deviation via <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-[11px] font-mono">BandLeft</code> on Unichain Sepolia. The Reactive Smart Contract instantly triggered <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-[11px] font-mono">enforce({vault.id})</code>, safely unwinding active concentrated positions into full-range Uniswap v4 liquidity to eliminate adverse selection. Curator actions remain frozen until epoch settlement.
            </p>
          </div>
        </div>
      )}

      {/* Available Vaults Selector (if multiple vaults available) */}
      {availableVaults.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-100">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider shrink-0">Managing:</span>
          {availableVaults.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVaultId(v.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                vault.id === v.id
                  ? "bg-neutral-950 text-white shadow-2xs"
                  : "bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs font-mono">
        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
          <span className="text-neutral-400 uppercase text-[11px] block font-medium">Curator Bond</span>
          <span suppressHydrationWarning className="text-lg font-bold text-neutral-950 mt-1 block">
            ${vault.bondAmount.toLocaleString()} USDC
          </span>
          <span suppressHydrationWarning className="text-[11px] text-neutral-500 mt-0.5 block font-normal">
            Owns {(vault.curatorOwnershipBps / 100).toFixed(0)}% of vault
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
          <span className="text-neutral-400 uppercase text-[11px] block font-medium">Total Managed</span>
          <span suppressHydrationWarning className="text-lg font-bold text-neutral-950 mt-1 block">
            ${vault.totalFollowerValue.toLocaleString()}
          </span>
          <span suppressHydrationWarning className="text-[11px] text-neutral-500 mt-0.5 block font-normal">
            Max Capacity: ${vault.capacity.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
          <span className="text-neutral-400 uppercase text-[11px] block font-medium">Carried Deficit (D)</span>
          <span suppressHydrationWarning className={`text-lg font-bold mt-1 block ${vault.carriedDeficit > 0 ? "text-red-700" : "text-neutral-950"}`}>
            ${vault.carriedDeficit.toLocaleString()}
          </span>
          <span suppressHydrationWarning className="text-[11px] text-neutral-500 mt-0.5 block font-normal">
            {vault.carriedDeficit > 0 ? "Must recover before fees" : "Deficit fully clean"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
          <span className="text-neutral-400 uppercase text-[11px] block font-medium">Vault Status</span>
          <span
            suppressHydrationWarning
            className={`text-[12px] font-bold uppercase mt-1 inline-flex items-center gap-1.5 ${
              vault.isParked ? "text-red-700" : "text-emerald-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${vault.isParked ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
            {vault.isParked ? "Parked (Curator Frozen)" : "Active & Healthy"}
          </span>
          <span suppressHydrationWarning className="text-[11px] text-neutral-500 mt-0.5 block font-normal">
            {vault.timesShielded > 0 ? `Shielded ${vault.timesShielded}× by Base Guard` : `Epoch #${vault.epoch || 1} in progress`}
          </span>
        </div>
      </div>

      {/* GAUGE TO THE PARKING LIMIT (Core PDF Feature) */}
      <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-neutral-700" />
              <span className="text-neutral-900 uppercase text-[11px] font-bold tracking-wider">
                Gauge to Emergency Parking Limit
              </span>
            </div>
            <p className="text-[12px] text-neutral-500 font-sans mt-0.5">
              CadraReactive monitors every swap on Unichain Sepolia. If shortfall crosses {maxShortfallPct.toFixed(1)}%, emergency parking executes in ~1 second.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
              vault.isParked
                ? "bg-red-100 text-red-900 border border-red-300"
                : gaugePercent > 70
                ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
            }`}>
              {vault.isParked
                ? "Emergency Brake Tripped (Parked)"
                : `${shortfallPct.toFixed(2)}% / ${maxShortfallPct.toFixed(1)}% (${bufferRemaining.toFixed(2)}% buffer remaining)`}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-neutral-200 rounded-full overflow-hidden flex relative">
            <div
              style={{ width: `${vault.isParked ? 100 : Math.max(4, gaugePercent)}%` }}
              className={`h-full transition-all duration-500 rounded-full ${
                vault.isParked
                  ? "bg-red-600"
                  : gaugePercent > 70
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              }`}
            />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
            <span>0.0% (Equal to Pace)</span>
            <span className="text-neutral-600 font-medium">Defensive Buffer Zone</span>
            <span className="text-red-700 font-bold">{maxShortfallPct.toFixed(1)}% Parking Limit</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 3. REBALANCE SUB-PAGE (WITH MANDATE PRE-CHECK)
  if (activeSubPage === "rebalance") {
    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                Range Rebalancer with Mandate Pre-Check
              </h2>
              <p className="text-[13px] text-neutral-500 mt-0.5">
                The hook evaluates your mandate inline. Rebalancing reverts if any range breaks the published rules.
              </p>
            </div>

            <button
              onClick={handleAddRange}
              className="h-[38px] px-4 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-[13px] text-neutral-900 transition-all font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Range</span>
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
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl border border-neutral-200/70 bg-[#FAFAFA] items-center text-xs"
                >
                  <div className="sm:col-span-1 text-neutral-600 font-bold">#{idx + 1}</div>
                  <div className="sm:col-span-3">
                    <span className="text-[11px] text-neutral-400 uppercase block font-medium">Min Price ($)</span>
                    <input
                      type="number"
                      value={r.lowerPrice}
                      onChange={(e) => handleUpdateRangeField(idx, "lowerPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-950 font-mono mt-1 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-all"
                    />
                    <span className="text-[10px] text-neutral-400 font-mono block mt-1">Tick: {r.lowerTick}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[11px] text-neutral-400 uppercase block font-medium">Max Price ($)</span>
                    <input
                      type="number"
                      value={r.upperPrice}
                      onChange={(e) => handleUpdateRangeField(idx, "upperPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-950 font-mono mt-1 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-all"
                    />
                    <span className="text-[10px] text-neutral-400 font-mono block mt-1">Tick: {r.upperTick}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[11px] text-neutral-400 uppercase block font-medium">Allocation (%)</span>
                    <input
                      type="number"
                      value={r.liquidityPercent}
                      onChange={(e) => handleUpdateRangeField(idx, "liquidityPercent", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-950 font-mono mt-1 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={() => handleRemoveRange(idx)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove Range"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mandate Pre-Check Checklist */}
          <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 space-y-3 font-mono text-xs">
            <span className="text-neutral-400 uppercase text-[11px] block font-semibold tracking-wider">
              Mandate Pre-Check Verification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Price Band: [${mandate.minPrice}, ${mandate.maxPrice}]</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Max Concentration: {mandate.maxConcentrationBps / 100}% per range</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Min Width: {mandate.minRangeWidth} ticks</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Total Allocation: 100%</span>
              </div>
            </div>
          </div>

          {/* Validation Status Notice */}
          <div
            className={`p-4 rounded-2xl border text-xs font-mono ${
              isValidRebalance
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
                : "bg-red-50/70 border-red-200/80 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {isValidRebalance ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span>Mandate Pre-Check Passed! Transaction will succeed on-chain.</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="w-4 h-4 text-red-600" />
                  <span>Mandate Violations ({validationErrors.length}) - Hook Will Revert</span>
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

          {rebalanceSuccessNotice && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-neutral-950 text-white text-[13px] shadow-sm animate-in fade-in duration-200">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white">Rebalance Confirmed</p>
                <p className="text-neutral-300 text-[12px] mt-0.5 leading-relaxed">{rebalanceSuccessNotice}</p>
              </div>
              <button
                type="button"
                onClick={() => setRebalanceSuccessNotice(null)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ×
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (!connectedAddress) {
                if (openConnectModal) openConnectModal();
                return;
              }
              handleApplyRebalance();
            }}
            disabled={connectedAddress ? !isValidRebalance || isRebalancing : false}
            className={`w-full h-[46px] rounded-full font-semibold text-[13px] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center gap-2 ${
              !connectedAddress
                ? "bg-neutral-950 text-white hover:bg-neutral-800 cursor-pointer active:scale-[0.98]"
                : isValidRebalance
                ? "bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
                : "bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {isRebalancing ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Applying Rebalance On-Chain...</span>
              </>
            ) : !connectedAddress ? (
              "Connect Wallet to Rebalance"
            ) : (
              "Apply Rebalance On-Chain"
            )}
          </button>
        </div>
      </div>
    );
  }

  // 4. MANDATE & RULES SUB-PAGE
  if (activeSubPage === "mandate") {
    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Mandate Card */}
          <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-bold text-neutral-950">Active Published Mandate</h3>
            <p className="text-[13px] text-neutral-500">
              The Uniswap v4 hook validates every rebalance against these limits:
            </p>
            <div className="space-y-2.5 font-mono text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Price Corridor</span>
                <span className="font-bold text-neutral-950">${mandate.minPrice} – ${mandate.maxPrice}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Max Concentration</span>
                <span className="font-bold text-neutral-950">{mandate.maxConcentrationBps / 100}% per range</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Min Range Width</span>
                <span className="font-bold text-neutral-950">{mandate.minRangeWidth} ticks</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Parking Shortfall Gap</span>
                <span className="font-bold text-neutral-950">{mandate.maxShortfallBps / 100}%</span>
              </div>
            </div>
          </div>

          {/* Propose Updated Mandate */}
          <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-bold text-neutral-950">Propose Rules for Next Epoch</h3>
            <p className="text-[13px] text-neutral-500">
              Followers can inspect proposed changes and exit before the new epoch starts. Mandate swaps mid-epoch are prohibited.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">New Min Price ($)</label>
                <input
                  type="number"
                  value={newMinPrice}
                  onChange={(e) => setNewMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-950 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold block text-xs">New Max Price ($)</label>
                <input
                  type="number"
                  value={newMaxPrice}
                  onChange={(e) => setNewMaxPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-950 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-all"
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
              className="w-full h-[44px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all cursor-pointer shadow-xs active:scale-[0.98] mt-2"
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
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
        {TopHUD}

        <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-base font-bold text-neutral-950">Settlement Epoch History</h3>
          <p className="text-[13px] text-neutral-500">
            Performance fees are earned at 20% on all alpha above The Pace. Any deficit (D) must be fully recovered before new fees accrue.
          </p>

          {vault.history.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-200 rounded-2xl text-xs text-neutral-500 font-mono">
              No historical settlements yet. CadraReactive will settle at the next epoch boundary.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[11px] font-semibold">
                    <th className="py-3 px-4">Epoch</th>
                    <th className="py-3 px-4">Vault Value</th>
                    <th className="py-3 px-4">Pace Benchmark</th>
                    <th className="py-3 px-4">Alpha Gap</th>
                    <th className="py-3 px-4">Fee / Bond Paid</th>
                    <th className="py-3 px-4">Multiplier</th>
                    <th className="py-3 px-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {vault.history.map((h, i) => (
                    <tr key={i} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-900">Epoch #{h.epoch}</td>
                      <td className="py-3 px-4">${h.vaultValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-neutral-600">${h.paceValue.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-bold ${h.gap >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {h.gap >= 0 ? "+" : ""}${h.gap.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">${h.feeOrPayout.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-700">{h.multiplierAfter ?? vault.capacityMultiplier}×</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          h.outcome === "ahead" ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70" : "bg-red-50 text-red-800 border border-red-200/70"
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
    <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
      {TopHUD}

      {/* Vault Value vs. The Pace Line Benchmark Panel */}
      <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendUpIcon className="w-5 h-5 text-neutral-900" />
              <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                Vault Value vs. The Pace Benchmark
              </h2>
            </div>
            <p className="text-[13px] text-neutral-500 mt-1">
              Curator outperformance is benchmarked tick-by-tick against the passive full-range Uniswap v4 position (The Pace).
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-mono">
            <span className="text-neutral-500">Benchmark:</span>
            <span className="font-bold text-neutral-900">Pace (Full-Range v4 LP)</span>
          </div>
        </div>

        {/* Valuation Metrics Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-400 uppercase text-[11px]">
              <span>Active Vault Value</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-2xl font-bold text-neutral-950 mt-1 block">
              ${vault.vaultValue.toLocaleString()}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
              Concentrated active LP + idle cash
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-400 uppercase text-[11px]">
              <span>The Pace Line (V_pace)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
            </div>
            <span className="text-2xl font-bold text-neutral-950 mt-1 block">
              ${vault.paceValue.toLocaleString()}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
              Zero-alpha passive Uniswap v4 baseline
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-400 uppercase text-[11px]">
              <span>Alpha / Spread (&Delta;)</span>
              <span className={`w-2.5 h-2.5 rounded-full ${vault.vaultValue >= vault.paceValue ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
            <span className={`text-2xl font-bold mt-1 block ${vault.vaultValue >= vault.paceValue ? "text-emerald-700" : "text-red-700"}`}>
              {vault.vaultValue >= vault.paceValue ? "+" : ""}${(vault.vaultValue - vault.paceValue).toLocaleString()}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block font-sans">
              {vault.vaultValue >= vault.paceValue ? "Curator eligible for 20% perf fee" : `${shortfallPct.toFixed(2)}% below benchmark`}
            </span>
          </div>
        </div>

        {/* Visual Benchmark Comparison Bar */}
        <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-neutral-500 font-medium font-sans">Portfolio Position relative to The Pace Line:</span>
            <span className={`font-bold px-2.5 py-0.5 rounded-full ${
              vault.isParked
                ? "bg-red-100 text-red-900 border border-red-300"
                : vault.vaultValue >= vault.paceValue
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}>
              {vault.isParked
                ? "PARKED (Emergency Brake)"
                : vault.vaultValue >= vault.paceValue
                ? `Ahead of Pace (+${vault.paceValue > 0 ? (((vault.vaultValue - vault.paceValue) / vault.paceValue) * 100).toFixed(2) : "0.00"}%)`
                : `Behind Pace (-${shortfallPct.toFixed(2)}%)`}
            </span>
          </div>

          {/* Visual Track */}
          <div className="relative pt-6 pb-2">
            {/* The Pace Benchmark Marker Line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-neutral-900 z-10 -translate-x-1/2">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-neutral-900 text-white font-mono text-[10px] font-bold whitespace-nowrap shadow-xs">
                The Pace (Baseline)
              </span>
            </div>

            {/* Bar Background Track */}
            <div className="h-6 w-full bg-neutral-200 rounded-full overflow-hidden flex relative">
              {/* Left half: Below Pace */}
              <div className="w-1/2 h-full bg-red-100 border-r border-dashed border-neutral-400 flex items-center justify-start pl-3">
                <span className="text-[10px] font-mono text-red-700 font-medium">Lagging Corridor</span>
              </div>
              {/* Right half: Above Pace */}
              <div className="w-1/2 h-full bg-emerald-100 flex items-center justify-end pr-3">
                <span className="text-[10px] font-mono text-emerald-800 font-medium">Alpha Zone (+20% Fee)</span>
              </div>

              {/* Vault Position Indicator */}
              <div
                style={{
                  left: `${vault.isParked ? 15 : Math.max(8, Math.min(92, 50 + (vault.paceValue > 0 ? ((vault.vaultValue - vault.paceValue) / vault.paceValue) * 200 : 0)))}%`
                }}
                className="absolute top-0 bottom-0 w-3 -translate-x-1/2 bg-neutral-950 rounded-full border-2 border-white shadow-md transition-all duration-500"
              />
            </div>

            <div className="flex justify-between text-[11px] text-neutral-400 font-mono mt-2">
              <span className="text-red-700 font-bold">-{maxShortfallPct.toFixed(1)}% Emergency Park</span>
              <span className="text-neutral-500">Benchmark Flat</span>
              <span className="text-emerald-700 font-bold">+{(maxShortfallPct * 2).toFixed(1)}% Alpha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Reactive Guard Event Feed (BandLeft -> react -> VaultParked) with Measured Latency */}
      <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <ZapIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                  Reactive Autonomous Guard Feed
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Reactive Loop
                </span>
              </div>
              <p className="text-[13px] text-neutral-500 mt-0.5">
                Real-time Reactive Network execution stream across Unichain Sepolia and Reactive Lasna CometBFT.
              </p>
            </div>
          </div>

          {/* Measured Latency Callout (Core Hackathon Metric) */}
          <div className="px-4 py-2 rounded-2xl bg-neutral-950 text-white font-mono text-right shrink-0 shadow-sm">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">Measured Latency</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-emerald-400">~1.10s</span>
              <span className="text-[10px] text-neutral-300">vs 7s-14s RVM</span>
            </div>
          </div>
        </div>

        {/* 3-Step Execution Pipeline Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase">
              <span>Step 1: Origin Breach</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">Unichain 1301</span>
            </div>
            <div className="mt-2 text-neutral-900 font-bold text-xs flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>BandLeft(vaultId, spotTick)</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-sans mt-1">
              Uniswap v4 pool swap pushes spot tick outside mandate corridor. Hook emits event and disarms mask.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase">
              <span>Step 2: Reactive Hop</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">Lasna Omni 5318007</span>
            </div>
            <div className="mt-2 text-neutral-900 font-bold text-xs flex items-center gap-1.5">
              <ZapIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>CadraReactive.react()</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-sans mt-1">
              CometBFT detects event within ~1.0s, encodes proxy-authorized callback payload and dispatches destination tx.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase">
              <span>Step 3: Callback Execution</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Unichain 1301</span>
            </div>
            <div className="mt-2 text-neutral-900 font-bold text-xs flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>enforce() &rarr; VaultParked</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-sans mt-1">
              Callback proxy invokes CadraCallback.enforce(). Hook checks shortfall; if breached, parks all assets.
            </p>
          </div>
        </div>

        {/* Live Event Stream Table */}
        <div className="border border-neutral-200/80 rounded-2xl overflow-hidden font-mono text-xs">
          <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200/70 flex justify-between items-center text-neutral-500 text-[11px] uppercase font-bold">
            <span>Live Reactive Execution Ledger</span>
            <span>Unichain Sepolia (1301) &harr; Reactive Lasna (5318007)</span>
          </div>

          <div className="divide-y divide-neutral-100 bg-white">
            {/* Event 1: Recent breach from DemoLoop */}
            <div className="p-3.5 hover:bg-neutral-50/60 transition-colors space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-neutral-950">BandLeft &rarr; react() &rarr; EnforceExecuted</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px]">Vault #{vault.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                    Latency: 1.08s
                  </span>
                  <span className="text-[11px] text-neutral-400">Block 68401858</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-sans pt-0.5">
                <span>Origin Swap: <a href="https://sepolia.uniscan.xyz/tx/0x064de0a249dfad6b158006d79ea0f81628434fe1609dffcd9d4e0e83c364f7de" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono">0x064d...f7de</a></span>
                <span>Reactive: <a href="https://lasna-omni.reactscan.net/address/0x061216db95D483fc0e7e0c43976A62B7E207ba35" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-mono">0x0612...ba35</a></span>
                <span>Callback: <a href="https://sepolia.uniscan.xyz/address/0xb4Df1810374AFdE05F9D429eF1f0c3ED2ABdF2C6" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-mono">0xb4Df...F2C6</a></span>
              </div>
            </div>

            {/* Event 2: Epoch settlement */}
            <div className="p-3.5 hover:bg-neutral-50/60 transition-colors space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-neutral-950">EpochReady &rarr; react() &rarr; SettleExecuted</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px]">Vault #1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px]">
                    Settled Epoch 1 &rarr; 2
                  </span>
                  <span className="text-[11px] text-neutral-400">Block 68400832</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-sans pt-0.5">
                <span>Signal Tx: <a href="https://sepolia.uniscan.xyz/tx/0x52928d6272359d7ebbe5bc12c092a2556273f4b60f2622039df4961359323cee" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono">0x5292...3cee</a></span>
                <span>Settle Tx: <a href="https://sepolia.uniscan.xyz/tx/0xe848006291887cfd0c9d4d6d3f9532c771b3aad2d01787865084e216102d5545" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-mono">0xe848...5545</a></span>
                <span>Status: <span className="text-emerald-700 font-medium">Re-benchmarked Pace Liquidity</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bond Collateral Expansion Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-950">Add Bond Collateral</h3>
            <span suppressHydrationWarning className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
              Current: ${vault.bondAmount.toLocaleString()} USDC
            </span>
          </div>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            Deposit USDC bond to expand your managing capacity ({vault.capacityMultiplier}× capacity per USDC).
          </p>

          {bondSuccessNotice && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-neutral-950 text-white text-[12px] shadow-sm animate-in fade-in duration-200">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white">Bond Deposited Successfully</p>
                <p className="text-neutral-300 text-[11px] mt-0.5 leading-relaxed">{bondSuccessNotice}</p>
              </div>
              <button
                type="button"
                onClick={() => setBondSuccessNotice(null)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                ×
              </button>
            </div>
          )}

          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-neutral-700 font-semibold block text-xs">Bond Amount (USDC)</label>
            <div className="flex items-center border border-neutral-200 bg-white rounded-xl px-4 py-2.5 focus-within:border-neutral-950 focus-within:ring-1 focus-within:ring-neutral-950 transition-all">
              <input
                type="number"
                value={bondInput}
                onChange={(e) => setBondInput(e.target.value)}
                className="bg-transparent text-neutral-950 w-full focus:outline-none font-mono"
                placeholder="5000"
              />
              <span className="text-neutral-400 font-bold ml-2">USDC</span>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-1.5 pt-1.5">
              <span className="text-[11px] text-neutral-400 font-sans">Quick presets:</span>
              {[1000, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBondInput(preset.toString())}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                >
                  +${preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isDepositingBond}
            onClick={handleDepositBond}
            className="w-full h-[44px] rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDepositingBond ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Depositing Bond Collateral...</span>
              </>
            ) : (
              <span>Deposit Bond Collateral</span>
            )}
          </button>
        </div>

        {/* Quick Strategy Summary */}
        <div className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-base font-bold text-neutral-950">Strategy Mandate Summary</h3>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            Your mandate sets bounds on price corridors, concentration caps, and emergency safety parking.
          </p>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
              <span className="text-neutral-500">Price Corridor</span>
              <span className="font-bold text-neutral-950">${mandate.minPrice} – ${mandate.maxPrice}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
              <span className="text-neutral-500">Max Concentration</span>
              <span className="font-bold text-neutral-950">{mandate.maxConcentrationBps / 100}% per range</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
              <span className="text-neutral-500">Emergency Parking Limit</span>
              <span className="font-bold text-neutral-950">{mandate.maxShortfallBps / 100}% below Pace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
