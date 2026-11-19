"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { VaultData, UserPosition, RangePosition, ReactiveSafetyAction } from "../types/cadra";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal, useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";

interface CadraContextType {
  vaults: VaultData[];
  userPositions: Record<number, UserPosition>;
  reactiveSafetyFeed: ReactiveSafetyAction[];
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
  addSafetyEvent: (event: ReactiveSafetyAction) => void;
  seedArchetypes: () => void;
  resetDemo: () => void;
}

const CadraContext = createContext<CadraContextType | null>(null);

export function CadraProvider({ children }: { children: React.ReactNode }) {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [userPositions, setUserPositions] = useState<Record<number, UserPosition>>({});
  const [activeRole, setActiveRoleState] = useState<"follower" | "curator">("follower");

  const [reactiveSafetyFeed, setReactiveSafetyFeed] = useState<ReactiveSafetyAction[]>([
    {
      id: "sec-1",
      timestamp: Date.now() - 1000 * 60 * 3,
      timeFormatted: "3 mins ago",
      type: "rule_guard",
      vaultId: 4,
      vaultName: "Reckless Degens",
      latencySeconds: 1.1,
      originChain: "Unichain Sepolia",
      originTxHash: "0x8f2a11b93cd04918e77a164c8d50bf229ea4c31b",
      reactiveTxHash: "0x4e1973b06aa15d9098bc19ff64de301a9b90211a",
      callbackTxHash: "0x1c8842e05cb627d31289fe129845aa23e5f012aa",
      summary: "Rule Guard Triggered (1.1s)",
      details: "Price drifted out of corridor. Shortfall exceeded 3.0% mandate limit. CadraReactive called enforce() in 1.1s. Vault parked in full-range Pace; curator frozen.",
    },
    {
      id: "sec-2",
      timestamp: Date.now() - 1000 * 60 * 14,
      timeFormatted: "14 mins ago",
      type: "shock_guard",
      vaultId: 1,
      vaultName: "Alpha Dynamic Corridor",
      latencySeconds: 0.8,
      originChain: "Base Sepolia",
      originTxHash: "0xd201994af809b17764e528ac1209b550187a44ee",
      reactiveTxHash: "0x7b11568472bb5108bc09de4568019aa698aef01b",
      callbackTxHash: "0x55ef901844bc6019ea451009bf229aa7882199ac",
      summary: "Shock Guard Triggered (0.8s)",
      details: "ETH moved -2.4% within 38s in Base Sepolia ETH/USDC pool. CadraReactive called shield() on Unichain in 0.8s before cross-chain arbitrage reached pool.",
    },
    {
      id: "sec-3",
      timestamp: Date.now() - 1000 * 60 * 35,
      timeFormatted: "35 mins ago",
      type: "settlement",
      vaultId: 1,
      vaultName: "Alpha Dynamic Corridor",
      latencySeconds: 0.9,
      originChain: "Unichain Sepolia",
      originTxHash: "0x99ea118475cd0091aa45829b71009e5518b209fa",
      reactiveTxHash: "0x331089fb457812bc90019958ee2459ab1145bc09",
      callbackTxHash: "0x77ab450918ef9910acb78912aa4510098f99014b",
      summary: "Epoch #2 Settled (0.9s)",
      details: "Epoch duration elapsed. Vault value $30,000 vs Pace $29,200 (+ $800 alpha). 20% performance fee ($160) minted to curator. Capacity multiplier expanded to 5x.",
    },
  ]);

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

  // Automatic role resolution on wallet change
  useEffect(() => {
    if (!connectedAddress) return;
    const lower = connectedAddress.toLowerCase();
    const isCuratorOfVault = vaults.some((v) => v.curatorAddress.toLowerCase() === lower);
    const hasFollowerPositions = Object.values(userPositions).some((p) => p.shares > 0 || p.depositedAmount > 0);

    if (isCuratorOfVault && !hasFollowerPositions) {
      setActiveRoleState("curator");
    } else if (hasFollowerPositions && !isCuratorOfVault) {
      setActiveRoleState("follower");
    }
  }, [connectedAddress, vaults, userPositions]);

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

  const addSafetyEvent = (event: ReactiveSafetyAction) => {
    setReactiveSafetyFeed((prev) => [event, ...prev.slice(0, 19)]);
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
        feesPaid: userPositions[vaultId]?.feesPaid || 0,
        bondPayoutsReceived: userPositions[vaultId]?.bondPayoutsReceived || 0,
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
    const updated = vaults.map((v) => (v.id === vaultId ? { ...v, isParked: true, bandLeft: true, timesParked: v.timesParked + 1 } : v));
    saveVaults(updated);

    const targetVault = vaults.find((v) => v.id === vaultId);
    addSafetyEvent({
      id: `sec-${Date.now()}`,
      timestamp: Date.now(),
      timeFormatted: "Just now",
      type: "rule_guard",
      vaultId,
      vaultName: targetVault?.name || `Vault #${vaultId}`,
      latencySeconds: 1.1,
      originChain: "Unichain Sepolia",
      originTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      reactiveTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      callbackTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      summary: "Rule Guard Triggered (1.1s)",
      details: `Shortfall exceeded mandate threshold. CadraReactive executed enforce() in 1.1s. Capital parked into The Pace; curator frozen.`,
    });
  };

  const triggerSettle = (vaultId: number, simulatedGapUsdc: number) => {
    const updated = vaults.map((v) => {
      if (v.id !== vaultId) return v;
      const isAhead = simulatedGapUsdc >= 0;
      let newBond = v.bondAmount;
      let newDeficit = v.carriedDeficit;
      let feeOrPayout = 0;
      let newMultiplier = v.capacityMultiplier;

      if (isAhead) {
        // Recover deficit first
        const recovered = Math.min(newDeficit, simulatedGapUsdc);
        newDeficit -= recovered;
        const excess = simulatedGapUsdc - recovered;
        feeOrPayout = (excess * v.perfFeeBps) / 10000;
        newMultiplier = Math.min(20, newMultiplier + 1);
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
        newMultiplier = Math.max(2, newMultiplier - 2);
      }

      return {
        ...v,
        bondAmount: newBond,
        capacityMultiplier: newMultiplier,
        capacity: newBond * newMultiplier,
        carriedDeficit: newDeficit,
        epoch: v.epoch + 1,
        epochStart: Math.floor(Date.now() / 1000),
        isParked: false,
        bandLeft: false,
        history: [
          ...v.history,
          {
            epoch: v.epoch,
            vaultValue: v.vaultValue,
            paceValue: v.paceValue,
            gap: simulatedGapUsdc,
            outcome: isAhead ? ("ahead" as const) : ("behind" as const),
            feeOrPayout,
            multiplierAfter: newMultiplier,
            carriedDeficitAfter: newDeficit,
          },
        ],
      };
    });
    saveVaults(updated);

    const targetVault = vaults.find((v) => v.id === vaultId);
    addSafetyEvent({
      id: `sec-${Date.now()}`,
      timestamp: Date.now(),
      timeFormatted: "Just now",
      type: "settlement",
      vaultId,
      vaultName: targetVault?.name || `Vault #${vaultId}`,
      latencySeconds: 0.9,
      originChain: "Unichain Sepolia",
      originTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      reactiveTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      callbackTxHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      summary: `Epoch Settled (${simulatedGapUsdc >= 0 ? "Ahead" : "Behind"}) in 0.9s`,
      details: `${simulatedGapUsdc >= 0 ? "Curator beat the Pace. 20% fee minted to curator." : "Curator fell behind. Bond reimbursed followers."} CadraReactive processed settlement at TWAP rate.`,
    });
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
        curatorOwnershipBps: 1500, // 15% curator skin in the game
        currentShortfallBps: 0, // currently ahead by $2,800
        timesParked: 0,
        timesShielded: 1,
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
            multiplierAfter: 5,
            carriedDeficitAfter: 0,
          },
          {
            epoch: 2,
            vaultValue: 30000,
            paceValue: 29200,
            gap: 800,
            outcome: "ahead",
            feeOrPayout: 160,
            multiplierAfter: 6,
            carriedDeficitAfter: 0,
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
        curatorOwnershipBps: 2000, // 20% curator skin in the game
        currentShortfallBps: 0,
        timesParked: 0,
        timesShielded: 0,
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
            multiplierAfter: 10,
            carriedDeficitAfter: 0,
          },
        ],
      },
      {
        id: 3,
        name: "Passive Index Track",
        curatorAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        tag: "Passive Strategy",
        description: "Static corridors without rebalances; illustrates benchmark tracking.",
        perfFeeBps: 1000,
        bondAmount: 15000,
        capacity: 60000,
        capacityMultiplier: 4,
        totalFollowerValue: 42000,
        followerShares: 42000,
        paceValue: 45000,
        vaultValue: 43200,
        carriedDeficit: 0,
        curatorOwnershipBps: 1000, // 10%
        currentShortfallBps: 400, // 4.0% shortfall vs 6% allowed
        timesParked: 0,
        timesShielded: 0,
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
            multiplierAfter: 4,
            carriedDeficitAfter: 0,
          },
        ],
      },
      {
        id: 4,
        name: "Reckless Degens",
        curatorAddress: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be03",
        tag: "High Risk Mandate Test",
        description: "Razor-thin corridor vulnerable to TWAP shortfall and emergency parking.",
        perfFeeBps: 3000,
        bondAmount: 10000,
        capacity: 20000,
        capacityMultiplier: 2,
        totalFollowerValue: 18000,
        followerShares: 18000,
        paceValue: 20000,
        vaultValue: 18900,
        carriedDeficit: 0,
        curatorOwnershipBps: 500, // 5%
        currentShortfallBps: 550, // 5.5% shortfall (exceeds 3.0% cap!)
        timesParked: 1,
        timesShielded: 0,
        epoch: 2,
        epochStart: Math.floor(Date.now() / 1000) - 400,
        epochDuration: 3600,
        isParked: true, // Parked by CadraReactive rule guard
        bandLeft: true,
        mandate: {
          minTick: -58000,
          maxTick: -57000,
          minPrice: 3050,
          maxPrice: 3180,
          maxConcentrationBps: 8000,
          minRangeWidth: 60,
          maxShortfallBps: 300, // 3% parking limit
        },
        activeRanges: [
          {
            id: "r1",
            lowerTick: -57500,
            upperTick: -57400,
            lowerPrice: 3080,
            upperPrice: 3120,
            liquidityPercent: 100,
          },
        ],
        history: [
          {
            epoch: 1,
            vaultValue: 20000,
            paceValue: 20000,
            gap: 0,
            outcome: "ahead",
            feeOrPayout: 0,
            multiplierAfter: 2,
            carriedDeficitAfter: 0,
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
        feesPaid: 260,
        bondPayoutsReceived: 0,
      },
      2: {
        vaultId: 2,
        depositedAmount: 10000,
        currentValue: 10133,
        paceEquivalent: 10000,
        shares: 10000,
        pendingDeposit: 0,
        pendingWithdraw: 0,
        feesPaid: 150,
        bondPayoutsReceived: 0,
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
        reactiveSafetyFeed,
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
        addSafetyEvent,
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
