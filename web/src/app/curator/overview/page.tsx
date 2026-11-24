"use client";

import React from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorStudio } from "../../../components/CuratorStudio";
import { useCadra } from "../../../context/CadraContext";
import { ReactiveOperations } from "../../../components/ReactiveOperations";

export default function CuratorOverviewPage() {
  const {
    vaults,
    connectedAddress,
    createVault,
    updateRanges,
    postBond,
    proposeMandate,
  } = useCadra();

  return (
    <DashboardLayout portalMode="curator" pageTitle="Vault Overview">
      <CuratorStudio
        allVaults={vaults}
        activeSubPage="overview"
        connectedAddress={connectedAddress}
        onCreateVault={createVault}
        onUpdateRanges={updateRanges}
        onPostBond={postBond}
        onProposeMandate={proposeMandate}
      />
      <ReactiveOperations />
    </DashboardLayout>
  );
}
