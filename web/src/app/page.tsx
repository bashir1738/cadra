"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { LandingPage } from "../components/LandingPage";

export default function Home() {
  const router = useRouter();

  const handleNavigate = (tab: string) => {
    switch (tab) {
      case "follower":
      case "follower-portfolio":
        router.push("/follower/portfolio");
        break;
      case "follower-explore":
        router.push("/follower/explore");
        break;
      case "follower-queue":
        router.push("/follower/queue");
        break;
      case "curator":
      case "curator-studio":
      case "curator-overview":
        router.push("/curator/overview");
        break;
      case "curator-rebalance":
        router.push("/curator/rebalance");
        break;
      case "curator-mandate":
        router.push("/curator/mandate");
        break;
      case "curator-settlements":
        router.push("/curator/settlements");
        break;
      case "leaderboard":
        router.push("/leaderboard");
        break;
      case "simulator":
        router.push("/simulator");
        break;
      default:
        router.push("/");
    }
  };

  const handleSelectRole = (role: string) => {
    if (role.startsWith("curator")) {
      router.push("/curator/overview");
    } else {
      router.push("/follower/portfolio");
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Top Floating Header */}
      <Header />

      {/* Main Landing Page Content */}
      <main className="flex-1">
        <LandingPage
          onNavigate={handleNavigate}
          onSelectRole={handleSelectRole}
        />
      </main>

      {/* Minimalist Public Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50/60 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-200">
            {/* Brand Column */}
            <div className="space-y-4 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center p-1.5">
                  <img
                    src="/cadra/logo/cadra-mark-white.svg"
                    alt="Cadra"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-lg tracking-tight text-neutral-900">CADRA</span>
              </Link>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Curated liquidity on Uniswap v4 protected by continuous passive pace tracking and personal curator bonds.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Uniswap v4 Hook</span>
              </div>
            </div>

            {/* Follower Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                For Followers
              </h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/follower/explore" className="hover:text-neutral-950 transition-colors">
                    Discover Curators
                  </Link>
                </li>
                <li>
                  <Link href="/follower/portfolio" className="hover:text-neutral-950 transition-colors">
                    My Portfolio
                  </Link>
                </li>
                <li>
                  <Link href="/follower/queue" className="hover:text-neutral-950 transition-colors">
                    Deposit & Withdrawal Queue
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-neutral-950 transition-colors">
                    Curator Leaderboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Curator Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                For Curators
              </h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/curator/overview" className="hover:text-neutral-950 transition-colors">
                    Curator Studio Overview
                  </Link>
                </li>
                <li>
                  <Link href="/curator/rebalance" className="hover:text-neutral-950 transition-colors">
                    Range Rebalancer
                  </Link>
                </li>
                <li>
                  <Link href="/curator/mandate" className="hover:text-neutral-950 transition-colors">
                    Mandate Management
                  </Link>
                </li>
                <li>
                  <Link href="/curator/settlements" className="hover:text-neutral-950 transition-colors">
                    Settlements & Fee History
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform & Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Platform & Code
              </h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/simulator" className="hover:text-neutral-950 transition-colors">
                    Mechanism Playground Demo
                  </Link>
                </li>
                <li>
                  <span className="text-neutral-500">PaceLib: 30/30 Verified</span>
                </li>
                <li>
                  <span className="text-neutral-500">Non-Custodial Architecture</span>
                </li>
                <li>
                  <span className="text-neutral-500">Continuous Epoch Settlement</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Cadra Protocol. All rights reserved.</p>
            <p className="font-mono text-neutral-500">
              Built on Uniswap v4 Hook Architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
