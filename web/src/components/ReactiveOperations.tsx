"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { useCadra } from "../context/CadraContext";

export function ReactiveOperations() {
  const {
    connectedAddress,
    contractsConfig,
    isLoadingOnChain,
    updateReactiveGasLimit,
    updateReactiveRecipient,
    updateReactiveHook,
    clearReactiveRecipient,
  } = useCadra();
  const [gasLimit, setGasLimit] = useState("1500000");
  const [recipient, setRecipient] = useState(contractsConfig.callback);
  const [hook, setHook] = useState(contractsConfig.hook);

  const run = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      toast.success(message);
    } catch (error: any) {
      toast.error(error?.shortMessage || error?.message || "Reactive transaction failed");
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Reactive operations</p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-950">Autonomous safety circuit</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Owner-only controls for the Lasna RSC. Your wallet will switch to Reactive Lasna before signing.
          </p>
        </div>
        <a className="text-xs font-semibold text-neutral-500 underline" href={`${"https://lasna-omni.reactscan.net/address/"}${CONTRACT_ADDRESSES.reactive}`} target="_blank" rel="noreferrer">
          View RSC ↗
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold text-neutral-600">
          Callback gas limit
          <input value={gasLimit} onChange={(e) => setGasLimit(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          <button disabled={!connectedAddress || isLoadingOnChain} onClick={() => run(() => updateReactiveGasLimit(Number(gasLimit)), "Reactive gas limit updated")} className="mt-2 w-full rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Update gas</button>
        </label>
        <label className="text-xs font-semibold text-neutral-600">
          Callback recipient
          <input value={recipient} onChange={(e) => setRecipient(e.target.value as `0x${string}`)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs" />
          <button disabled={!connectedAddress || isLoadingOnChain} onClick={() => run(() => updateReactiveRecipient(recipient), "Callback recipient updated")} className="mt-2 w-full rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Update recipient</button>
        </label>
        <label className="text-xs font-semibold text-neutral-600">
          Subscribed hook
          <input value={hook} onChange={(e) => setHook(e.target.value as `0x${string}`)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs" />
          <button disabled={!connectedAddress || isLoadingOnChain} onClick={() => run(() => updateReactiveHook(hook), "Reactive hook subscription updated")} className="mt-2 w-full rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Update hook</button>
        </label>
      </div>

      <button disabled={!connectedAddress || isLoadingOnChain} onClick={() => run(clearReactiveRecipient, "Reactive callbacks cleared")} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40">Emergency: clear callback recipient</button>
    </section>
  );
}
