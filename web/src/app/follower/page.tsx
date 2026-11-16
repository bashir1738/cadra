"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../components/DashboardLayout";
import { FollowerDashboard } from "../../components/FollowerDashboard";
import { useCadra } from "../../context/CadraContext";

export default function FollowerIndexPage() {
  const router = useRouter();
  const { vaults, userPositions, deposit, withdraw } = useCadra();

  return (
    <DashboardLayout portalMode="follower" pageTitle="Portfolio Overview">
      <FollowerDashboard
        vaults={vaults}
        userPositions={userPositions}
        activeSubPage="portfolio"
        onDeposit={deposit}
        onWithdraw={withdraw}
        onViewCurator={(vaultId) => router.push(`/curator/${vaultId}`)}
        onNavigateToExplore={() => router.push("/follower/explore")}
        onNavigateToLeaderboard={() => router.push("/leaderboard")}
        onNavigateToStudio={() => router.push("/curator/overview")}
      />
    </DashboardLayout>
  );
}
