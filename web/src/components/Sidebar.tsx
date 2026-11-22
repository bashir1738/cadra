"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserIcon,
  ShieldIcon,
  ScaleIcon,
  ActivityIcon,
  ClockIcon,
  XIcon,
  ZapIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
} from "./Icons";
import { CadraPrivyButton } from "./CadraPrivyButton";
import { useCadra } from "../context/CadraContext";
import { CONTRACT_ADDRESSES } from "../config/contracts";

export interface SidebarProps {
  portalMode: "follower" | "curator";
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onRequestSwitchRole?: (targetRole: "follower" | "curator") => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar = React.memo(function Sidebar({
  portalMode,
  isOpenMobile,
  onCloseMobile,
  onRequestSwitchRole,
}: SidebarProps) {
  const pathname = usePathname();
  const {
    vaults,
    setActiveRole,
  } = useCadra();

  const followerItems: NavItem[] = [
    {
      href: "/follower/portfolio",
      label: "Portfolio",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      href: "/follower/explore",
      label: "Discover Curators",
      icon: <UserIcon className="w-[18px] h-[18px]" />,
      badge: vaults.length > 0 ? String(vaults.length) : undefined,
    },
    {
      href: "/follower/queue",
      label: "Queue & Activity",
      icon: <ClockIcon className="w-[18px] h-[18px]" />,
    },
    {
      href: "/follower/safety",
      label: "Reactive Safety",
      icon: <ShieldIcon className="w-[18px] h-[18px]" />,
      badge: "~1s",
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: <ScaleIcon className="w-[18px] h-[18px]" />,
    },
    {
      href: "/simulator",
      label: "Demo Sandbox",
      icon: <ActivityIcon className="w-[18px] h-[18px]" />,
      badge: "Demo",
    },
  ];

  const curatorItems: NavItem[] = [
    {
      href: "/curator/overview",
      label: "Vault Overview",
      icon: <ShieldIcon className="w-[18px] h-[18px]" />,
    },
    {
      href: "/curator/rebalance",
      label: "Range Rebalancer",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      href: "/curator/mandate",
      label: "Mandate & Rules",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/curator/settlements",
      label: "Settlements & Fees",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: <ScaleIcon className="w-[18px] h-[18px]" />,
    },
    {
      href: "/simulator",
      label: "Demo Sandbox",
      icon: <ActivityIcon className="w-[18px] h-[18px]" />,
      badge: "Demo",
    },
  ];

  const currentNavItems = portalMode === "follower" ? followerItems : curatorItems;

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-white border-r border-neutral-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand & Role Switcher */}
        <div className="p-4 border-b border-neutral-100 space-y-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              prefetch={true}
              aria-label="Cadra Home"
              className="flex items-center gap-2.5 group"
              onClick={onCloseMobile}
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shadow-xs">
                <img
                  src="/cadra/logo/cadra-mark-white.svg"
                  alt="Cadra"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-neutral-950 text-base tracking-tight">Cadra</span>
            </Link>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 cursor-pointer"
                aria-label="Close sidebar"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Minimalist Portal Switcher with Confirmation Intercept */}
          <div className="bg-neutral-100/90 p-1 rounded-xl flex items-center gap-1 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => {
                if (portalMode === "follower") return;
                if (onRequestSwitchRole) {
                  onRequestSwitchRole("follower");
                } else {
                  setActiveRole("follower");
                }
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 text-center cursor-pointer ${
                portalMode === "follower"
                  ? "bg-white text-neutral-950 shadow-2xs font-semibold cursor-default"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Follower
            </button>
            <button
              type="button"
              onClick={() => {
                if (portalMode === "curator") return;
                if (onRequestSwitchRole) {
                  onRequestSwitchRole("curator");
                } else {
                  setActiveRole("curator");
                }
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 text-center cursor-pointer ${
                portalMode === "curator"
                  ? "bg-white text-neutral-950 shadow-2xs font-semibold cursor-default"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Curator
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            {portalMode === "follower" ? "Follower Tools" : "Curator Studio"}
          </div>

          {currentNavItems.map((item) => {
            const isSelected =
              pathname === item.href ||
              (item.href === "/follower/portfolio" && pathname === "/follower") ||
              (item.href === "/curator/overview" && pathname === "/curator");

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onCloseMobile}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150 ${
                  isSelected
                    ? "bg-neutral-950 text-white font-semibold"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? "text-white" : "text-neutral-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 px-3">
            <Link
              href="/"
              prefetch={true}
              onClick={onCloseMobile}
              className="w-full text-left text-[12px] font-medium text-neutral-400 hover:text-neutral-950 flex items-center gap-1.5 py-1.5 transition-colors duration-150"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Bottom Wallet & Network Status Card (Fixed, Compact, Zero Overflow) */}
        <div className="p-3.5 border-t border-neutral-100 space-y-2 bg-[#FAFAFA] shrink-0">
          <CadraPrivyButton variant="sidebar" />

          <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Unichain Sepolia
            </span>
            <a
              href={`https://sepolia.uniscan.xyz/address/${CONTRACT_ADDRESSES.hook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-950 underline text-[10px]"
            >
              Hook {CONTRACT_ADDRESSES.hook.slice(0, 6)}...{CONTRACT_ADDRESSES.hook.slice(-4)}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
});
