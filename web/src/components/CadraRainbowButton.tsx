"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface CadraRainbowButtonProps {
  variant?: "header" | "dashboard" | "sidebar" | "mobile";
  className?: string;
}

export function CadraRainbowButton({
  variant = "header",
  className = "",
}: CadraRainbowButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        // SSR / Loading placeholder
        if (!ready) {
          if (variant === "sidebar") {
            return (
              <div className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-neutral-300" />
                  <div>
                    <span className="text-[12px] font-mono font-medium text-neutral-400 block">Connecting...</span>
                    <span className="text-[11px] text-neutral-300 block">Read-only mode</span>
                  </div>
                </div>
                <div className="h-7 w-16 bg-neutral-100 rounded-lg animate-pulse" />
              </div>
            );
          }
          return (
            <div
              className={`h-[38px] w-[116px] rounded-full bg-white border border-neutral-200/60 animate-pulse ${className}`}
              aria-hidden="true"
            />
          );
        }

        // ========================================================
        // 1. SIDEBAR VARIANT
        // ========================================================
        if (variant === "sidebar") {
          if (!connected) {
            return (
              <div className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-neutral-300" />
                  <div>
                    <span className="text-[12px] font-mono font-medium text-neutral-900 block">
                      Not connected
                    </span>
                    <span className="text-[11px] text-neutral-400 block">Read-only mode</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="text-[11px] font-semibold px-3 py-1.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Connect
                </button>
              </div>
            );
          }

          if (chain.unsupported) {
            return (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                  <span className="text-[12px] font-medium text-amber-900 truncate">Wrong Network</span>
                </div>
                <button
                  type="button"
                  onClick={openChainModal}
                  className="text-[11px] font-semibold px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
                >
                  Switch
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5">
              <div
                onClick={openAccountModal}
                className="flex items-center gap-2 truncate cursor-pointer hover:opacity-80 transition-opacity"
                title="Manage wallet in RainbowKit"
              >
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                <div className="truncate">
                  <span className="text-[12px] font-mono font-medium text-neutral-900 block truncate">
                    {account.displayName}
                  </span>
                  <span className="text-[11px] text-neutral-400 block truncate">
                    {chain.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={openAccountModal}
                className="text-[11px] text-neutral-500 hover:text-neutral-950 px-2 py-1 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                Manage
              </button>
            </div>
          );
        }

        // ========================================================
        // 2. DASHBOARD TOP-BAR VARIANT
        // ========================================================
        if (variant === "dashboard") {
          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className={`px-4 py-1.5 rounded-full bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-all cursor-pointer shrink-0 active:scale-[0.98] ${className}`}
              >
                Connect Wallet
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                type="button"
                onClick={openChainModal}
                className={`px-3 py-1.5 rounded-full bg-amber-500 text-white text-[12px] font-medium hover:bg-amber-600 transition-all cursor-pointer shrink-0 active:scale-[0.98] ${className}`}
              >
                Wrong Network
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openChainModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-[11px] font-medium text-neutral-700 transition-colors cursor-pointer"
              >
                {chain.hasIcon && chain.iconUrl && (
                  <img
                    alt={chain.name ?? "Chain"}
                    src={chain.iconUrl}
                    className="w-3 h-3 rounded-full"
                  />
                )}
                <span>{chain.name}</span>
              </button>

              <button
                type="button"
                onClick={openAccountModal}
                className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs text-neutral-900 cursor-pointer hover:bg-neutral-200/70 transition-colors ${className}`}
                title="Manage wallet in RainbowKit"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[12px] font-medium">
                  {account.displayName}
                </span>
              </button>
            </div>
          );
        }

        // ========================================================
        // 3. MOBILE MENU VARIANT
        // ========================================================
        if (variant === "mobile") {
          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className={`py-2.5 rounded-full bg-neutral-950 text-white text-sm font-medium text-center cursor-pointer transition-colors hover:bg-neutral-800 ${className}`}
              >
                Connect Wallet
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                type="button"
                onClick={openChainModal}
                className={`py-2.5 rounded-full bg-amber-500 text-white text-sm font-medium text-center cursor-pointer ${className}`}
              >
                Wrong Network
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={openAccountModal}
              className={`py-2.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer ${className}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono">{account.displayName}</span>
              <span className="text-xs text-neutral-400 font-normal">({chain.name})</span>
            </button>
          );
        }

        // ========================================================
        // 4. HEADER NAVBAR VARIANT
        // ========================================================
        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={`h-[38px] px-5 rounded-full bg-white border border-neutral-200/90 hover:border-neutral-300 text-neutral-900 hover:text-neutral-950 font-semibold text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-neutral-50/90 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center ${className}`}
            >
              Connect
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`h-[38px] px-4 rounded-full bg-white border border-amber-300 text-amber-800 text-[12px] font-medium hover:bg-amber-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all cursor-pointer inline-flex items-center gap-1.5 ${className}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Wrong Network</span>
            </button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChainModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 h-[38px] rounded-full bg-white border border-neutral-200/80 hover:bg-neutral-50 text-[11px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              {chain.hasIcon && chain.iconUrl && (
                <img
                  alt={chain.name ?? "Chain"}
                  src={chain.iconUrl}
                  className="w-3.5 h-3.5 rounded-full"
                />
              )}
              <span>{chain.name}</span>
            </button>

            <button
              type="button"
              onClick={openAccountModal}
              className={`flex items-center gap-2 pl-3 pr-3.5 h-[38px] rounded-full bg-white border border-neutral-200/90 text-xs text-neutral-900 cursor-pointer hover:bg-neutral-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all ${className}`}
              title="Manage wallet in RainbowKit"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[12px] font-medium">
                {account.displayName}
              </span>
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
