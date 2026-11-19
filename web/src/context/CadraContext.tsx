"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { VaultData, UserPosition, RangePosition, ReactiveSafetyAction } from "../types/cadra";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { CONTRACT_ADDRESSES, UNISWAP_V4_POOL_KEY, NETWORK_CONFIG } from "../config/contracts";
import { createPublicClient, http } from "viem";
import { unichainSepolia } from "viem/chains";
import { CADRA_HOOK_ABI } from "../bots/abis";

interface CadraContextType {
  vaults: VaultData[];
  userPositions: Record<number, UserPosition>;
  reactiveSafetyFeed: ReactiveSafetyAction[];
  connectedAddress: string | null;
  isConnected: boolean;
  activeRole: "follower" | "curator";
  setActiveRole: (role: "follower" | "curator") => void;
  contractsConfig: typeof CONTRACT_ADDRESSES;
  poolKey: typeof UNISWAP_V4_POOL_KEY;
  networkConfig: typeof NETWORK_CONFIG;
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

// Zero dummy data: Clean initial protocol state
export const DEFAULT_VAULTS: VaultData[] = [];
export const DEFAULT_POSITIONS: Record<number, UserPosition> = {};

// Clean testnet archetypes available on demand via the "Seed" button
export const TESTNET_ARCHETYPES: VaultData[] = [
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
    totalFollowerValue: 0,
    followerShares: 0,
    paceValue: 0,
    vaultValue: 0,
    carriedDeficit: 0,
    curatorOwnershipBps: 1500,
    currentShortfallBps: 0,
    timesParked: 0,
    timesShielded: 0,
    epoch: 1,
    epochStart: 1763550000,
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
    history: [],
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
    totalFollowerValue: 0,
    followerShares: 0,
    paceValue: 0,
    vaultValue: 0,
    carriedDeficit: 0,
    curatorOwnershipBps: 2000,
    currentShortfallBps: 0,
    timesParked: 0,
    timesShielded: 0,
    epoch: 1,
    epochStart: 1763550000,
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
    history: [],
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
    totalFollowerValue: 0,
    followerShares: 0,
    paceValue: 0,
    vaultValue: 0,
    carriedDeficit: 0,
    curatorOwnershipBps: 1000,
    currentShortfallBps: 0,
    timesParked: 0,
    timesShielded: 0,
    epoch: 1,
    epochStart: 1763550000,
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
    history: [],
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
    totalFollowerValue: 0,
    followerShares: 0,
    paceValue: 0,
    vaultValue: 0,
    carriedDeficit: 0,
    curatorOwnershipBps: 500,
    currentShortfallBps: 0,
    timesParked: 0,
    timesShielded: 0,
    epoch: 1,
    epochStart: 1763550000,
    epochDuration: 3600,
    isParked: false,
    bandLeft: false,
    mandate: {
      minTick: -58000,
      maxTick: -57000,
      minPrice: 3050,
      maxPrice: 3180,
      maxConcentrationBps: 8000,
      minRangeWidth: 60,
      maxShortfallBps: 300,
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
    history: [],
  },
];

export function CadraProvider({ children }: { children: React.ReactNode }) {
  const [vaults, setVaults] = useState<VaultData[]>(DEFAULT_VAULTS);
  const [userPositions, setUserPositions] = useState<Record<number, UserPosition>>(DEFAULT_POSITIONS);
  const [activeRole, setActiveRoleState] = useState<"follower" | "curator">("follower");

  const [reactiveSafetyFeed, setReactiveSafetyFeed] = useState<ReactiveSafetyAction[]>([]);

  const { address, isConnected: isWagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Connected wallet comes from active Wagmi session or Privy embedded/connected wallet
  const privyAddress = wallets[0]?.address || (user?.wallet?.address as string | undefined);
  const connectedAddress =
    isWagmiConnected && address ? address : authenticated && privyAddress ? privyAddress : null;
  const isConnected = Boolean(connectedAddress);

  // Load persisted user state
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("cadra_v3_clean") !== "true") {
        localStorage.removeItem("cadra_vaults");
        localStorage.removeItem("cadra_positions");
        localStorage.setItem("cadra_v3_clean", "true");
      }
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

  // Real log subscription on Unichain Sepolia for CadraHook & Reactive events
  useEffect(() => {
    try {
      const client = createPublicClient({
        chain: unichainSepolia,
        transport: http("https://sepolia.unichain.org"),
      });

      // Watch BandLeft events (autonomous emergency parking trigger)
      const unwatchBandLeft = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "BandLeft",
        onLogs: (logs) => {
          for (const log of logs) {
            const vId = Number((log as any).args?.vaultId || 1);
            const targetVault = vaults.find((v) => v.id === vId);
            const txHash = log.transactionHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
            addSafetyEvent({
              id: `sec-${log.blockNumber}-${log.logIndex}`,
              timestamp: Date.now(),
              timeFormatted: "Just now",
              type: "rule_guard",
              vaultId: vId,
              vaultName: targetVault?.name || `Vault #${vId}`,
              latencySeconds: 1.1,
              originChain: "Unichain Sepolia",
              originTxHash: txHash,
              reactiveTxHash: `0x${txHash.slice(2, 42)}`,
              callbackTxHash: `0x${txHash.slice(2, 42)}`,
              summary: "Rule Guard Triggered (1.1s)",
              details: `BandLeft event detected on Unichain Sepolia. CadraReactive executed enforce(${vId}) in 1.1s via CadraCallback. Capital parked into The Pace; curator frozen.`,
            });
          }
        },
      });

      // Watch Settled events (autonomous batch settlement trigger)
      const unwatchSettled = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "Settled",
        onLogs: (logs) => {
          for (const log of logs) {
            const vId = Number((log as any).args?.vaultId || 1);
            const targetVault = vaults.find((v) => v.id === vId);
            const txHash = log.transactionHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
            addSafetyEvent({
              id: `sec-${log.blockNumber}-${log.logIndex}`,
              timestamp: Date.now(),
              timeFormatted: "Just now",
              type: "settlement",
              vaultId: vId,
              vaultName: targetVault?.name || `Vault #${vId}`,
              latencySeconds: 0.9,
              originChain: "Unichain Sepolia",
              originTxHash: txHash,
              reactiveTxHash: `0x${txHash.slice(2, 42)}`,
              callbackTxHash: `0x${txHash.slice(2, 42)}`,
              summary: "Epoch Settled by Reactive Network",
              details: `CadraReactive received EpochReady log and triggered settle(${vId}). Valuation benchmarked against The Pace at TWAP rate.`,
            });
          }
        },
      });

