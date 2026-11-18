"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { VaultData, UserPosition, RangePosition } from "../types/cadra";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal, useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";

interface CadraContextType {
  vaults: VaultData[];
  userPositions: Record<number, UserPosition>;
  connectedAddress: string | null;
  isConnected: boolean;
  activeRole: "follower" | "curator";
  setActiveRole: (role: "follower" | "curator") => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  openConnectModal?: () => void;
  openAccountModal?: () => void;
  openChainModal?: () => void;
  deposit: (vaultId: number, amount: number) => void;
  withdraw: (vaultId: number, shares: number) => void;
  createVault: (newVault: VaultData) => void;
  updateRanges: (vaultId: number, newRanges: RangePosition[]) => void;
  postBond: (vaultId: number, amount: number) => void;
  proposeMandate: (vaultId: number, mandate: VaultData["mandate"]) => void;
  triggerEnforce: (vaultId: number) => void;
  triggerSettle: (vaultId: number, simulatedGapUsdc: number) => void;
  seedArchetypes: () => void;
  resetDemo: () => void;
}

const CadraContext = createContext<CadraContextType | null>(null);

export function CadraProvider({ children }: { children: React.ReactNode }) {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [userPositions, setUserPositions] = useState<Record<number, UserPosition>>({});
  const [activeRole, setActiveRoleState] = useState<"follower" | "curator">("follower");

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  // Connected wallet strictly comes from the active RainbowKit / Wagmi session
  const connectedAddress = isConnected && address ? address : null;

  // Load persisted user state
  useEffect(() => {
    try {
      const savedVaults = localStorage.getItem("cadra_vaults");
      if (savedVaults) {
        setVaults(JSON.parse(savedVaults));
      }
      const savedPositions = localStorage.getItem("cadra_positions");
      if (savedPositions) {
        setUserPositions(JSON.parse(savedPositions));
      }
      const savedRole = localStorage.getItem("cadra_role") as "follower" | "curator" | null;
      if (savedRole === "follower" || savedRole === "curator") {
        setActiveRoleState(savedRole);
      }
    } catch {
      // Storage access ignored
    }
  }, []);

  const setActiveRole = (role: "follower" | "curator") => {
    setActiveRoleState(role);
    try {
      localStorage.setItem("cadra_role", role);
    } catch {}
  };

  const saveVaults = (updatedVaults: VaultData[]) => {
    setVaults(updatedVaults);
    try {
      localStorage.setItem("cadra_vaults", JSON.stringify(updatedVaults));
    } catch {}
  };

  const savePositions = (updatedPositions: Record<number, UserPosition>) => {
    setUserPositions(updatedPositions);
    try {
      localStorage.setItem("cadra_positions", JSON.stringify(updatedPositions));
    } catch {}
  };

  // Wallet actions strictly delegated to RainbowKit / Wagmi
  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  // Follower actions
  const deposit = (vaultId: number, amount: number) => {
    const updated = {
      ...userPositions,
      [vaultId]: {
        vaultId,
        depositedAmount: (userPositions[vaultId]?.depositedAmount || 0) + amount,
        currentValue: (userPositions[vaultId]?.currentValue || 0) + amount,
        paceEquivalent: (userPositions[vaultId]?.paceEquivalent || 0) + amount,
        shares: (userPositions[vaultId]?.shares || 0) + amount,
        pendingDeposit: (userPositions[vaultId]?.pendingDeposit || 0) + amount,
        pendingWithdraw: userPositions[vaultId]?.pendingWithdraw || 0,
      },
    };
    savePositions(updated);

    const updatedVaults = vaults.map((v) => {
      if (v.id !== vaultId) return v;
      return {
        ...v,
        totalFollowerValue: v.totalFollowerValue + amount,
        followerShares: v.followerShares + amount,
        vaultValue: v.vaultValue + amount,
        paceValue: v.paceValue + amount,
      };
    });
    saveVaults(updatedVaults);
  };

  const withdraw = (vaultId: number, shares: number) => {
    const existing = userPositions[vaultId];
    if (!existing) return;
    const updated = {
      ...userPositions,
      [vaultId]: {
        ...existing,
        pendingWithdraw: existing.pendingWithdraw + shares,
      },
    };
    savePositions(updated);
  };

  // Curator actions
  const createVault = (newVault: VaultData) => {
    const updated = [...vaults, newVault];
    saveVaults(updated);
  };

  const updateRanges = (vaultId: number, newRanges: RangePosition[]) => {
    const updated = vaults.map((v) => (v.id === vaultId ? { ...v, activeRanges: newRanges } : v));
    saveVaults(updated);
  };

  const postBond = (vaultId: number, amount: number) => {
    const updated = vaults.map((v) => {
      if (v.id !== vaultId) return v;
      const newBond = v.bondAmount + amount;
      return {
        ...v,
        bondAmount: newBond,
        capacity: newBond * v.capacityMultiplier,
      };
    });
    saveVaults(updated);
  };

  const proposeMandate = (vaultId: number, mandate: VaultData["mandate"]) => {
    const updated = vaults.map((v) => (v.id === vaultId ? { ...v, mandate } : v));
    saveVaults(updated);
  };

  // Simulator actions
  const triggerEnforce = (vaultId: number) => {
    const updated = vaults.map((v) => (v.id === vaultId ? { ...v, isParked: true, bandLeft: true } : v));
    saveVaults(updated);
  };

  const triggerSettle = (vaultId: number, simulatedGapUsdc: number) => {
    const updated = vaults.map((v) => {
      if (v.id !== vaultId) return v;
      const isAhead = simulatedGapUsdc >= 0;
      let newBond = v.bondAmount;
      let newDeficit = v.carriedDeficit;
      let feeOrPayout = 0;

      if (isAhead) {
        feeOrPayout = (simulatedGapUsdc * v.perfFeeBps) / 10000;
      } else {
        const shortfall = Math.abs(simulatedGapUsdc);
        if (shortfall <= v.bondAmount) {
          newBond -= shortfall;
          feeOrPayout = shortfall;
        } else {
          feeOrPayout = v.bondAmount;
          newDeficit += shortfall - v.bondAmount;
          newBond = 0;
        }
      }

      return {
        ...v,
        bondAmount: newBond,
        capacity: newBond * v.capacityMultiplier,
        carriedDeficit: newDeficit,
        epoch: v.epoch + 1,
        epochStart: Math.floor(Date.now() / 1000),
        history: [
          ...v.history,
          {
            epoch: v.epoch,
            vaultValue: v.vaultValue,
            paceValue: v.paceValue,
            gap: simulatedGapUsdc,
            outcome: isAhead ? ("ahead" as const) : ("behind" as const),
            feeOrPayout,
          },
        ],
      };
    });
    saveVaults(updated);
  };

  // Quick Seed Archetypes
  const seedArchetypes = () => {
    const archetypes: VaultData[] = [
      {
        id: 1,
        name: "Alpha Dynamic Corridor",
        curatorAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        tag: "Tight Range Active",
        description: "Dynamic concentrated rebalancing within tight ETH price corridor.",
        perfFeeBps: 2000,
        bondAmount: 10000,
        capacity: 50000,
        capacityMultiplier: 5,
        totalFollowerValue: 35000,
        followerShares: 35000,
        paceValue: 35000,
        vaultValue: 37800,
        carriedDeficit: 0,
        epoch: 3,
        epochStart: Math.floor(Date.now() / 1000) - 1800,
        epochDuration: 3600,
        isParked: false,
        bandLeft: false,
        mandate: {
          minTick: -69060,
          maxTick: -46080,
          minPrice: 2400,
          maxPrice: 3600,
          maxConcentrationBps: 5000,
          minRangeWidth: 200,
          maxShortfallBps: 500,
        },
        activeRanges: [
          {
            id: "r1",
            lowerTick: -62160,
            upperTick: -58020,
            lowerPrice: 3000,
            upperPrice: 3250,
            liquidityPercent: 60,
          },
          {
            id: "r2",
            lowerTick: -64440,
            upperTick: -56400,
            lowerPrice: 2850,
            upperPrice: 3400,
            liquidityPercent: 40,
          },
        ],
        history: [
          {
            epoch: 1,
            vaultValue: 20000,
            paceValue: 19500,
            gap: 500,
            outcome: "ahead",
            feeOrPayout: 100,
          },
          {
            epoch: 2,
            vaultValue: 30000,
            paceValue: 29200,
            gap: 800,
            outcome: "ahead",
            feeOrPayout: 160,
          },
        ],
      },
      {
        id: 2,
        name: "Defensive Wide Perimeter",
        curatorAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        tag: "Wide Range Defensive",
        description: "Low-turnover conservative buffer capturing broad pool volume.",
        perfFeeBps: 1500,
        bondAmount: 25000,
        capacity: 250000,
        capacityMultiplier: 10,
        totalFollowerValue: 180000,
        followerShares: 180000,
        paceValue: 180000,
        vaultValue: 182400,
        carriedDeficit: 0,
        epoch: 8,
        epochStart: Math.floor(Date.now() / 1000) - 2400,
        epochDuration: 3600,
        isParked: false,
        bandLeft: false,
        mandate: {
          minTick: -80000,
          maxTick: -35000,
          minPrice: 2000,
          maxPrice: 4200,
          maxConcentrationBps: 3000,
          minRangeWidth: 500,
          maxShortfallBps: 300,
        },
        activeRanges: [
          {
            id: "r1",
            lowerTick: -75000,
            upperTick: -40000,
            lowerPrice: 2200,
            upperPrice: 3900,
            liquidityPercent: 100,
          },
        ],
        history: [
          {
            epoch: 7,
            vaultValue: 150000,
            paceValue: 149000,
            gap: 1000,
            outcome: "ahead",
            feeOrPayout: 150,
          },
        ],
      },
      {
        id: 3,
        name: "Momentum Breakout Vault",
        curatorAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        tag: "Volatile Aggressive",
        description: "Asymmetric upper-band allocation capturing upward volatility runs.",
        perfFeeBps: 2500,
        bondAmount: 15000,
        capacity: 60000,
        capacityMultiplier: 4,
        totalFollowerValue: 42000,
        followerShares: 42000,
        paceValue: 45000,
        vaultValue: 43200,
        carriedDeficit: 0,
        epoch: 4,
        epochStart: Math.floor(Date.now() / 1000) - 900,
        epochDuration: 3600,
        isParked: false,
        bandLeft: false,
        mandate: {
          minTick: -65000,
          maxTick: -42000,
          minPrice: 2600,
          maxPrice: 3800,
          maxConcentrationBps: 6000,
          minRangeWidth: 150,
          maxShortfallBps: 600,
        },
        activeRanges: [
          {
            id: "r1",
            lowerTick: -60000,
            upperTick: -50000,
            lowerPrice: 3100,
            upperPrice: 3500,
            liquidityPercent: 80,
          },
          {
            id: "r2",
            lowerTick: -64000,
            upperTick: -48000,
            lowerPrice: 2800,
            upperPrice: 3650,
            liquidityPercent: 20,
          },
        ],
        history: [
          {
            epoch: 3,
            vaultValue: 40000,
            paceValue: 41200,
            gap: -1200,
            outcome: "behind",
            feeOrPayout: 1200,
          },
        ],
      },
    ];

    saveVaults(archetypes);

    const initialPositions: Record<number, UserPosition> = {
      1: {
        vaultId: 1,
        depositedAmount: 5000,
        currentValue: 5400,
        paceEquivalent: 5000,
        shares: 5000,
        pendingDeposit: 0,
        pendingWithdraw: 0,
      },
      2: {
        vaultId: 2,
        depositedAmount: 10000,
        currentValue: 10133,
        paceEquivalent: 10000,
        shares: 10000,
        pendingDeposit: 0,
        pendingWithdraw: 0,
      },
    };
    savePositions(initialPositions);
  };

  const resetDemo = () => {
    saveVaults([]);
    savePositions({});
  };

  return (
    <CadraContext.Provider
      value={{
        vaults,
        userPositions,
        connectedAddress,
        isConnected,
        activeRole,
        setActiveRole,
        connectWallet,
        disconnectWallet,
        openConnectModal,
        openAccountModal,
        openChainModal,
        deposit,
        withdraw,
        createVault,
        updateRanges,
        postBond,
        proposeMandate,
        triggerEnforce,
        triggerSettle,
        seedArchetypes,
        resetDemo,
      }}
    >
      {children}
    </CadraContext.Provider>
  );
}

export function useCadra() {
  const context = useContext(CadraContext);
  if (!context) {
    throw new Error("useCadra must be used within a CadraProvider");
  }
  return context;
}
