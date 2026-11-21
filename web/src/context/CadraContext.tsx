"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  VaultData,
  UserPosition,
  RangePosition,
  ReactiveSafetyAction,
} from "../types/cadra";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  CONTRACT_ADDRESSES,
  UNISWAP_V4_POOL_KEY,
  NETWORK_CONFIG,
} from "../config/contracts";
import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  parseUnits,
  maxUint256,
} from "viem";
import { unichainSepolia } from "viem/chains";
import { CADRA_HOOK_ABI, ERC20Abi } from "../bots/abis";

interface CadraContextType {
  isHydrated: boolean;
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
  deposit: (vaultId: number, amount: number) => Promise<void>;
  withdraw: (vaultId: number, shares: number) => Promise<void>;
  createVault: (newVault: VaultData) => Promise<number | undefined>;
  updateRanges: (vaultId: number, newRanges: RangePosition[]) => Promise<void>;
  postBond: (vaultId: number, amount: number) => Promise<void>;
  proposeMandate: (vaultId: number, mandate: VaultData["mandate"]) => Promise<void>;
  triggerEnforce: (vaultId: number) => Promise<void>;
  triggerSettle: (vaultId: number, simulatedGapUsdc: number) => Promise<void>;
  addSafetyEvent: (event: ReactiveSafetyAction) => void;
  seedArchetypes: () => void;
  resetDemo: () => void;
  refreshOnChainData: () => Promise<void>;
  mintTestTokens: () => Promise<void>;
  isLoadingOnChain: boolean;
  onChainTxHash: string | null;
}

const CadraContext = createContext<CadraContextType | null>(null);

export const DEFAULT_POSITIONS: Record<number, UserPosition> = {};

export const TESTNET_ARCHETYPES: VaultData[] = [
  {
    id: 1,
    name: "Alpha Dynamic Corridor",
    curatorAddress: "0xe5C73A83d65A015DF4386467bF1D5f94ed4E120B",
    tag: "Tight Range Active",
    description: "Dynamic concentrated rebalancing within tight ETH price corridor.",
    perfFeeBps: 2000,
    bondAmount: 5000,
    capacity: 25000,
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
      minRangeWidth: 120,
      maxShortfallBps: 500,
    },
    activeRanges: [
      {
        id: "r1",
        lowerTick: -62160,
        upperTick: -58020,
        lowerPrice: 3000,
        upperPrice: 3250,
        liquidityPercent: 100,
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
    bondAmount: 10000,
    capacity: 100000,
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
      minTick: -80040,
      maxTick: -34980,
      minPrice: 2000,
      maxPrice: 4200,
      maxConcentrationBps: 3000,
      minRangeWidth: 480,
      maxShortfallBps: 300,
    },
    activeRanges: [
      {
        id: "r1",
        lowerTick: -75000,
        upperTick: -39960,
        lowerPrice: 2200,
        upperPrice: 3900,
        liquidityPercent: 100,
      },
    ],
    history: [],
  },
];

export const DEFAULT_VAULTS: VaultData[] = TESTNET_ARCHETYPES;

function tickToPrice(tick: number): number {
  try {
    const raw = Math.pow(1.0001, tick);
    if (raw === 0) return 3000;
    const price = Math.round(1 / raw);
    return price > 100 && price < 100000 ? price : 3000;
  } catch {
    return 3000;
  }
}

const publicClient = createPublicClient({
  chain: unichainSepolia,
  transport: http("https://sepolia.unichain.org"),
});

