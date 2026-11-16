"use client";

import React from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorStudio } from "../../../components/CuratorStudio";
import { useCadra } from "../../../context/CadraContext";

export default function CuratorMandatePage() {
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
    <DashboardLayout portalMode="curator" pageTitle="Mandate & Rules">
      <CuratorStudio
        vault={currentCuratorVault}
        activeSubPage="mandate"
        connectedAddress={connectedAddress}
        onCreateVault={createVault}
        onUpdateRanges={updateRanges}
        onPostBond={postBond}
        onProposeMandate={proposeMandate}
      />
    </DashboardLayout>
  );
}
