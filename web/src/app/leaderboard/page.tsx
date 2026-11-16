"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Leaderboard } from "../../components/Leaderboard";
import { useCadra } from "../../context/CadraContext";

export default function LeaderboardPage() {
  const router = useRouter();
  const { vaults, deposit, activeRole } = useCadra();

  const handleFollow = (vaultId: number) => {
    deposit(vaultId, 1000);
    router.push("/follower/portfolio");
  };

  return (
    <DashboardLayout portalMode={activeRole} pageTitle="Curator Leaderboard" breadcrumb="Rankings">
      <Leaderboard
        vaults={vaults}
        onSelectCurator={(vaultId) => router.push(`/curator/${vaultId}`)}
        onFollowCurator={handleFollow}
        onOpenCuratorStudio={() => router.push("/curator/overview")}
      />
    </DashboardLayout>
  );
}
