"use client";

import React from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { LiveSimulator } from "../../components/LiveSimulator";
import { useCadra } from "../../context/CadraContext";

export default function SimulatorPage() {
  const { vaults, triggerEnforce, triggerSettle, resetDemo, activeRole } = useCadra();

  return (
    <DashboardLayout portalMode={activeRole} pageTitle="Mechanism Playground" breadcrumb="Simulate">
      <LiveSimulator
        vaults={vaults}
        onTriggerEnforce={triggerEnforce}
        onTriggerSettle={triggerSettle}
        onResetDemo={resetDemo}
      />
    </DashboardLayout>
  );
}
