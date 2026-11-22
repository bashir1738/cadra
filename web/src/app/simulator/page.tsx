"use client";

import React from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { LiveSimulator } from "../../components/LiveSimulator";
import { useCadra } from "../../context/CadraContext";

export default function SimulatorPage() {
  const {
    vaults,
    triggerEnforce,
    triggerSettle,
    updateRanges,
    seedArchetypes,
    resetDemo,
    activeRole,
  } = useCadra();

  return (
    <DashboardLayout
      portalMode={activeRole}
      pageTitle="Demo Sandbox"
      breadcrumb="Hackathon Playground"
    >
      <LiveSimulator
        vaults={vaults}
        onTriggerEnforce={triggerEnforce}
        onTriggerSettle={triggerSettle}
        onUpdateRanges={updateRanges}
        onSeedArchetypes={seedArchetypes}
        onResetDemo={resetDemo}
      />
    </DashboardLayout>
  );
}
