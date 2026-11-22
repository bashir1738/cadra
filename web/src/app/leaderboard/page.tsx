"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Leaderboard } from "../../components/Leaderboard";
import { useCadra } from "../../context/CadraContext";

export default function LeaderboardPage() {
  const router = useRouter();
  const { vaults, activeRole } = useCadra();

  const handleFollow = (vaultId: number) => {
    router.push("/follower/explore");
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
