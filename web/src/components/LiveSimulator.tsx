"use client";

import React, { useState } from "react";
import { VaultData } from "../types/cadra";
import { AlertTriangleIcon, CheckCircleIcon, RefreshCwIcon, ShieldIcon, ActivityIcon, ArrowRightIcon } from "./Icons";

interface LiveSimulatorProps {
  vaults: VaultData[];
  onTriggerEnforce: (vaultId: number) => void;
  onTriggerSettle: (vaultId: number, simulatedGap: number) => void;
  onResetDemo: () => void;
}

export function LiveSimulator({
  vaults,
  onTriggerEnforce,
  onTriggerSettle,
  onResetDemo,
}: LiveSimulatorProps) {
  const [selectedVaultId, setSelectedVaultId] = useState<number>(vaults[0]?.id || 1);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(3100);
  const [simulatedGapBps, setSimulatedGapBps] = useState<number>(-450); // -4.5% shortfall
  const [executionLog, setExecutionLog] = useState<string[]>([
    "Cadra Playground ready.",
    "Pool: WETH/USDC (0.05% fee tier) monitored by CadraHook.",
  ]);

  if (vaults.length === 0) {
    return (
      <div className="space-y-6 font-sans text-xs max-w-5xl mx-auto">
        <div className="relative overflow-hidden bg-[#09090b] border border-neutral-800 rounded-3xl p-10 sm:p-14 text-center space-y-5 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sky-400 shadow-sm">
              <ActivityIcon className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-sky-400 font-semibold">Mechanism Simulator</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Ready to Simulate Cadra Hook Actions
            </h3>
            <p className="text-neutral-300 leading-relaxed text-xs">
              No active vaults found yet. You can create a strategy in Curator Studio, or click &quot;⚡ Load Testnet Archetypes&quot; in the footer to test out-of-band price alerts, keeper parking, and settlement rewards!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const vault = vaults.find((v) => v.id === selectedVaultId) || vaults[0];
  const mandate = vault.mandate;

  const isOutOfBand = simulatedPrice < mandate.minPrice || simulatedPrice > mandate.maxPrice;
  const shortfallPct = Math.abs(simulatedGapBps) / 100;

  const handleSimulateSwap = (newPrice: number) => {
    setSimulatedPrice(newPrice);
    const outside = newPrice < mandate.minPrice || newPrice > mandate.maxPrice;
    setExecutionLog((prev) => [
      `[Swap] Trader executed swap. Pool spot price moved to $${newPrice}. ${
        outside
          ? `⚠️ afterSwap callback flagged BandLeft for Vault #${vault.id} (${vault.name})!`
          : "Spot price remains safely inside mandate band."
      }`,
      ...prev,
    ]);
  };

  const handleExecuteEnforce = () => {
    onTriggerEnforce(vault.id);
    setExecutionLog((prev) => [
      `[Keeper enforce(vaultId=${vault.id})] Valued vault at TWAP. Shortfall is ${shortfallPct.toFixed(
        1
      )}% (Threshold: ${mandate.maxShortfallBps / 100}%).`,
      `🚨 [VaultParked] Emergency brake engaged: Curator FROZEN! Active positions liquidated and 100% parked into safe Pace benchmark!`,
      ...prev,
    ]);
  };

  const handleExecuteSettle = () => {
    const gapUsdc = (vault.vaultValue * simulatedGapBps) / 10000;
    onTriggerSettle(vault.id, gapUsdc);
    if (gapUsdc >= 0) {
      const fee = gapUsdc * (vault.perfFeeBps / 10000);
      setExecutionLog((prev) => [
        `[Keeper settle(vaultId=${vault.id})] Vault finished AHEAD by +$${gapUsdc.toFixed(2)}.`,
        `✓ Curator earned performance fee: $${fee.toFixed(2)}. Capacity multiplier raised to ${Math.min(
          20,
          vault.capacityMultiplier + 1
        )}×.`,
        ...prev,
      ]);
    } else {
      const payout = Math.min(Math.abs(gapUsdc), vault.bondAmount);
      setExecutionLog((prev) => [
        `[Keeper settle(vaultId=${vault.id})] Vault finished BEHIND Pace by -$${Math.abs(
          gapUsdc
        ).toFixed(2)}.`,
        `🛡️ Curator bond paid followers: $${payout.toFixed(2)}. Capacity multiplier dropped to ${Math.max(
          2,
          vault.capacityMultiplier - 2
        )}×.`,
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Title Card */}
      <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-3xl p-8 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-950 font-mono">
                Cadra Mechanism Playground
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Simulate price movements, mandate breaches, keeper emergency parking, and fair epoch settlement live.
            </p>
          </div>

          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-300 text-neutral-700 hover:text-neutral-950 text-xs font-mono transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCwIcon className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>

        {/* Vault Selector Pills */}
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          {vaults.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVaultId(v.id)}
              className={`px-4 py-2 rounded-full text-xs transition-all cursor-pointer ${
                selectedVaultId === v.id
                  ? "bg-neutral-900 text-white font-bold shadow-xs"
                  : "bg-white border border-neutral-300 text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Controls & Live Execution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 & 2: Market Price Movement & Parking */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-neutral-950 text-sm">Step 1: Move Pool Price</h3>
            <span className="text-xs font-mono text-neutral-500 uppercase">Simulate Swaps</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-neutral-600">
              <span>Pool Spot Price (ETH/USDC)</span>
              <span className="text-neutral-950 font-bold text-sm">${simulatedPrice}</span>
            </div>
            <input
              type="range"
              min="1800"
              max="4200"
              step="25"
              value={simulatedPrice}
              onChange={(e) => handleSimulateSwap(parseInt(e.target.value, 10))}
              className="w-full accent-neutral-900 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>$1,800</span>
              <span>Mandate: ${mandate.minPrice} - ${mandate.maxPrice}</span>
              <span>$4,200</span>
            </div>
          </div>

          {/* Quick Swap Presets */}
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
            <button
              onClick={() => handleSimulateSwap(3000)}
              className="px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-800 text-xs cursor-pointer font-medium"
            >
              Center Range ($3,000)
            </button>
            <button
              onClick={() => handleSimulateSwap(3400)}
              className="px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-800 text-xs cursor-pointer font-medium"
            >
              Bullish Rally ($3,400)
            </button>
            <button
              onClick={() => handleSimulateSwap(2200)}
              className="px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs cursor-pointer font-medium"
            >
              🚨 Breach Band ($2,200)
            </button>
          </div>

          {/* Band Status */}
          <div
            className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center justify-between ${
              isOutOfBand
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <span>
              {isOutOfBand
                ? `⚠️ OUT OF BAND! (afterSwap flagged BandLeft)`
                : `✓ Spot price within allowed corridor.`}
            </span>
            <span className="text-xs uppercase font-bold">{isOutOfBand ? "BREACHED" : "HEALTHY"}</span>
          </div>

          {/* Step 2: Keeper Enforce Action */}
          <div className="pt-2 border-t border-neutral-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-neutral-950 text-sm">Step 2: Emergency Brake</h3>
              <span className="text-xs font-mono text-neutral-500">enforce(vaultId)</span>
            </div>
            <p className="text-xs text-neutral-600">
              When a vault drops {mandate.maxShortfallBps / 100}% behind, any keeper calls <code className="text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">enforce()</code> to value the vault at TWAP and park it safely into The Pace.
            </p>
            <button
              onClick={handleExecuteEnforce}
              className="w-full py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
            >
              Trigger Keeper enforce()
            </button>
          </div>
        </div>

        {/* Step 3: Epoch Settlement & Mathematical Replay */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-neutral-950 text-sm">Step 3: Epoch Settlement</h3>
            <span className="text-xs font-mono text-neutral-500 uppercase">settle(vaultId)</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-neutral-600">
              <span>Simulated Epoch Gap vs Pace</span>
              <span
                className={`font-bold text-sm ${simulatedGapBps >= 0 ? "text-emerald-700" : "text-red-700"}`}
              >
                {simulatedGapBps >= 0 ? "+" : ""}
                {(simulatedGapBps / 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="-1500"
              max="1500"
              step="50"
              value={simulatedGapBps}
              onChange={(e) => setSimulatedGapBps(parseInt(e.target.value, 10))}
              className="w-full accent-neutral-900 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>-15% (Lagging)</span>
              <span>0% (Equal)</span>
              <span>+15% (Winning)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-mono space-y-2">
            <div className="flex justify-between text-neutral-600">
              <span>Vault Value vs Pace:</span>
              <span className="text-neutral-950 font-bold">
                ${((vault.vaultValue * (10000 + simulatedGapBps)) / 10000).toFixed(0)} vs ${vault.paceValue}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Calculated Gap ($g$):</span>
              <span className={simulatedGapBps >= 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                {simulatedGapBps >= 0 ? "+" : ""}${((vault.vaultValue * simulatedGapBps) / 10000).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600 border-t border-neutral-200 pt-2">
              <span>Settlement Resolution:</span>
              <span className="text-neutral-950 font-bold">
                {simulatedGapBps >= 0
                  ? `Curator earns 20% fee ($${(((vault.vaultValue * simulatedGapBps) / 10000) * 0.2).toFixed(2)})`
                  : `Curator bond pays followers ($${Math.min(Math.abs((vault.vaultValue * simulatedGapBps) / 10000), vault.bondAmount).toFixed(2)})`}
              </span>
            </div>
          </div>

          <button
            onClick={handleExecuteSettle}
            className="w-full py-3 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
          >
            Trigger Keeper settle()
          </button>
        </div>
      </div>

      {/* Terminal Output Log in High-Contrast Sleek Black Container */}
      <div className="bg-[#09090b] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-3 font-mono text-xs shadow-xl text-white">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase text-xs tracking-wider">Hook Event Stream</span>
          </div>
          <span className="text-xs text-neutral-400">Live Callbacks</span>
        </div>

        <div className="h-44 overflow-y-auto space-y-1.5 text-neutral-300 text-xs pr-2 font-mono">
          {executionLog.map((log, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl border ${
                log.includes("🚨") || log.includes("⚠️")
                  ? "bg-red-950/40 border-red-500/40 text-red-300"
                  : log.includes("✓")
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-neutral-900 border-neutral-800 text-neutral-300"
              }`}
            >
              <span className="text-neutral-500 mr-2 text-xs">&gt;</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
