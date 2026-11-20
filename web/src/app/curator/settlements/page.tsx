"use client";

import React from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorStudio } from "../../../components/CuratorStudio";
import { useCadra } from "../../../context/CadraContext";

export default function CuratorSettlementsPage() {
  const {
    vaults,
    connectedAddress,
    createVault,
    updateRanges,
    postBond,
    proposeMandate,
  } = useCadra();

  return (
    <DashboardLayout portalMode="curator" pageTitle="Settlements & Fees">
      <CuratorStudio
        allVaults={vaults}
        activeSubPage="settlements"
        connectedAddress={connectedAddress}
        onCreateVault={createVault}
        onUpdateRanges={updateRanges}
        onPostBond={postBond}
        onProposeMandate={proposeMandate}
      />
    </DashboardLayout>
  );
}
