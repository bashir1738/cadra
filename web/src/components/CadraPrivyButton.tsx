"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { UserIcon, AlertTriangleIcon } from "./Icons";

interface CadraPrivyButtonProps {
  variant?: "header" | "dashboard" | "sidebar" | "mobile";
  className?: string;
}

export function CadraPrivyButton({
  variant = "header",
  className = "",
}: CadraPrivyButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const handlePromptDisconnect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDisconnect = async () => {
    setShowConfirmModal(false);
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  // Reusable confirmation alert modal teleported to document.body
  const modalContent = showConfirmModal ? (
    <div
      onClick={() => setShowConfirmModal(false)}
      className="fixed inset-0 z-[99999] w-screen h-screen bg-neutral-950/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-neutral-200/80 animate-in zoom-in-95 duration-150 mx-auto"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-950 text-base">Disconnect Wallet</h3>
            <span className="text-xs text-neutral-500 font-mono mt-0.5 block">{shortAddress}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
          Are you sure you want to disconnect? You will need to reconnect to view your followed vaults, manage positions, or post bond collateral.
        </p>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="flex-1 h-[40px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDisconnect}
            className="flex-1 h-[40px] rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const ConfirmModal =
    mounted && typeof document !== "undefined" && modalContent
      ? createPortal(modalContent, document.body)
      : null;

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
      <>
        <div
          suppressHydrationWarning
          className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-xl p-2.5"
        >
          <div
            onClick={handlePromptDisconnect}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity truncate"
            title="Click to disconnect"
          >
            <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white shrink-0">
              <UserIcon className="w-3 h-3 text-white" />
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
            onClick={handlePromptDisconnect}
            className="text-[10px] font-mono text-neutral-500 hover:text-red-700 px-2 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
          >
            Disconnect
          </button>
        </div>
        {ConfirmModal}
      </>
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
      <>
        <button
          type="button"
          suppressHydrationWarning
          onClick={handlePromptDisconnect}
          className={`h-[38px] px-3.5 rounded-full bg-white border border-neutral-200/80 text-neutral-950 text-[13px] font-mono font-medium hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${className}`}
          title="Click to disconnect"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{shortAddress}</span>
        </button>
        {ConfirmModal}
      </>
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
      <>
        <div suppressHydrationWarning className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-950 text-white flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-white" />
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
              onClick={handlePromptDisconnect}
              className="text-xs font-mono text-neutral-600 hover:text-red-600 px-2.5 py-1 rounded-md bg-white border border-neutral-200 cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>
        {ConfirmModal}
      </>
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
    <>
      <div suppressHydrationWarning className="flex items-center gap-2">
        {isWrongNetwork && (
          <button
            type="button"
            onClick={handleSwitchNetwork}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-mono font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Click to switch to Unichain Sepolia"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>Switch to Unichain Sepolia</span>
          </button>
        )}
        <button
          type="button"
          onClick={handlePromptDisconnect}
          className={`h-[38px] px-3.5 rounded-full bg-white border border-neutral-200/80 text-neutral-950 text-[13px] font-mono font-medium hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${className}`}
          title="Click to disconnect"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{shortAddress}</span>
        </button>
      </div>
      {ConfirmModal}
    </>
  );
}

// Backwards-compatible alias
export const CadraRainbowButton = CadraPrivyButton;
