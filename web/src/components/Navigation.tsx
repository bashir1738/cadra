"use client";

import React from "react";
import { UserIcon, ScaleIcon, ActivityIcon, ShieldIcon } from "./Icons";

export type TabKey =
  | "landing"
  | "follower"
  | "follower-portfolio"
  | "follower-explore"
  | "follower-queue"
  | "curator-studio"
  | "curator-overview"
  | "curator-rebalance"
  | "curator-mandate"
  | "curator-settlements"
  | "leaderboard"
  | "simulator";

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isCuratorRole: boolean;
}

export function Navigation({ activeTab, onSelectTab, isCuratorRole }: NavigationProps) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      key: "landing",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: "follower",
      label: "Follower Portal",
      icon: <UserIcon className="w-4 h-4" />,
    },
    {
      key: "curator-studio",
      label: isCuratorRole ? "Curator Studio" : "Curator Mandates",
      icon: <ShieldIcon className="w-4 h-4" />,
      badge: isCuratorRole ? "Curator Mode" : undefined,
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: <ScaleIcon className="w-4 h-4" />,
    },
    {
      key: "simulator",
      label: "Playground Demo",
      icon: <ActivityIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