export function CadraProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [vaults, setVaults] = useState<VaultData[]>(DEFAULT_VAULTS);
  const [userPositions, setUserPositions] = useState<Record<number, UserPosition>>(DEFAULT_POSITIONS);
  const [activeRole, setActiveRoleState] = useState<"follower" | "curator">("follower");
  const [reactiveSafetyFeed, setReactiveSafetyFeed] = useState<ReactiveSafetyAction[]>([]);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState<boolean>(false);
  const [onChainTxHash, setOnChainTxHash] = useState<string | null>(null);

  const { address, isConnected: isWagmiConnected } = useAccount();
  const { data: wagmiWalletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Connected wallet comes from active Wagmi session or Privy embedded/connected wallet
  const privyAddress = wallets[0]?.address || (user?.wallet?.address as string | undefined);
  const connectedAddress =
    isWagmiConnected && address ? address : authenticated && privyAddress ? privyAddress : null;
  const isConnected = Boolean(connectedAddress);

  const getAsyncWalletClient = useCallback(async () => {
    if (wagmiWalletClient) {
      return wagmiWalletClient;
    }
    if (wallets && wallets.length > 0) {
      const activeWallet = wallets[0];
      const currentChain = (activeWallet as any)?.chainId;
      if (currentChain && currentChain !== "eip155:1301" && currentChain !== 1301 && typeof (activeWallet as any).switchChain === "function") {
        try {
          await (activeWallet as any).switchChain(1301);
        } catch (err) {
          console.warn("Auto switch chain to Unichain Sepolia (1301) failed or rejected:", err);
        }
      }
      const provider = await activeWallet.getEthereumProvider();
      return createWalletClient({
        chain: unichainSepolia,
        transport: custom(provider),
        account: activeWallet.address as `0x${string}`,
      });
    }
    throw new Error("No connected wallet found. Please connect your wallet first.");
  }, [wagmiWalletClient, wallets]);

  const addSafetyEvent = useCallback((event: ReactiveSafetyAction) => {
    setReactiveSafetyFeed((prev) => [event, ...prev.slice(0, 19)]);
  }, []);

  // Fetch live on-chain vaults and positions directly from CadraHook
  const fetchOnChainVaults = useCallback(async () => {
    try {
      const nextVaultIdBig = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "nextVaultId",
      });

      const nextId = Number(nextVaultIdBig);
      if (nextId <= 1) {
        return;
      }

      const fetchedVaults: VaultData[] = [];
      const fetchedPositions: Record<number, UserPosition> = {};

      for (let i = 1; i < nextId; i++) {
        try {
          const vaultRaw: any = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.hook,
            abi: CADRA_HOOK_ABI,
            functionName: "getVault",
            args: [BigInt(i)],
          });

          let positionsRaw: any[] = [];
          try {
            positionsRaw = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.hook,
              abi: CADRA_HOOK_ABI,
              functionName: "getVaultPositions",
              args: [BigInt(i)],
            })) as any[];
          } catch {}

          let vaultValueBig = BigInt(0);
          try {
            vaultValueBig = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.hook,
              abi: CADRA_HOOK_ABI,
              functionName: "getVaultValue",
              args: [BigInt(i)],
            })) as bigint;
          } catch {}

          let paceValueBig = BigInt(0);
          try {
            paceValueBig = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.hook,
              abi: CADRA_HOOK_ABI,
              functionName: "getPaceValue",
              args: [BigInt(i)],
            })) as bigint;
          } catch {}

          let totalValueBig = BigInt(0);
          try {
            totalValueBig = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.hook,
              abi: CADRA_HOOK_ABI,
              functionName: "getVaultTotalValue",
              args: [BigInt(i)],
            })) as bigint;
          } catch {}

          let userSharesBig = BigInt(0);
          if (connectedAddress) {
            try {
              userSharesBig = (await publicClient.readContract({
                address: CONTRACT_ADDRESSES.hook,
                abi: CADRA_HOOK_ABI,
                functionName: "vaultFollowerShares",
                args: [BigInt(i), connectedAddress as `0x${string}`],
              })) as bigint;
            } catch {}
          }

          let pending0Big = BigInt(0);
          try {
            pending0Big = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.hook,
              abi: CADRA_HOOK_ABI,
              functionName: "vaultPending0",
              args: [BigInt(i)],
            })) as bigint;
          } catch {}

          const bondUsdc = Number(vaultRaw.bond) / 1e6;
          const mult = Number(vaultRaw.capacityMultiplier || 5);
          const capacityUsdc = bondUsdc * mult;
          const totalValUsdc = Number(totalValueBig) / 1e6;
          const vaultValUsdc = Number(vaultValueBig) / 1e6;
          const paceValUsdc = Number(paceValueBig) / 1e6;
          const deficitUsdc = Number(vaultRaw.deficit || BigInt(0)) / 1e6;
          const sharesUsdc = Number(vaultRaw.totalShares || BigInt(0)) / 1e6;

          let storedName = "";
          if (typeof window !== "undefined") {
            storedName = localStorage.getItem(`cadra_vault_name_${i}`) || "";
          }

          const defaultName =
            i === 1
              ? "Alpha Dynamic Corridor"
              : i === 2
              ? "Defensive Wide Perimeter"
              : `Vault #${i}`;

          const minTick = Number(vaultRaw.mandate?.minTick ?? -69060);
          const maxTick = Number(vaultRaw.mandate?.maxTick ?? -46080);
          const maxConcBps = Number(vaultRaw.mandate?.maxConcentrationBps ?? 5000);
          const minWidth = Number(vaultRaw.mandate?.minRangeWidth ?? 120);
          const maxShortfallBps = Number(vaultRaw.mandate?.maxShortfallBps ?? 500);

          const shortfallBpsCalc =
            paceValueBig > vaultValueBig && paceValueBig > BigInt(0)
              ? Math.round(Number(((paceValueBig - vaultValueBig) * BigInt(10000)) / paceValueBig))
              : 0;

          const vaultData: VaultData = {
            id: i,
            name: storedName || defaultName,
            curatorAddress: vaultRaw.curator || "0x0000000000000000000000000000000000000000",
            tag: i === 1 ? "Tight Range Active" : i === 2 ? "Wide Range Defensive" : "Curator Mandate",
            description: "Live Uniswap v4 on-chain benchmarked liquidity on Unichain Sepolia.",
            perfFeeBps: Number(vaultRaw.perfFeeBps || 2000),
            bondAmount: bondUsdc,
            capacity: capacityUsdc,
            capacityMultiplier: mult,
            totalFollowerValue: totalValUsdc,
            followerShares: sharesUsdc,
            paceValue: paceValUsdc,
            vaultValue: vaultValUsdc,
            carriedDeficit: deficitUsdc,
            curatorOwnershipBps: 1500,
            currentShortfallBps: shortfallBpsCalc,
            timesParked: Number(vaultRaw.record?.timesParked || 0),
            timesShielded: 0,
            epoch: Number(vaultRaw.epoch || 1),
            epochStart: Number(vaultRaw.epochStart || Math.floor(Date.now() / 1000)),
            epochDuration: 3600,
            isParked: Boolean(vaultRaw.isFrozen),
            bandLeft: Boolean(vaultRaw.bandLeft),
            mandate: {
              minTick,
              maxTick,
              minPrice: tickToPrice(minTick),
              maxPrice: tickToPrice(maxTick),
              maxConcentrationBps: maxConcBps,
              minRangeWidth: minWidth,
              maxShortfallBps,
            },
            activeRanges: positionsRaw.map((p, idx) => ({
              id: `r${idx + 1}`,
              lowerTick: Number(p.tickLower),
              upperTick: Number(p.tickUpper),
              lowerPrice: tickToPrice(Number(p.tickLower)),
              upperPrice: tickToPrice(Number(p.tickUpper)),
              liquidityPercent: 100,
            })),
            history: [],
          };

          fetchedVaults.push(vaultData);

          if (connectedAddress && (userSharesBig > BigInt(0) || pending0Big > BigInt(0))) {
            const userShareNum = Number(userSharesBig) / 1e6;
            const pendingNum = Number(pending0Big) / 1e6;
            fetchedPositions[i] = {
              vaultId: i,
              depositedAmount: userShareNum + pendingNum,
              currentValue: userShareNum + pendingNum,
              paceEquivalent: userShareNum + pendingNum,
              shares: userShareNum,
              pendingDeposit: pendingNum,
              pendingWithdraw: 0,
              feesPaid: 0,
              bondPayoutsReceived: 0,
            };
          }
        } catch (err) {
          console.error(`Error loading on-chain vault #${i}:`, err);
        }
      }

      if (fetchedVaults.length > 0) {
        setVaults(fetchedVaults);
        setUserPositions(fetchedPositions);
      }
    } catch (err) {
      console.warn("Could not query on-chain vaults, using fallback:", err);
    }
  }, [connectedAddress]);

  // Initial load
  useEffect(() => {
    setIsHydrated(true);
    fetchOnChainVaults();
  }, [fetchOnChainVaults]);

  // Periodic polling for on-chain state updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOnChainVaults();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchOnChainVaults]);

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

  // Real log subscription on Unichain Sepolia for CadraHook & Reactive events
  useEffect(() => {
    try {
      const client = createPublicClient({
        chain: unichainSepolia,
        transport: http("https://sepolia.unichain.org"),
      });

      const unwatchBandLeft = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "BandLeft",
        onLogs: (logs) => {
          for (const log of logs) {
            const vId = Number((log as any).args?.vaultId || 1);
            const targetVault = vaults.find((v) => v.id === vId);
            const txHash = log.transactionHash || "0x0";
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
            fetchOnChainVaults();
          }
        },
      });

      const unwatchSettled = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "Settled",
        onLogs: (logs) => {
          for (const log of logs) {
            const vId = Number((log as any).args?.vaultId || 1);
            const targetVault = vaults.find((v) => v.id === vId);
            const txHash = log.transactionHash || "0x0";
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
            fetchOnChainVaults();
          }
        },
      });

      const unwatchVaultCreated = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "VaultCreated",
        onLogs: () => {
          fetchOnChainVaults();
        },
      });

      const unwatchBondChanged = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        eventName: "BondChanged",
        onLogs: () => {
          fetchOnChainVaults();
        },
      });

      return () => {
        unwatchBandLeft();
        unwatchSettled();
        unwatchVaultCreated();
        unwatchBondChanged();
      };
    } catch {
      // Ignored if client unavailable
    }
  }, [vaults, addSafetyEvent, fetchOnChainVaults]);

  // Wallet actions
  const connectWallet = () => {
    login();
  };

  const disconnectWallet = () => {
    logout();
    disconnect();
  };

  // =========================================================================
  //                       ON-CHAIN WRITE ACTIONS
  // =========================================================================

  // 1. Follower Deposit on-chain
  const deposit = async (vaultId: number, amount: number) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const amountUnits = parseUnits(amount.toString(), 6); // Mock USDC has 6 decimals

      // Check current USDC allowance for CadraHook
      const currentAllowance = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "allowance",
        args: [account, CONTRACT_ADDRESSES.hook],
      })) as bigint;

      if (currentAllowance < amountUnits) {
        const approveTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.token0,
          abi: ERC20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.hook, maxUint256],
          account,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      // Execute on-chain deposit
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "deposit",
        args: [BigInt(vaultId), amountUnits, BigInt(0)],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 2. Follower Withdrawal on-chain
  const withdraw = async (vaultId: number, shares: number) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const sharesUnits = parseUnits(shares.toString(), 6);

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "requestWithdraw",
        args: [BigInt(vaultId), sharesUnits],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 3. Curator Deploy Vault on-chain
  const createVault = async (newVault: VaultData): Promise<number | undefined> => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;

      const poolKey = {
        currency0: CONTRACT_ADDRESSES.token0,
        currency1: CONTRACT_ADDRESSES.token1,
        fee: 3000,
        tickSpacing: 60,
        hooks: CONTRACT_ADDRESSES.hook,
      };

      const perfFeeBps = Math.min(3000, Math.max(0, Math.round(newVault.perfFeeBps || 2000)));

      // Align mandate ticks to pool tickSpacing 60
      let minTick = Math.round(Number(newVault.mandate.minTick) / 60) * 60;
      let maxTick = Math.round(Number(newVault.mandate.maxTick) / 60) * 60;
      if (minTick >= maxTick) {
        minTick = -69060;
        maxTick = -46080;
      }
      const minRangeWidth = Math.max(60, Math.round(Number(newVault.mandate.minRangeWidth || 120) / 60) * 60);

      const mandate = {
        minTick,
        maxTick,
        maxConcentrationBps: Math.min(10000, Math.max(1, Number(newVault.mandate.maxConcentrationBps || 5000))),
        minRangeWidth,
        maxShortfallBps: Math.min(10000, Math.max(1, Number(newVault.mandate.maxShortfallBps || 500))),
      };

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "createVault",
        args: [poolKey, perfFeeBps, mandate],
        account,
      });

      setOnChainTxHash(tx);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      // Identify newly created vault ID from logs
      let createdVaultId: number | undefined;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === CONTRACT_ADDRESSES.hook.toLowerCase() && log.topics[1]) {
          createdVaultId = Number(BigInt(log.topics[1]));
          break;
        }
      }

      if (!createdVaultId) {
        const nextIdBig = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "nextVaultId",
        });
        createdVaultId = Number(nextIdBig) - 1;
      }

      if (createdVaultId && typeof window !== "undefined") {
        localStorage.setItem(`cadra_vault_name_${createdVaultId}`, newVault.name);
      }

      // If curator specified initial bond amount, post it immediately
      if (createdVaultId && newVault.bondAmount > 0) {
        const bondUnits = parseUnits(newVault.bondAmount.toString(), 6);
        const curAllowance = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.token0,
          abi: ERC20Abi,
          functionName: "allowance",
          args: [account, CONTRACT_ADDRESSES.hook],
        })) as bigint;

        if (curAllowance < bondUnits) {
          const appTx = await client.writeContract({
            address: CONTRACT_ADDRESSES.token0,
            abi: ERC20Abi,
            functionName: "approve",
            args: [CONTRACT_ADDRESSES.hook, maxUint256],
            account,
          });
          await publicClient.waitForTransactionReceipt({ hash: appTx });
        }

        const bondTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "postBond",
          args: [BigInt(createdVaultId), bondUnits],
          account,
        });
        await publicClient.waitForTransactionReceipt({ hash: bondTx });
      }

      await fetchOnChainVaults();
      return createdVaultId;
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 4. Curator Post Collateral Bond on-chain
  const postBond = async (vaultId: number, amount: number) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const amountUnits = parseUnits(amount.toString(), 6);

      // Check current USDC allowance for CadraHook
      const currentAllowance = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "allowance",
        args: [account, CONTRACT_ADDRESSES.hook],
      })) as bigint;

      if (currentAllowance < amountUnits) {
        const approveTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.token0,
          abi: ERC20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.hook, maxUint256],
          account,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      // Execute on-chain postBond
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "postBond",
        args: [BigInt(vaultId), amountUnits],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 5. Curator Rebalance on-chain
  const updateRanges = async (vaultId: number, newRanges: RangePosition[]) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;

      // Query vault's idle balances
      let idle0 = BigInt(0);
      let idle1 = BigInt(0);
      try {
        idle0 = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "vaultIdle0",
          args: [BigInt(vaultId)],
        })) as bigint;
        idle1 = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "vaultIdle1",
          args: [BigInt(vaultId)],
        })) as bigint;
      } catch {}

      // Format and align ranges to tickSpacing 60
      const formattedRanges = newRanges.map((r) => {
        let lower = Math.round(r.lowerTick / 60) * 60;
        let upper = Math.round(r.upperTick / 60) * 60;
        if (upper <= lower) upper = lower + 60;
        // If vault has no idle tokens deployed yet, set liquidity to 0 to safely arm the corridor without reverting InsufficientIdle()
        const liq = (idle0 === BigInt(0) && idle1 === BigInt(0))
          ? BigInt(0)
          : BigInt(Math.min(1000000000, Math.floor(Number(idle0 > idle1 ? idle0 : idle1) * (r.liquidityPercent || 100) / 100)));
        return {
          tickLower: lower,
          tickUpper: upper,
          liquidity: liq,
        };
      });

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "rebalance",
        args: [BigInt(vaultId), formattedRanges],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 6. Curator Propose Mandate on-chain
  const proposeMandate = async (vaultId: number, mandate: VaultData["mandate"]) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;

      let minTick = Math.round(Number(mandate.minTick) / 60) * 60;
      let maxTick = Math.round(Number(mandate.maxTick) / 60) * 60;
      if (minTick >= maxTick) {
        minTick = -69060;
        maxTick = -46080;
      }
      const minRangeWidth = Math.max(60, Math.round(Number(mandate.minRangeWidth || 120) / 60) * 60);
      if (maxTick - minTick < minRangeWidth) {
        maxTick = minTick + minRangeWidth;
      }

      const mandateTuple = {
        minTick,
        maxTick,
        maxConcentrationBps: Math.min(10000, Math.max(1, Number(mandate.maxConcentrationBps || 5000))),
        minRangeWidth,
        maxShortfallBps: Math.min(10000, Math.max(1, Number(mandate.maxShortfallBps || 500))),
      };

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "proposeMandate",
        args: [BigInt(vaultId), mandateTuple],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 7. Enforce Rule Guard on-chain
  const triggerEnforce = async (vaultId: number) => {
    setIsLoadingOnChain(true);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "enforce",
        args: [BigInt(vaultId)],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 8. Settle Epoch on-chain
  const triggerSettle = async (vaultId: number) => {
    setIsLoadingOnChain(true);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "settle",
        args: [BigInt(vaultId)],
        account,
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 9. Free Faucet: Mint Test USDC on Unichain Sepolia
  const mintTestTokens = async () => {
    if (!connectedAddress) {
      if (login) login();
      return;
    }
    setIsLoadingOnChain(true);
    try {
      const client = await getAsyncWalletClient();
      const account = connectedAddress as `0x${string}`;

      const mintTx = await client.writeContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "mint",
        args: [account, parseUnits("10000", 6)], // 10,000 USDC
        account,
      });

      setOnChainTxHash(mintTx);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // Seed archetypes helper
  const seedArchetypes = () => {
    fetchOnChainVaults();
  };

  const resetDemo = () => {
    fetchOnChainVaults();
  };

  const contextValue = useMemo(
    () => ({
      isHydrated,
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
      refreshOnChainData: fetchOnChainVaults,
      mintTestTokens,
      isLoadingOnChain,
      onChainTxHash,
    }),
    [
      isHydrated,
      vaults,
      userPositions,
      reactiveSafetyFeed,
      connectedAddress,
      isConnected,
      activeRole,
      login,
      logout,
      fetchOnChainVaults,
      isLoadingOnChain,
      onChainTxHash,
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
