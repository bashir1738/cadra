"use client";

import React from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorStudio } from "../../../components/CuratorStudio";
import { useCadra } from "../../../context/CadraContext";

export default function CuratorOverviewPage() {
  const {
    vaults,
    connectedAddress,
    createVault,
    updateRanges,
    postBond,
    proposeMandate,
  } = useCadra();

  const currentCuratorVault = vaults[0];

  return (
    <DashboardLayout portalMode="curator" pageTitle="Vault Overview">
      <CuratorStudio
        vault={currentCuratorVault}
        activeSubPage="overview"
        connectedAddress={connectedAddress}
        onCreateVault={createVault}
        onUpdateRanges={updateRanges}
        onPostBond={postBond}
        onProposeMandate={proposeMandate}
      />
    </DashboardLayout>
  );
}
