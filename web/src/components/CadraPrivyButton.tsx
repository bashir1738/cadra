"use client";

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { UserIcon } from "./Icons";

interface CadraPrivyButtonProps {
  variant?: "header" | "dashboard" | "sidebar" | "mobile";
  className?: string;
}

export function CadraPrivyButton({
  variant = "header",
  className = "",
}: CadraPrivyButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resolve active wallet address
  const activeWallet = wallets[0] || user?.wallet;
  const address = activeWallet?.address || (user?.wallet?.address as string | undefined);
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const isConnected = mounted && ready && authenticated && Boolean(address);

  // Detect whether wallet is on correct testnet (Unichain Sepolia: 1301)
  const walletChainId = (activeWallet as any)?.chainId;
  const isWrongNetwork =
    isConnected &&
    Boolean(walletChainId) &&
    walletChainId !== "eip155:1301" &&
    walletChainId !== 1301 &&
    walletChainId !== "1301";

  const handleSwitchNetwork = async () => {
    if (activeWallet && "switchChain" in activeWallet && typeof (activeWallet as any).switchChain === "function") {
      try {
        await (activeWallet as any).switchChain(1301);
      } catch (e) {
        console.warn("Switch chain failed or cancelled:", e);
      }
    }
  };

  // ========================================================
  // 1. SIDEBAR VARIANT
  // ========================================================
  if (variant === "sidebar") {
    if (!isConnected) {
      return (
        <div
          suppressHydrationWarning
          className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 bg-neutral-300" />
            <div>
              <span className="text-[12px] font-mono font-medium text-neutral-900 block">
                Not connected
              </span>
              <span className="text-[11px] text-neutral-400 block">Privy Embedded / Web3</span>
            </div>
          </div>
          <button
            type="button"
            onClick={mounted ? login : undefined}
            className="text-[11px] font-semibold px-3 py-1.5 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
          >
            Connect
          </button>
        </div>
      );
    }

    return (
      <div
        suppressHydrationWarning
        className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5"
      >
        <div
          onClick={logout}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity truncate"
          title="Click to disconnect"
        >
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[10px] font-mono font-bold shrink-0">
            {address?.slice(2, 4).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="text-[12px] font-mono font-bold text-neutral-950 block truncate">
              {shortAddress}
            </span>
            {isWrongNetwork ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchNetwork();
                }}
                className="text-[10px] text-amber-600 font-mono font-semibold block hover:underline cursor-pointer"
              >
                Switch to Unichain Sepolia
              </button>
            ) : (
              <span className="text-[10px] text-neutral-500 font-mono block">
                Unichain Sepolia (1301)
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-[10px] font-mono text-neutral-500 hover:text-red-700 px-2 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // ========================================================
  // 2. DASHBOARD VARIANT
  // ========================================================
  if (variant === "dashboard") {
    if (!isConnected) {
      return (
        <button
          type="button"
          suppressHydrationWarning
          onClick={mounted ? login : undefined}
          className={`h-[38px] px-4 rounded-full bg-neutral-950 text-white text-[13px] font-semibold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs flex items-center gap-2 active:scale-[0.98] ${className}`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Connect</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        suppressHydrationWarning
        onClick={logout}
        className={`h-[38px] px-3.5 rounded-full bg-white border border-neutral-200/80 text-neutral-950 text-[13px] font-mono font-bold hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${className}`}
        title="Click to disconnect"
      >
        <div className="w-5 h-5 rounded-md bg-neutral-950 text-white flex items-center justify-center text-[9px] font-bold">
          {address?.slice(2, 4).toUpperCase()}
        </div>
        <span>{shortAddress}</span>
      </button>
    );
  }

  // ========================================================
  // 3. MOBILE MENU VARIANT
  // ========================================================
  if (variant === "mobile") {
    if (!isConnected) {
      return (
        <button
          type="button"
          suppressHydrationWarning
          onClick={mounted ? login : undefined}
          className={`w-full h-11 rounded-xl bg-neutral-950 text-white font-semibold text-sm hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] ${className}`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
      );
    }

    return (
      <div suppressHydrationWarning className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-950 text-white flex items-center justify-center text-[10px] font-mono font-bold">
              {address?.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-neutral-950 block">
                {shortAddress}
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                Unichain Sepolia
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-mono text-neutral-600 hover:text-red-600 px-2.5 py-1 rounded-md bg-white border border-neutral-200 cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // 4. HEADER VARIANT (DEFAULT)
  // ========================================================
  if (!isConnected) {
    return (
      <button
        type="button"
        suppressHydrationWarning
        onClick={mounted ? login : undefined}
        className={`h-[38px] px-4 rounded-full bg-neutral-950 text-white text-[13px] font-semibold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs flex items-center gap-2 active:scale-[0.98] ${className}`}
      >
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div suppressHydrationWarning className="flex items-center gap-2">
      {isWrongNetwork ? (
        <button
          type="button"
          onClick={handleSwitchNetwork}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-mono font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
          title="Click to switch to Unichain Sepolia"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>Switch to Unichain Sepolia</span>
        </button>
      ) : (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-semibold text-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Unichain Sepolia</span>
        </div>
      )}
      <button
        type="button"
        onClick={logout}
        className={`h-[38px] px-3.5 rounded-full bg-white border border-neutral-200/80 text-neutral-950 text-[13px] font-mono font-bold hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${className}`}
        title="Click to disconnect"
      >
        <div className="w-5 h-5 rounded-md bg-neutral-950 text-white flex items-center justify-center text-[9px] font-bold">
          {address?.slice(2, 4).toUpperCase()}
        </div>
        <span>{shortAddress}</span>
      </button>
    </div>
  );
}

// Backwards-compatible alias
export const CadraRainbowButton = CadraPrivyButton;
