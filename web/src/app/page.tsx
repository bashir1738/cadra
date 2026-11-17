"use client";

import React from "react";
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
    </div>
  );
}
