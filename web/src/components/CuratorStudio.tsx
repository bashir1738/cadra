"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { VaultData, RangePosition } from "../types/cadra";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
  TrendUpIcon,
  ActivityIcon,
  ClockIcon,
  ZapIcon,
  ArrowRightIcon,
} from "./Icons";
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
  const { openConnectModal, vaults: contextVaults, isLoadingOnChain } = useCadra();
  const availableVaults = allVaults || contextVaults;
  const [selectedVaultId, setSelectedVaultId] = useState<number>(propVault?.id || availableVaults[0]?.id || 1);
  const vault = availableVaults.find((v) => v.id === selectedVaultId) || propVault || availableVaults[0];

  // Vault creation form state
  const [isCreatingNewVault, setIsCreatingNewVault] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [createName, setCreateName] = useState("");
  const [createTag, setCreateTag] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createFee, setCreateFee] = useState("");
  const [createMinPrice, setCreateMinPrice] = useState("");
  const [createMaxPrice, setCreateMaxPrice] = useState("");
  const [createMaxConc, setCreateMaxConc] = useState("");
  const [createMinTicks, setCreateMinTicks] = useState("");
  const [createShortfall, setCreateShortfall] = useState("");
  const [createBond, setCreateBond] = useState("10");

  // Range editor state for existing vault
  const [ranges, setRanges] = useState<RangePosition[]>(vault?.activeRanges || []);
  const [bondInput, setBondInput] = useState<string>("10");
  const [bondSuccessNotice, setBondSuccessNotice] = useState<string | null>(null);
  const [isDepositingBond, setIsDepositingBond] = useState<boolean>(false);
  const [rebalanceSuccessNotice, setRebalanceSuccessNotice] = useState<string | null>(null);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

  // Propose mandate state
  const [newMinPrice, setNewMinPrice] = useState<number>(vault?.mandate.minPrice || 2470);
  const [newMaxPrice, setNewMaxPrice] = useState<number>(vault?.mandate.maxPrice || 2530);
  const [newMaxConcentration, setNewMaxConcentration] = useState<number>(
    (vault?.mandate.maxConcentrationBps || 5000) / 100
  );
  const [mandateSuccessNotice, setMandateSuccessNotice] = useState<boolean>(false);

  // Synchronize propose inputs, ranges, and bond input when switching vaults
  useEffect(() => {
    if (vault) {
      setNewMinPrice(vault.mandate.minPrice);
      setNewMaxPrice(vault.mandate.maxPrice);
      setNewMaxConcentration((vault.mandate.maxConcentrationBps || 5000) / 100);
      setRanges(vault.activeRanges || []);
      setBondInput("10");
    }
  }, [
    vault?.id,
    vault?.mandate?.minPrice,
    vault?.mandate?.maxPrice,
    vault?.mandate?.maxConcentrationBps,
    vault?.activeRanges,
  ]);

  const handleDepositBond = async () => {
    if (!connectedAddress) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const val = parseFloat(bondInput);
    if (isNaN(val) || val <= 0) return;

    setIsDepositingBond(true);
    setBondSuccessNotice(null);
    const toastId = toast.loading(`Posting $${val.toLocaleString()} USDC bond collateral on Unichain Sepolia...`);
    try {
      await onPostBond(vault.id, val);
      toast.success(`Successfully posted $${val.toLocaleString()} USDC bond collateral!`, { id: toastId });
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
      const errMsg = err?.shortMessage || err?.message || "Transaction rejected";
      toast.error(`Failed to post bond: ${errMsg}`, { id: toastId });
      setBondSuccessNotice(
        `Failed to post bond on-chain: ${errMsg}`
      );
    } finally {
      setIsDepositingBond(false);
    }
  };

  // 1. Vault Deployment Interface (When no vault exists or user clicks "+ Create Vault")
  if (!vault || isCreatingNewVault) {
    const handleDeploy = async () => {
      if (!connectedAddress) {
        if (openConnectModal) openConnectModal();
        return;
      }
      if (isDeploying) return;

      const minP = parseFloat(createMinPrice) || 2470;
      const maxP = parseFloat(createMaxPrice) || 2530;
      if (minP >= maxP) {
        toast.error("Min price must be less than max price.");
        return;
      }

      const feeBps = (parseFloat(createFee) || 20) * 100;
      const bondAmt = parseFloat(createBond) || 10;
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
          minTick: priceToTick(minP),
          maxTick: priceToTick(maxP),
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
        setIsDeploying(true);
        const toastId = toast.loading("Deploying vault on Unichain Sepolia... Please confirm in your wallet.");
        try {
          const createdId = await onCreateVault(newVault);
          if (createdId) {
            setSelectedVaultId(createdId);
          }
          setIsCreatingNewVault(false);
          toast.success(`Vault #${createdId || ""} deployed successfully on-chain!`, { id: toastId });
        } catch (err: any) {
          const isRejected =
            err?.message?.includes("denied") ||
            err?.message?.includes("rejected") ||
            err?.shortMessage?.includes("rejected") ||
            err?.shortMessage?.includes("denied");
          const errMsg = isRejected
            ? "Transaction cancelled in wallet."
            : err?.shortMessage || err?.message || "Transaction was rejected or failed.";
          toast.error(errMsg, { id: toastId });
        } finally {
          setIsDeploying(false);
        }
      }
    };

    return (
      <div suppressHydrationWarning className="space-y-6 font-sans max-w-2xl mx-auto">
        {vault && (
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setIsCreatingNewVault(false)}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>← Back to {vault.name}</span>
            </button>
          </div>
        )}
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
            {/* Quick Strategy Presets with Dynamic Quant Names */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono text-neutral-400 block font-semibold">
                Strategy Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Apex Volatility Scalper");
                    setCreateTag("Sub-1% Active Scalp");
                    setCreateDesc("Ultra-concentrated sub-percent corridor targeting maximum fee velocity around current spot.");
                    setCreateFee("25");
                    setCreateMinPrice("2480");
                    setCreateMaxPrice("2520");
                    setCreateMaxConc("85");
                    setCreateMinTicks("60");
                    setCreateShortfall("2");
                    setCreateBond("10");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Apex Scalper (10 USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Titan Corridor Momentum");
                    setCreateTag("Adaptive Corridor");
                    setCreateDesc("Dynamic directional breakout corridor capturing trend expansions while hedging perimeter.");
                    setCreateFee("20");
                    setCreateMinPrice("2450");
                    setCreateMaxPrice("2550");
                    setCreateMaxConc("65");
                    setCreateMinTicks("120");
                    setCreateShortfall("4");
                    setCreateBond("10");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Titan Momentum (10 USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Valkyrie Equilibrium Float");
                    setCreateTag("Mean Reversion Matrix");
                    setCreateDesc("Balanced liquidity matrix capturing oscillator reversion around TWAP median.");
                    setCreateFee("18");
                    setCreateMinPrice("2420");
                    setCreateMaxPrice("2580");
                    setCreateMaxConc("50");
                    setCreateMinTicks("180");
                    setCreateShortfall("5");
                    setCreateBond("15");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Valkyrie Float (15 USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Sentinel Defensive Buffer");
                    setCreateTag("Macro Perimeter Shield");
                    setCreateDesc("Institutional-grade defensive perimeter designed for capital preservation and broad volume.");
                    setCreateFee("15");
                    setCreateMinPrice("2350");
                    setCreateMaxPrice("2650");
                    setCreateMaxConc("35");
                    setCreateMinTicks("300");
                    setCreateShortfall("6");
                    setCreateBond("20");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Sentinel Shield (20 USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Quantum Flash Arb");
                    setCreateTag("Micro Frequency Churn");
                    setCreateDesc("Low-capital tactical corridor built for high-frequency Uniswap v4 tick churn.");
                    setCreateFee("20");
                    setCreateMinPrice("2475");
                    setCreateMaxPrice("2525");
                    setCreateMaxConc("75");
                    setCreateMinTicks("60");
                    setCreateShortfall("3");
                    setCreateBond("5");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Quantum Arb (5 USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateName("Boreas Deep Accumulator");
                    setCreateTag("Asymmetric Dip Shield");
                    setCreateDesc("Asymmetric downside boundary weighted to harvest heavy swap fees on volatile selloffs.");
                    setCreateFee("16");
                    setCreateMinPrice("2300");
                    setCreateMaxPrice("2550");
                    setCreateMaxConc("45");
                    setCreateMinTicks("240");
                    setCreateShortfall("5");
                    setCreateBond("10");
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all cursor-pointer font-medium"
                >
                  Boreas Dip (10 USDC)
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
                <div className="flex items-center justify-between">
                  <label className="text-neutral-700 font-semibold block text-xs">Performance Fee (%, max 30%)</label>
                  <span className="text-[11px] text-emerald-700 font-medium">Cadra Platform: 1.0%</span>
                </div>
                <input
                  type="number"
                  value={createFee}
                  placeholder="e.g. 20"
                  onChange={(e) => setCreateFee(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 font-mono transition-all placeholder:text-neutral-400"
                />
                <p className="text-[11px] text-neutral-500">
                  Curator net: {Math.max(0, (parseFloat(createFee) || 20) - 1).toFixed(1)}% · Platform: 1.0% (charged on alpha over benchmark only)
                </p>
              </div>
            </div>

            {/* Price Corridor & Quick Ranges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-[11px] uppercase font-mono text-neutral-400 font-semibold">
                  Price Corridor ($/ETH):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-sans">Corridor Presets:</span>
                  {[
                    { label: "Ultra-Tight", min: "2480", max: "2520" },
                    { label: "Scalp Band", min: "2460", max: "2540" },
                    { label: "Core Corridor", min: "2450", max: "2550" },
                    { label: "Balanced", min: "2400", max: "2600" },
                    { label: "Wide Buffer", min: "2350", max: "2650" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setCreateMinPrice(preset.min);
                        setCreateMaxPrice(preset.max);
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono transition-colors cursor-pointer active:scale-95"
                    >
                      {preset.label} (${preset.min}-${preset.max})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-700 font-semibold block text-xs">Min Price ($)</label>
                  <input
                    type="number"
                    value={createMinPrice}
                    placeholder="e.g. 2470"
                    onChange={(e) => setCreateMinPrice(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-700 font-semibold block text-xs">Max Price ($)</label>
                  <input
                    type="number"
                    value={createMaxPrice}
                    placeholder="e.g. 2530"
                    onChange={(e) => setCreateMaxPrice(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
                  />
                </div>
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
                placeholder="e.g. 10"
                onChange={(e) => setCreateBond(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-950 font-mono focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all placeholder:text-neutral-400"
              />
              <span className="text-xs text-neutral-500 font-mono block mt-1">
                Initial capacity: ${(parseFloat(createBond) || 0) * 5} USDC (5× multiplier).
              </span>
            </div>

            <button
              onClick={handleDeploy}
              disabled={isDeploying || isLoadingOnChain}
              className={`w-full h-[46px] rounded-full font-semibold text-[13px] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-4 flex items-center justify-center gap-2 ${
                isDeploying || isLoadingOnChain
                  ? "bg-neutral-800 text-neutral-300 cursor-not-allowed opacity-80"
                  : "bg-neutral-950 text-white hover:bg-neutral-800 cursor-pointer active:scale-[0.98]"
              }`}
            >
              {isDeploying || isLoadingOnChain ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0" />
                  <span>Deploying Vault On-Chain (Confirm in Wallet)...</span>
                </>
              ) : !connectedAddress ? (
                "Connect Wallet to Deploy"
              ) : (
                "Deploy Vault On-Chain"
              )}
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
    const toastId = toast.loading("Executing rebalance transaction on Unichain Sepolia...");
    try {
      await onUpdateRanges(vault.id, ranges);
      toast.success("Active ranges updated on Uniswap v4 pool!", { id: toastId });
      setRebalanceSuccessNotice(
        `Rebalance applied successfully on-chain! Active ranges updated across Uniswap v4 pool.`
      );
      setTimeout(() => setRebalanceSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error("Rebalance error:", err);
      const errMsg = err?.shortMessage || err?.message || "Transaction error";
      toast.error(`Rebalance failed: ${errMsg}`, { id: toastId });
      setRebalanceSuccessNotice(
        `Rebalance failed on-chain: ${errMsg}`
      );
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleProposeMandate = async () => {
    if (!connectedAddress) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const toastId = toast.loading("Submitting proposed mandate for next epoch...");
    try {
      await onProposeMandate(vault.id, {
        ...vault.mandate,
        minTick: priceToTick(newMinPrice),
        maxTick: priceToTick(newMaxPrice),
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
        maxConcentrationBps: newMaxConcentration * 100,
      });
      toast.success("Mandate proposed for next epoch! Followers can review before epoch rollover.", { id: toastId });
      setMandateSuccessNotice(true);
      setTimeout(() => setMandateSuccessNotice(false), 5000);
    } catch (err: any) {
      console.error("Mandate error:", err);
      const errMsg = err?.shortMessage || err?.message || "Failed to propose mandate";
      toast.error(`Mandate proposal failed: ${errMsg}`, { id: toastId });
    }
  };

  // Shortfall calculations for the Parking Limit Gauge
  const shortfallValue = Math.max(0, vault.paceValue - vault.vaultValue);
  const shortfallPct = vault.paceValue > 0 ? (shortfallValue / vault.paceValue) * 100 : 0;
  const maxShortfallPct = vault.mandate.maxShortfallBps / 100;
  const gaugePercent = Math.min(100, (shortfallPct / maxShortfallPct) * 100);
  const bufferRemaining = Math.max(0, maxShortfallPct - shortfallPct);

  // Top Header Card
  const TopHUD = (
    <div suppressHydrationWarning className="bg-white border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 uppercase tracking-[0.08em] font-semibold">
                Curator Studio
              </span>
              <span
                suppressHydrationWarning
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                  vault.isParked
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${vault.isParked ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                {vault.isParked ? "Parked (Safe)" : "Active"}
              </span>
            </div>
            <h1 suppressHydrationWarning className="text-2xl sm:text-[28px] font-bold text-neutral-950 tracking-[-0.03em] mt-0.5">
              {vault.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div suppressHydrationWarning className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-xs font-mono">
            <span className="text-neutral-500 font-medium">Capacity:</span>
            <span suppressHydrationWarning className="font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-white border border-emerald-200 shadow-2xs">
              {vault.capacityMultiplier}× (Max ${vault.capacity.toLocaleString()})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingNewVault(true)}
            className="h-8.5 px-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Deploy a new vault on-chain with your own mandate"
          >
            <span>+ Create Vault</span>
          </button>
        </div>
      </div>

      {/* Emergency Parking Alert Banner */}
      {vault.isParked && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900 text-xs animate-in fade-in duration-200">
          <AlertTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Emergency Protection Triggered</span>
            <p className="text-neutral-600 mt-0.5 leading-relaxed">
              Price exited your published corridor. Active positions have been safely parked into full-range benchmark liquidity to protect follower capital until epoch settlement.
            </p>
          </div>
        </div>
      )}

      {/* Zero Curator Bond Alert Banner */}
      {vault.bondAmount === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Curator Cash Bond Required ($0 Capacity)</span>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                This vault currently has $0 USDC bond collateral. In Cadra, curators must stake a cash bond to back follower capital. Post bond below to unlock follower capacity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("post-bond-card");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            Post Bond Collateral
          </button>
        </div>
      )}

      {/* Available Vaults Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none border-t border-neutral-100">
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
        <button
          type="button"
          onClick={() => setIsCreatingNewVault(true)}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-950 hover:border-neutral-950 transition-all shrink-0 cursor-pointer"
        >
          + New Vault
        </button>
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

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "Tight ($2480-$2520)", min: 2480, max: 2520 },
                { label: "Scalp ($2460-$2540)", min: 2460, max: 2540 },
                { label: "Core ($2450-$2550)", min: 2450, max: 2550 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const lTick = Math.max(Math.round(mandate.minTick / 60) * 60, priceToTick(p.min));
                    const uTick = Math.min(Math.round(mandate.maxTick / 60) * 60, priceToTick(p.max));
                    setRanges([
                      {
                        id: `r-${Date.now()}`,
                        lowerTick: lTick,
                        upperTick: uTick,
                        lowerPrice: tickToPrice(lTick),
                        upperPrice: tickToPrice(uTick),
                        liquidityPercent: 100,
                      },
                    ]);
                  }}
                  className="h-[32px] px-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={handleAddRange}
                className="h-[38px] px-4 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-[13px] text-neutral-900 transition-all font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add Range</span>
              </button>
            </div>
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

            {/* Quick Presets for Proposed Rules */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-neutral-400 font-sans">Corridor Presets:</span>
              {[
                { label: "Ultra-Tight", min: 2480, max: 2520 },
                { label: "Scalp Band", min: 2460, max: 2540 },
                { label: "Core Buffer", min: 2450, max: 2550 },
                { label: "Balanced", min: 2400, max: 2600 },
                { label: "Wide Buffer", min: 2350, max: 2650 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setNewMinPrice(p.min);
                    setNewMaxPrice(p.max);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                >
                  {p.label} (${p.min}-${p.max})
                </button>
              ))}
            </div>

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
              {!connectedAddress ? "Connect Wallet to Propose Rules" : "Publish Proposed Rules"}
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
  const isAhead = vault.vaultValue >= vault.paceValue;
  const netAlpha = vault.vaultValue - vault.paceValue;

  return (
    <div suppressHydrationWarning className="space-y-6 font-sans max-w-5xl mx-auto">
      {TopHUD}

      {/* 1. Primary High-Level Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-neutral-200/80 rounded-[24px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-neutral-400 text-xs uppercase tracking-wider font-medium block">
            Vault Value
          </span>
          <span suppressHydrationWarning className="text-2xl font-bold text-neutral-950 font-mono tracking-tight block">
            ${vault.vaultValue.toLocaleString()}
          </span>
          <span suppressHydrationWarning className="text-xs text-neutral-400 block font-mono">
            Baseline: ${vault.paceValue.toLocaleString()} Pace
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-[24px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-neutral-400 text-xs uppercase tracking-wider font-medium block">
            Curator Bond
          </span>
          <span suppressHydrationWarning className="text-2xl font-bold text-neutral-950 font-mono tracking-tight block">
            ${vault.bondAmount.toLocaleString()} USDC
          </span>
          <span suppressHydrationWarning className="text-xs text-neutral-400 block font-mono">
            Capacity: ${vault.capacity.toLocaleString()} ({vault.capacityMultiplier}×)
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-[24px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-neutral-400 text-xs uppercase tracking-wider font-medium block">
            Net Return vs Pace
          </span>
          <span
            suppressHydrationWarning
            className={`text-2xl font-bold font-mono tracking-tight block ${
              isAhead ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isAhead ? "+" : ""}${netAlpha.toLocaleString()}
          </span>
          <span suppressHydrationWarning className="text-xs text-neutral-400 block">
            {isAhead ? "Outperforming benchmark" : "Underperforming benchmark"}
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-[24px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-neutral-400 text-xs uppercase tracking-wider font-medium block">
            Fee on Alpha
          </span>
          <span suppressHydrationWarning className="text-2xl font-bold text-neutral-950 font-mono tracking-tight block">
            {vault.perfFeeBps / 100}%
          </span>
          <span suppressHydrationWarning className="text-xs text-neutral-400 block">
            Curator: {Math.max(0, (vault.perfFeeBps - 100) / 100)}% · Platform: 1%
          </span>
        </div>
      </div>

      {/* 2. Automated Protection Status (Calm & Simple) */}
      <div className="bg-white border border-neutral-200/80 rounded-[24px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <ShieldIcon className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-950 text-sm">Automated Protection Status</h3>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
              Operating normally within your corridor (${mandate.minPrice} – ${mandate.maxPrice}). If shortfall exceeds {maxShortfallPct.toFixed(1)}% below the benchmark, positions are automatically protected.
            </p>
          </div>
        </div>

        <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 self-start sm:self-auto font-mono ${
          vault.isParked
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
        }`}>
          {vault.isParked ? "Positions Paused" : `Healthy · ${bufferRemaining.toFixed(1)}% buffer`}
        </span>
      </div>

      {/* 3. Core Operational Actions: Strategy & Bond */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strategy Mandate Summary */}
        <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 sm:p-7 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-950">Active Strategy Rules</h3>
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
                {vault.tag}
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Your published mandate sets boundaries for active price corridors and emergency safety parking.
            </p>

            <div className="space-y-2 text-xs font-mono pt-1">
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Price Corridor</span>
                <span className="font-bold text-neutral-950">${mandate.minPrice} – ${mandate.maxPrice} ETH/USDC</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Max Concentration</span>
                <span className="font-bold text-neutral-950">{mandate.maxConcentrationBps / 100}% per range</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/60 flex justify-between items-center">
                <span className="text-neutral-500">Emergency Parking Limit</span>
                <span className="font-bold text-neutral-950">{mandate.maxShortfallBps / 100}% lag behind Pace</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <Link
              href="/curator/rebalance"
              className="flex-1 h-[40px] rounded-full bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <span>Manage Price Ranges</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/curator/mandate"
              className="h-[40px] px-4 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all flex items-center justify-center cursor-pointer active:scale-[0.98]"
            >
              Edit Rules
            </Link>
          </div>
        </div>

        {/* Bond Collateral Card */}
        <div id="post-bond-card" className="bg-white border border-neutral-200/80 rounded-[28px] p-6 sm:p-7 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-950">Add Bond Collateral</h3>
              <span suppressHydrationWarning className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                ${vault.bondAmount.toLocaleString()} USDC
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Deposit additional USDC bond to expand your managing capacity ({vault.capacityMultiplier}× capacity per $1 bond).
            </p>

            {bondSuccessNotice && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-950 text-white text-xs animate-in fade-in duration-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed text-neutral-300">
                  {bondSuccessNotice}
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
                  placeholder="10"
                />
                <span className="text-neutral-400 font-bold ml-2">USDC</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-400 font-sans">Presets:</span>
                {[5, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBondInput(preset.toString())}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                  >
                    +${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isDepositingBond}
            onClick={handleDepositBond}
            className="w-full h-[40px] rounded-full bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isDepositingBond ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Depositing Bond...</span>
              </>
            ) : !connectedAddress ? (
              <span>Connect Wallet to Post Bond</span>
            ) : (
              <span>Deposit Bond Collateral</span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Recent Performance Settlements (Human-readable) */}
      <div className="bg-white border border-neutral-200/80 rounded-[28px] p-6 sm:p-7 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-950">Performance Settlements</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Completed epoch boundaries and distributed alpha performance fees.
            </p>
          </div>
          <Link
            href="/curator/settlements"
            className="text-xs font-semibold text-neutral-900 hover:underline"
          >
            View All Settlements &rarr;
          </Link>
        </div>

        {vault.history.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-neutral-200/60 text-center space-y-1">
            <span className="font-bold text-neutral-900 text-xs block">Epoch #{vault.epoch || 1} In Progress</span>
            <span className="text-neutral-500 text-xs block">
              Performance settlements occur automatically at the end of each epoch cycle.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 font-mono text-xs">
            {vault.history.slice(0, 3).map((h, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900">Epoch #{h.epoch}</span>
                  <span className="text-neutral-400 ml-2">Multiplier: {h.multiplierAfter ?? vault.capacityMultiplier}×</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={h.outcome === "ahead" ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                    {h.gap >= 0 ? "+" : ""}${h.gap.toLocaleString()} vs Pace
                  </span>
                  <span className="text-neutral-800 font-semibold">
                    Fee: ${h.feeOrPayout.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
