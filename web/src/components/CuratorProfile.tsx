"use client";

import React from "react";
import { VaultData } from "../types/cadra";
import { LockIcon, AlertTriangleIcon } from "./Icons";

interface CuratorProfileProps {
  vault: VaultData;
  onBack: () => void;
  onFollow: (vaultId: number) => void;
}

export function CuratorProfile({ vault, onBack, onFollow }: CuratorProfileProps) {
  const currentPoolPrice = 3120; // USDC per ETH
  const mandate = vault.mandate;

  const rangeSpan = mandate.maxPrice - mandate.minPrice;
  const pricePositionPct = Math.max(
    0,
    Math.min(100, ((currentPoolPrice - mandate.minPrice) / rangeSpan) * 100)
  );

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onBack}
          className="text-xs font-mono text-neutral-600 hover:text-neutral-950 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer font-medium"
        >
          ← Back
        </button>
        <button
          onClick={() => onFollow(vault.id)}
          className="px-6 py-2.5 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
        >
          Follow This Curator
        </button>
      </div>

      {/* Curator Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-200 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">{vault.name}</h1>
              <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 font-semibold">
                {vault.tag}
              </span>
              {vault.isParked && (
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 flex items-center gap-1 font-semibold">
                  <AlertTriangleIcon className="w-3.5 h-3.5" />
                  Parked by Keeper
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
              {vault.description}
            </p>
            <p className="text-xs font-mono text-neutral-500">
              Curator: {vault.curatorAddress} · Fee: {vault.perfFeeBps / 100}% on outperformance only
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs w-full sm:w-auto">
            <div>
              <span className="text-neutral-500 uppercase text-xs block">Bond Posted</span>
              <span className="text-neutral-950 font-bold text-base">${vault.bondAmount.toLocaleString()} USDC</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase text-xs block">Managing Capacity</span>
              <span className="text-neutral-950 font-bold text-base">${vault.capacity.toLocaleString()}</span>
              <span className="text-xs text-neutral-400 block font-normal">({vault.capacityMultiplier}× multiplier)</span>
            </div>
          </div>
        </div>

        {/* Published Mandate Card */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LockIcon className="w-4 h-4 text-neutral-900" />
              <h2 className="text-xs uppercase font-mono tracking-wider text-neutral-700 font-bold">
                MANDATE RULES (ENFORCED ON-CHAIN)
              </h2>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              The Uniswap v4 hook rejects any rebalance that breaks these bounds. If the vault lags behind the Pace by more than the shortfall threshold, the hook safely parks follower funds into the Pace.
            </p>
          </div>

          {/* Visual Price Band */}
          <div className="space-y-2.5 font-mono text-xs p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">Allowed Price Band:</span>
              <span className="text-neutral-950 font-bold">
                ${mandate.minPrice.toLocaleString()} — ${mandate.maxPrice.toLocaleString()} ETH/USDC
              </span>
            </div>

            {/* Range bar */}
            <div className="h-3 w-full bg-neutral-100 rounded-full relative overflow-hidden border border-neutral-200">
              <div
                className="absolute top-0 bottom-0 bg-neutral-300 rounded-full"
                style={{ left: "15%", right: "15%" }}
              />
              <div
                className="absolute top-0 bottom-0 w-2 bg-emerald-500 shadow-xs"
                style={{ left: `${pricePositionPct}%` }}
                title={`Spot Price: $${currentPoolPrice}`}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-500">
              <span>Min: ${mandate.minPrice}</span>
              <span className="text-emerald-700 font-bold">Spot TWAP: ${currentPoolPrice}</span>
              <span>Max: ${mandate.maxPrice}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 uppercase text-xs block">Max Concentration</span>
              <span className="text-base font-bold text-neutral-950 mt-1 block">
                {mandate.maxConcentrationBps / 100}% per range
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 uppercase text-xs block">Min Range Width</span>
              <span className="text-base font-bold text-neutral-950 mt-1 block">
                {mandate.minRangeWidth} ticks (~±1%)
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 uppercase text-xs block">Parking Trigger</span>
              <span className="text-base font-bold text-amber-700 mt-1 block">
                {mandate.maxShortfallBps / 100}% lag behind Pace
              </span>
            </div>
          </div>
        </div>

        {/* Historical Epochs */}
        <div className="pt-4 border-t border-neutral-200 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-neutral-950 text-sm">Settlement History</h3>
          {vault.history.length === 0 ? (
            <p className="text-neutral-500 text-xs">No historical settlements yet. Current epoch active.</p>
          ) : (
            <div className="space-y-2">
              {vault.history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs"
                >
                  <span className="font-bold text-neutral-950">Epoch #{h.epoch}</span>
                  <span className={h.outcome === "ahead" ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                    {h.outcome === "ahead" ? `Ahead (+${h.gap.toFixed(2)})` : `Behind (-${Math.abs(h.gap).toFixed(2)})`}
                  </span>
                  <span className="text-neutral-600">
                    {h.outcome === "ahead" ? `Curator Fee: $${h.feeOrPayout.toFixed(2)}` : `Bond Payout: $${h.feeOrPayout.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