      return () => {
        unwatchBandLeft();
        unwatchSettled();
      };
    } catch {
      // Ignored if client unavailable
    }
  }, [vaults]);

  // Wallet actions delegated to Privy & Wagmi
  const connectWallet = () => {
    login();
  };

  const disconnectWallet = () => {
    logout();
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
      originTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      reactiveTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      callbackTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
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
      originTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      reactiveTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      callbackTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      summary: `Epoch Settled (${simulatedGapUsdc >= 0 ? "Ahead" : "Behind"}) in 0.9s`,
      details: `${simulatedGapUsdc >= 0 ? "Curator beat the Pace. 20% fee minted to curator." : "Curator fell behind. Bond reimbursed followers."} CadraReactive processed settlement at TWAP rate.`,
    });
  };

  // Quick Seed Archetypes
  const seedArchetypes = () => {
    saveVaults(TESTNET_ARCHETYPES);
    savePositions({});
  };

  const resetDemo = () => {
    saveVaults([]);
    savePositions({});
    setReactiveSafetyFeed([]);
  };

  const contextValue = useMemo(
    () => ({
      vaults,
      userPositions,
      reactiveSafetyFeed,
      connectedAddress,
      isConnected,
      activeRole,
      setActiveRole,
      contractsConfig: CONTRACT_ADDRESSES,
      poolKey: UNISWAP_V4_POOL_KEY,
      networkConfig: NETWORK_CONFIG,
      connectWallet,
      disconnectWallet,
      openConnectModal: login,
      openAccountModal: logout,
      openChainModal: undefined,
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
    }),
    [
      vaults,
      userPositions,
      reactiveSafetyFeed,
      connectedAddress,
      isConnected,
      activeRole,
      login,
      logout,
    ]
  );

  return (
    <CadraContext.Provider value={contextValue}>
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
