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
import { CadraRainbowButton } from "./CadraRainbowButton";
import { useCadra } from "../context/CadraContext";

export interface SidebarProps {
  portalMode: "follower" | "curator";
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export function Sidebar({
  portalMode,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const {
    vaults,
    seedArchetypes,
    resetDemo,
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
      label: "Simulator",
      icon: <ActivityIcon className="w-[18px] h-[18px]" />,
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
      label: "Simulator",
      icon: <ActivityIcon className="w-[18px] h-[18px]" />,
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-neutral-200/75 flex flex-col justify-between transition-transform duration-250 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand & Role Switcher */}
        <div className="p-5 border-b border-neutral-100 space-y-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Cadra Home"
              className="flex items-center group"
              onClick={onCloseMobile}
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shadow-sm">
                <img
                  src="/cadra/logo/cadra-mark-white.svg"
                  alt="Cadra"
                  className="w-full h-full object-contain"
                />
              </div>
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

          {/* Minimalist Portal Switcher */}
          <div className="bg-neutral-100/80 p-1 rounded-xl flex items-center gap-1 text-[12px] font-medium">
            <Link
              href="/follower/portfolio"
              onClick={() => {
                setActiveRole("follower");
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                portalMode === "follower"
                  ? "bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Follower
            </Link>
            <Link
              href="/curator/overview"
              onClick={() => {
                setActiveRole("curator");
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                portalMode === "curator"
                  ? "bg-neutral-950 text-white font-semibold"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Curator
            </Link>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium text-neutral-400">
            {portalMode === "follower" ? "Follower Portal" : "Curator Studio"}
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
                onClick={onCloseMobile}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isSelected
                    ? "bg-neutral-950 text-white font-semibold"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isSelected ? "text-white" : "text-neutral-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
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

          <div className="pt-6 px-3">
            <Link
              href="/"
              onClick={onCloseMobile}
              className="w-full text-left text-[12px] font-medium text-neutral-400 hover:text-neutral-950 flex items-center gap-1.5 py-2 transition-colors"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Website</span>
            </Link>
          </div>
        </div>

        {/* Bottom Wallet & Sandbox Controls */}
        <div className="p-4 border-t border-neutral-100 space-y-3 bg-[#FAFAFA]">
          {/* RainbowKit Wallet Status Card */}
          <CadraRainbowButton variant="sidebar" />

          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>{vaults.length} vaults</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={seedArchetypes}
                title="Load testnet archetype vaults"
                className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ZapIcon className="w-3 h-3 text-amber-500" />
                <span>Seed</span>
              </button>
              <button
                onClick={resetDemo}
                title="Reset state"
                className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCwIcon className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
