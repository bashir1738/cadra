"use client";

import React, { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { CuratorProfile } from "../../../components/CuratorProfile";
import { useCadra } from "../../../context/CadraContext";

function CuratorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { vaults, deposit } = useCadra();

  const vaultId = params?.id ? parseInt(params.id as string, 10) : NaN;
  const vault = vaults.find((v) => v.id === vaultId);

  const handleFollow = (id: number) => {
    deposit(id, 1000);
    router.push("/follower/portfolio");
  };

  if (!vault) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Curator Vault Not Found</h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          The requested curator vault could not be found. It may not be deployed yet or the ID is invalid.
        </p>
        <button
          onClick={() => router.push("/follower/explore")}
          className="px-5 py-2.5 rounded-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer"
        >
          Explore Active Curators
        </button>
      </div>
    );
  }

  return (
    <CuratorProfile
      vault={vault}
      onBack={() => router.back()}
      onFollow={handleFollow}
    />
  );
}

export default function CuratorDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 p-12 text-center text-neutral-500 text-sm">
          Loading curator profile...
        </div>
      }
    >
      <DashboardLayout portalMode="follower" pageTitle="Curator Profile" breadcrumb="Curators">
        <CuratorDetailContent />
      </DashboardLayout>
    </Suspense>
  );
}
