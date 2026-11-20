"use client";

import React from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorStudio } from "../../../components/CuratorStudio";
import { useCadra } from "../../../context/CadraContext";

export default function CuratorRebalancePage() {
  const {
    vaults,
    connectedAddress,
    createVault,
    updateRanges,
    postBond,
    proposeMandate,
  } = useCadra();

  return (
    <DashboardLayout portalMode="curator" pageTitle="Range Rebalancer">
      <CuratorStudio
        allVaults={vaults}
        activeSubPage="rebalance"
        connectedAddress={connectedAddress}
        onCreateVault={createVault}
        onUpdateRanges={updateRanges}
        onPostBond={postBond}
        onProposeMandate={proposeMandate}
      />
    </DashboardLayout>
  );
}
