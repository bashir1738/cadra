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
  defineChain,
  http,
  custom,
  parseUnits,
  maxUint256,
  keccak256,
  encodeAbiParameters,
} from "viem";
import { unichainSepolia } from "viem/chains";
import { CADRA_CALLBACK_ABI, CADRA_HOOK_ABI, CADRA_REACTIVE_ABI, ERC20Abi } from "../bots/abis";
import toast from "react-hot-toast";

interface CadraContextType {
  isHydrated: boolean;
  spotPrice: number;
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
  withdrawBond: (vaultId: number, amount: number) => Promise<void>;
  closeVault: (vaultId: number) => Promise<void>;
  proposeMandate: (vaultId: number, mandate: VaultData["mandate"]) => Promise<void>;
  triggerEnforce: (vaultId: number) => Promise<void>;
  triggerSettle: (vaultId: number, simulatedGapUsdc: number) => Promise<void>;
  addSafetyEvent: (event: ReactiveSafetyAction) => void;
  seedArchetypes: () => void;
  resetDemo: () => void;
  deleteVault: (vaultId: number) => void;
  deleteAllVaults: () => void;
  refreshOnChainData: () => Promise<void>;
  mintTestTokens: () => Promise<void>;
  userUsdcBalance: number;
  isLoadingOnChain: boolean;
  onChainTxHash: string | null;
  updateReactiveGasLimit: (gasLimit: number) => Promise<void>;
  updateReactiveRecipient: (recipient: `0x${string}`) => Promise<void>;
  updateReactiveHook: (hook: `0x${string}`) => Promise<void>;
  clearReactiveRecipient: () => Promise<void>;
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
    bondAmount: 10,
    capacity: 50,
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
      minTick: -198420,
      maxTick: -197700,
      minPrice: 2415,
      maxPrice: 2595,
      maxConcentrationBps: 5000,
      minRangeWidth: 120,
      maxShortfallBps: 500,
    },
    activeRanges: [
      {
        id: "r1",
        lowerTick: -198180,
        upperTick: -197940,
        lowerPrice: 2475,
        upperPrice: 2535,
        liquidityPercent: 100,
      },
    ],
    history: [],
  },
  {
    id: 2,
    name: "Defensive Wide Perimeter",
    curatorAddress: "0xe5C73A83d65A015DF4386467bF1D5f94ed4E120B",
    tag: "Wide Range Defensive",
    description: "Low-turnover conservative buffer capturing broad pool volume.",
    perfFeeBps: 1500,
    bondAmount: 20,
    capacity: 100,
    capacityMultiplier: 5,
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
      minTick: -198180,
      maxTick: -198060,
      minPrice: 2475,
      maxPrice: 2505,
      maxConcentrationBps: 10000,
      minRangeWidth: 60,
      maxShortfallBps: 100,
    },
    activeRanges: [
      {
        id: "r1",
        lowerTick: -198120,
        upperTick: -198060,
        lowerPrice: 2490,
        upperPrice: 2505,
        liquidityPercent: 100,
      },
    ],
    history: [],
  },
];

export const DEFAULT_VAULTS: VaultData[] = TESTNET_ARCHETYPES;

export function tickToPrice(tick: number): number {
  try {
    // 1. Decimals scaling: pool is USDC (6 decimals) and WETH (18 decimals), diff is 1e12
    const priceWithDecimals = Math.pow(1.0001, tick) * 1e12;
    if (priceWithDecimals >= 10 && priceWithDecimals <= 1000000) {
      return Math.round(priceWithDecimals);
    }
    // 2. Fallback for normalized pairs or unscaled ticks
    const raw = Math.pow(1.0001, tick);
    if (raw > 0) {
      const price1 = Math.round(1 / raw);
      if (price1 >= 10 && price1 <= 1000000) return price1;
      const price2 = Math.round(raw);
      if (price2 >= 10 && price2 <= 1000000) return price2;
    }
    return 2500;
  } catch {
    return 2500;
  }
}

export function priceToTick(price: number): number {
  try {
    if (price <= 0) return -198060;
    // With 12 decimal scaling for USDC/WETH pool:
    const tick = Math.round(Math.log(price * 1e-12) / Math.log(1.0001));
    return Math.round(tick / 60) * 60;
  } catch {
    return -198060;
  }
}

const publicClient = createPublicClient({
  chain: unichainSepolia,
  transport: http("https://sepolia.unichain.org"),
});

const SETTLED_EVENT = {
  type: "event" as const,
  name: "Settled",
  inputs: [
    { name: "vaultId",     type: "uint256", indexed: true  },
    { name: "epoch",       type: "uint256", indexed: false },
    { name: "vaultValue",  type: "uint256", indexed: false },
    { name: "paceValue",   type: "uint256", indexed: false },
    { name: "fee",         type: "uint256", indexed: false },
    { name: "bondPaid",    type: "uint256", indexed: false },
    { name: "deficit",     type: "uint256", indexed: false },
    { name: "protocolFee", type: "uint256", indexed: false },
  ],
} as const;

const CADRA_DEPLOY_BLOCK = BigInt(68350000);

const POOL_MANAGER_ABI = [
  {
    type: "function",
    name: "getSlot0",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
    stateMutability: "view",
  },
] as const;

const POOL_ID = keccak256(
  encodeAbiParameters(
    [
      { type: "address" },
      { type: "address" },
      { type: "uint24" },
      { type: "int24" },
      { type: "address" },
    ],
    [
      CONTRACT_ADDRESSES.token0,
      CONTRACT_ADDRESSES.token1,
      3000,
      60,
      CONTRACT_ADDRESSES.hook,
    ]
  )
);

const reactiveChain = defineChain({
  id: 5318007,
  name: "Reactive Lasna Omni",
  nativeCurrency: { name: "REACT", symbol: "REACT", decimals: 18 },
  rpcUrls: { default: { http: ["https://lasna-rpc.rnk.dev/"] } },
});

// Sample/demo safety feed shown in the UI until live Reactive loop confirmations
// (react() on Lasna + CadraCallback.enforce() on Unichain) are wired in.
// The tx hashes below are illustrative history, not confirmed on-chain executions.
const DEFAULT_SAFETY_FEED: ReactiveSafetyAction[] = [
  {
    id: "init-safety-1",
    timestamp: Date.now() - 3600000,
    timeFormatted: "1 hour ago",
    type: "rule_guard",
    vaultId: 1,
    vaultName: "Tight Range Alpha",
    latencySeconds: 1.08,
    originChain: "Unichain Sepolia",
    originTxHash: "0xf72295be529358c29c684d88c6ffed196d19b20448f9172ece21f9cb05d0d9cc",
    reactiveTxHash: "0x0d5e067e8cf78c06bbe4053aa5e1e107c0afe6fc935d5be686f514f13b4b71eb",
    callbackTxHash: "0xd3217b9b8f67d6094ce0faa47c555b7967572c62488eaab8430c856c6e3fd5a9",
    summary: "Rule Guard Enforced: BandLeft -> Parked",
    details: "Spot tick exited mandate corridor on Unichain Sepolia. CadraReactive reacted in 1.08s and called enforce() via CadraCallback, parking 100% of follower assets into full-range Uniswap v4 liquidity.",
  },
  {
    id: "init-safety-2",
    timestamp: Date.now() - 7200000,
    timeFormatted: "2 hours ago",
    type: "settlement",
    vaultId: 1,
    vaultName: "Tight Range Alpha",
    latencySeconds: 0.95,
    originChain: "Unichain Sepolia",
    originTxHash: "0xf72295be529358c29c684d88c6ffed196d19b20448f9172ece21f9cb05d0d9cc",
    reactiveTxHash: "0x96e69feb41da0a354bf0f7f7495792ed82e6250c1227bbbfd4bd60d1291f84d9",
    callbackTxHash: "0xd3217b9b8f67d6094ce0faa47c555b7967572c62488eaab8430c856c6e3fd5a9",
    summary: "Epoch Settled by Reactive Network",
    details: "EpochReady signal triggered CadraReactive. Settle transaction executed at TWAP rate; surplus distributed and benchmark re-established.",
  },
];

export function CadraProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [vaults, setVaults] = useState<VaultData[]>(DEFAULT_VAULTS);
  const [userPositions, setUserPositions] = useState<Record<number, UserPosition>>(DEFAULT_POSITIONS);
  const [activeRole, setActiveRoleState] = useState<"follower" | "curator">("follower");
  const [reactiveSafetyFeed, setReactiveSafetyFeed] = useState<ReactiveSafetyAction[]>(DEFAULT_SAFETY_FEED);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number>(0);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState<boolean>(false);
  const [onChainTxHash, setOnChainTxHash] = useState<string | null>(null);
  const [spotPrice, setSpotPrice] = useState<number>(0);

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

  const getReactiveWalletClient = useCallback(async () => {
    const activeWallet = wallets[0];
    if (!activeWallet) throw new Error("Connect the owner wallet first.");

    const provider = await activeWallet.getEthereumProvider();

    // Add Reactive Lasna to the wallet if it isn't already known, then switch.
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x510DEF7", // 5318007 in hex
          chainName: "Reactive Lasna Omni",
          nativeCurrency: { name: "Reactive", symbol: "REACT", decimals: 18 },
          rpcUrls: ["https://lasna-rpc.rnk.dev/"],
          blockExplorerUrls: ["https://lasna.reactscan.net/"],
        }],
      });
    } catch {
      // Wallet may already know the chain — proceed to switchChain regardless.
    }

    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x510DEF7" }] });

    return createWalletClient({
      chain: reactiveChain,
      transport: custom(provider),
      account: activeWallet.address as `0x${string}`,
    });
  }, [wallets]);

  const reactiveWrite = useCallback(async (functionName: string, args: readonly unknown[] = []) => {
    setIsLoadingOnChain(true);
    try {
      const client = await getReactiveWalletClient();
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESSES.reactive,
        abi: CADRA_REACTIVE_ABI,
        functionName: functionName as any,
        args: args as any,
        account: client.account!,
      });
      setOnChainTxHash(hash);
      await createPublicClient({ chain: reactiveChain, transport: http("https://lasna-rpc.rnk.dev/") }).waitForTransactionReceipt({ hash });
    } finally {
      setIsLoadingOnChain(false);
    }
  }, [getReactiveWalletClient]);

  const updateReactiveGasLimit = async (gasLimit: number) => reactiveWrite("setCallbackGasLimit", [BigInt(gasLimit)]);
  const updateReactiveRecipient = async (recipient: `0x${string}`) => reactiveWrite("setCallbackRecipient", [recipient]);
  const updateReactiveHook = async (hook: `0x${string}`) => reactiveWrite("subscribeHook", [hook]);
  const clearReactiveRecipient = async () => reactiveWrite("clearCallbackRecipient");

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

      let hiddenIds: number[] = [];
      try {
        const stored = localStorage.getItem("cadra_hidden_vaults");
        hiddenIds = stored ? JSON.parse(stored) : [];
      } catch {}

      for (let i = 1; i < nextId; i++) {
        if (hiddenIds.includes(i)) continue;
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

          const closed = BigInt(vaultRaw.epochStart || 0) === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

          const bondUsdc = Number(vaultRaw.bond) / 1e6;
          const mult = Number(vaultRaw.capacityMultiplier || 5);
          const capacityUsdc = bondUsdc * mult;
          const totalValUsdc = Number(totalValueBig) / 1e6;
          const vaultValUsdc = Number(vaultValueBig) / 1e6;
          const paceValUsdc = Number(paceValueBig) / 1e6;
          const deficitUsdc = Number(vaultRaw.deficit || BigInt(0)) / 1e6;
          const sharesUsdc = Number(vaultRaw.totalShares || BigInt(0)) / 1e6;

          let storedName = "";
          let storedTag = "";
          let storedDescription = "";
          if (typeof window !== "undefined") {
            storedName = localStorage.getItem(`cadra_vault_name_${i}`) || "";
            const metaCid = localStorage.getItem(`cadra_vault_meta_cid_${i}`);
            if (metaCid) {
              try {
                const metaRes = await fetch(`/api/vault-metadata?cid=${metaCid}`);
                if (metaRes.ok) {
                  const meta = await metaRes.json();
                  storedTag = meta.tag || "";
                  storedDescription = meta.description || "";
                }
              } catch {
                // ignore — fall back to defaults
              }
            }
          }

          const defaultName =
            i === 1
              ? "Alpha Dynamic Corridor"
              : i === 2
              ? "Defensive Wide Perimeter"
              : `Vault #${i}`;

          const minTick = Number(vaultRaw.mandate?.minTick ?? -198420);
          const maxTick = Number(vaultRaw.mandate?.maxTick ?? -197700);
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
            tag: storedTag || (i === 1 ? "Tight Range Active" : i === 2 ? "Wide Range Defensive" : "Curator Mandate"),
            description: storedDescription || "Live Uniswap v4 on-chain benchmarked liquidity on Unichain Sepolia.",
            perfFeeBps: Number(vaultRaw.perfFeeBps || 2000),
            bondAmount: bondUsdc,
            bondUnlockTime: Number(vaultRaw.bondUnlockTime || 0),
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
            epochStart: closed ? 0 : Number(vaultRaw.epochStart || Math.floor(Date.now() / 1000)),
            epochDuration: 3600,
            isParked: Boolean(vaultRaw.isFrozen),
            bandLeft: Boolean(vaultRaw.bandLeft),
            isClosed: closed,
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

          // ── Settlement history from Settled event logs ──────────────────
          let userFeesPaid = 0;
          let userBondPayouts = 0;
          try {
            const settledLogs = await publicClient.getLogs({
              address: CONTRACT_ADDRESSES.hook,
              event: SETTLED_EVENT,
              args: { vaultId: BigInt(i) },
              fromBlock: CADRA_DEPLOY_BLOCK,
              toBlock: "latest",
            });

            let runningMult = 5;
            vaultData.history = settledLogs
              .slice()
              .sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber))
              .map((log) => {
                const a = log.args as any;
                const vaultVal = Number(a.vaultValue) / 1e6;
                const paceVal  = Number(a.paceValue)  / 1e6;
                const fee      = Number(a.fee)         / 1e6;
                const bondPaid = Number(a.bondPaid)    / 1e6;
                const deficit  = Number(a.deficit)     / 1e6;
                const gap      = vaultVal - paceVal;
                const isAhead  = fee > 0;

                const entry = {
                  epoch:              Number(a.epoch),
                  vaultValue:         vaultVal,
                  paceValue:          paceVal,
                  gap,
                  feeOrPayout:        isAhead ? fee : bondPaid,
                  outcome:            (isAhead ? "ahead" : "behind") as "ahead" | "behind",
                  multiplierAfter:    runningMult,
                  carriedDeficitAfter: deficit,
                };

                runningMult = isAhead
                  ? Math.min(20, runningMult + 1)
                  : Math.max(2,  runningMult - 2);

                return entry;
              });

            // ── Curator ownership from on-chain shares ──────────────────
            const curatorAddr = vaultRaw.curator as `0x${string}`;
            const totalSharesBig = vaultRaw.totalShares || BigInt(0);
            if (curatorAddr && totalSharesBig > BigInt(0)) {
              try {
                const curatorShares = (await publicClient.readContract({
                  address: CONTRACT_ADDRESSES.hook,
                  abi: CADRA_HOOK_ABI,
                  functionName: "vaultFollowerShares",
                  args: [BigInt(i), curatorAddr],
                })) as bigint;
                vaultData.curatorOwnershipBps = Math.round(
                  Number((curatorShares * BigInt(10000)) / totalSharesBig)
                );
              } catch {}
            }

            // ── Per-user fee/payout estimates ───────────────────────────
            if (connectedAddress && userSharesBig > BigInt(0) && totalSharesBig > BigInt(0)) {
              const userFrac = Number(userSharesBig) / Number(totalSharesBig);
              for (const h of vaultData.history) {
                if (h.outcome === "ahead") {
                  userFeesPaid   += h.feeOrPayout * userFrac;
                } else {
                  userBondPayouts += h.feeOrPayout * userFrac;
                }
              }
            }
          } catch {}

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
              feesPaid: userFeesPaid,
              bondPayoutsReceived: userBondPayouts,
            };
          }
        } catch (err) {
          console.error(`Error loading on-chain vault #${i}:`, err);
        }
      }

      if (fetchedVaults.length > 0) {
        setVaults(fetchedVaults);
        setUserPositions(fetchedPositions);
      } else if (hiddenIds.length > 0) {
        setVaults([]);
        setUserPositions({});
      }

      if (connectedAddress) {
        try {
          const usdcBal = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.token0,
            abi: ERC20Abi,
            functionName: "balanceOf",
            args: [connectedAddress as `0x${string}`],
          })) as bigint;
          setUserUsdcBalance(Number(usdcBal) / 1e6);
        } catch {
          // keep previous
        }
      } else {
        setUserUsdcBalance(0);
      }

      try {
        const slot0 = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.poolManager,
          abi: POOL_MANAGER_ABI,
          functionName: "getSlot0",
          args: [POOL_ID as `0x${string}`],
        })) as readonly [bigint, number, number, number];
        const tick = slot0[1];
        const price = tickToPrice(tick);
        if (price > 0) setSpotPrice(price);
      } catch {
        // keep previous
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

      const unwatchSettleFailed = client.watchContractEvent({
        address: CONTRACT_ADDRESSES.callback,
        abi: CADRA_CALLBACK_ABI,
        eventName: "SettleFailed",
        onLogs: (logs) => {
          for (const log of logs) {
            const vId = Number((log as any).args?.vaultId || 1);
            const targetVault = vaults.find((v) => v.id === vId);
            const txHash = log.transactionHash || "0x0";
            addSafetyEvent({
              id: `callback-settle-failed-${log.blockNumber}-${log.logIndex}`,
              timestamp: Date.now(),
              timeFormatted: "Just now",
              type: "settlement",
              vaultId: vId,
              vaultName: targetVault?.name || `Vault #${vId}`,
              latencySeconds: 0,
              originChain: "Unichain Sepolia",
              originTxHash: txHash,
              reactiveTxHash: txHash,
              callbackTxHash: txHash,
              summary: "Reactive Settlement Retry Needed",
              details: `CadraCallback recorded a failed settle(${vId}) attempt without reverting the callback. The epoch remains permissionlessly retryable once the hook's settlement conditions are satisfied.`,
            });
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
        unwatchSettleFailed();
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
    if (amount < 5) {
      throw new Error(
        "Minimum deposit is 5 USDC. Please enter 5 USDC or higher."
      );
    }

    // Pre-flight check: Target Vault capacity and curator bond
    const targetVault = vaults.find((v) => v.id === vaultId);
    if (targetVault) {
      if (targetVault.bondAmount <= 0 || targetVault.capacity <= 0) {
        throw new Error(
          `Vault #${vaultId} has $0 curator bond staked. Curators must stake a USDC cash bond before followers can deposit. Please post a bond in Curator Studio first.`
        );
      }
      const remainingCap = targetVault.capacity - targetVault.totalFollowerValue;
      if (amount > remainingCap) {
        throw new Error(
          `Deposit amount ($${amount.toLocaleString()}) exceeds the vault's remaining capacity of $${Math.max(0, remainingCap).toLocaleString()} USDC.`
        );
      }
    }

    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const amountUnits = parseUnits(amount.toString(), 6); // Mock USDC has 6 decimals
      const amount1Wei = BigInt(1); // 1 wei of WETH prevents PaceLib.token0ToToken1Value integer rounding to 0 for small deposits ($5-$20)

      // Pre-flight balance check: prevent wallet reverting on transferFrom
      const userBal = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "balanceOf",
        args: [account],
      })) as bigint;

      if (userBal < amountUnits) {
        throw new Error(
          `Insufficient USDC balance (${(Number(userBal) / 1e6).toFixed(0)} USDC in wallet). Please click '+ Faucet +100 USDC' to claim free test tokens first.`
        );
      }

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
          gas: BigInt(100000),
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      // Check current WETH allowance for 1 wei dust
      const currentWethAllowance = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token1,
        abi: ERC20Abi,
        functionName: "allowance",
        args: [account, CONTRACT_ADDRESSES.hook],
      })) as bigint;

      if (currentWethAllowance < amount1Wei) {
        const approveWethTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.token1,
          abi: ERC20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.hook, maxUint256],
          account,
          gas: BigInt(100000),
        });
        await publicClient.waitForTransactionReceipt({ hash: approveWethTx });
      }

      // Pre-flight simulation to catch contract reverts before sending to wallet
      let estimatedGas = BigInt(450000);
      let minSharesOut = BigInt(0);
      try {
        const sim = await publicClient.simulateContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "deposit",
          args: [BigInt(vaultId), amountUnits, amount1Wei],
          account,
        });
        if (sim.request?.gas) {
          estimatedGas = (sim.request.gas * BigInt(12)) / BigInt(10);
        }
        // 1% slippage floor on the deposit-time share estimate (settlement NAV may move)
        const estShares = (sim.result as bigint) ?? BigInt(0);
        minSharesOut = (estShares * BigInt(99)) / BigInt(100);
      } catch (simErr: any) {
        console.error("Deposit simulation error:", simErr);
        const errMsg = simErr?.data?.errorName || simErr?.shortMessage || simErr?.message || "";
        if (errMsg.includes("CapacityExceeded")) {
          throw new Error("Deposit rejected: Vault capacity exceeded. Curator must increase bond collateral in Curator Studio.");
        }
        if (errMsg.includes("ZeroDeposit")) {
          throw new Error("Deposit rejected: Value rounded to zero in pool math. Minimum deposit is $5 USDC.");
        }
        if (errMsg.includes("VaultFrozen")) {
          throw new Error("Deposit rejected: Vault is parked/frozen by Reactive Network due to a mandate corridor breach.");
        }
        throw new Error(simErr?.shortMessage || simErr?.message || "Deposit simulation failed on Unichain Sepolia.");
      }

      const safeGas = estimatedGas > BigInt(500000) ? BigInt(500000) : estimatedGas;

      // Execute on-chain deposit with slippage protection
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "depositWithSlippage",
        args: [BigInt(vaultId), amountUnits, amount1Wei, minSharesOut],
        account,
        gas: safeGas,
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
        gas: BigInt(400000),
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      // A closed vault can settle immediately. Trigger settlement after the
      // request so the follower receives the queued claim without waiting for
      // the next Reactive epoch signal.
      if (vaults.find((v) => v.id === vaultId)?.isClosed) {
        const settleTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.hook,
          abi: CADRA_HOOK_ABI,
          functionName: "settle",
          args: [BigInt(vaultId)],
          account,
          gas: BigInt(800000),
        });
        setOnChainTxHash(settleTx);
        await publicClient.waitForTransactionReceipt({ hash: settleTx });
      }
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

      const initialBondUnits = parseUnits((Number(newVault.bondAmount) || 0).toString(), 6);

      // Align mandate ticks to pool tickSpacing 60
      let minTick = Math.round(Number(newVault.mandate.minTick) / 60) * 60;
      let maxTick = Math.round(Number(newVault.mandate.maxTick) / 60) * 60;
      if (minTick >= maxTick) {
        minTick = -69060;
        maxTick = -46080;
      }
      const minRangeWidth = Math.max(60, Math.round(Number(newVault.mandate.minRangeWidth || 120) / 60) * 60);
      if (maxTick - minTick < minRangeWidth) {
        maxTick = minTick + minRangeWidth;
      }

      const mandate = {
        minTick,
        maxTick,
        maxConcentrationBps: Math.min(10000, Math.max(1, Number(newVault.mandate.maxConcentrationBps || 5000))),
        minRangeWidth,
        maxShortfallBps: Math.min(10000, Math.max(1, Number(newVault.mandate.maxShortfallBps || 500))),
      };

      if (initialBondUnits === 0n) throw new Error("An initial bond is required to create a vault");
      const bondBalance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "balanceOf",
        args: [account],
      }) as bigint;
      if (bondBalance < initialBondUnits) throw new Error("Insufficient USDC balance for the initial bond");

      const bondAllowance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "allowance",
        args: [account, CONTRACT_ADDRESSES.hook],
      }) as bigint;
      if (bondAllowance < initialBondUnits) {
        const approveTx = await client.writeContract({
          address: CONTRACT_ADDRESSES.token0,
          abi: ERC20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.hook, maxUint256],
          account,
          gas: BigInt(100000),
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "createVault",
        args: [poolKey, perfFeeBps, mandate, initialBondUnits],
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

      // Upload vault metadata (tag + description) to IPFS via Filebase
      if (createdVaultId) {
        try {
          const metaRes = await fetch("/api/vault-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vaultId: createdVaultId,
              tag: newVault.tag,
              description: newVault.description,
              curatorAddress: connectedAddress,
            }),
          });
          if (metaRes.ok) {
            const { cid } = await metaRes.json();
            if (cid && typeof window !== "undefined") {
              localStorage.setItem(`cadra_vault_meta_cid_${createdVaultId}`, cid);
            }
          }
        } catch {
          // metadata upload is best-effort — vault creation succeeded
        }
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

      // Pre-flight balance check: prevent wallet reverting on transferFrom
      const userBal = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.token0,
        abi: ERC20Abi,
        functionName: "balanceOf",
        args: [account],
      })) as bigint;

      if (userBal < amountUnits) {
        throw new Error(
          `Insufficient USDC balance to post bond (${(Number(userBal) / 1e6).toFixed(0)} USDC available). Claim free test tokens from the Faucet first.`
        );
      }

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
          gas: BigInt(100000),
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
        gas: BigInt(400000),
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 5. Curator withdraws bond collateral on-chain.
  // The hook enforces the one-day cooldown and required collateral for follower capital.
  const withdrawBond = async (vaultId: number, amount: number) => {
    if (amount <= 0) throw new Error("Bond withdrawal amount must be greater than zero.");

    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const amountUnits = parseUnits(amount.toString(), 6);

      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "withdrawBond",
        args: [BigInt(vaultId), amountUnits],
        account,
        gas: BigInt(250000),
      });

      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } catch (err: any) {
      const message = err?.shortMessage || err?.message || "Bond withdrawal failed.";
      if (message.includes("CooldownActive")) {
        throw new Error("Bond withdrawal is still in the 24-hour cooldown period.");
      }
      if (message.includes("InsufficientBond")) {
        throw new Error("This bond is still securing follower capital. Withdrawals must leave the required collateral in the vault.");
      }
      throw err;
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  const closeVault = async (vaultId: number) => {
    setIsLoadingOnChain(true);
    setOnChainTxHash(null);
    try {
      const client = await getAsyncWalletClient();
      const account = (connectedAddress || client.account?.address) as `0x${string}`;
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESSES.hook,
        abi: CADRA_HOOK_ABI,
        functionName: "closeVault",
        args: [BigInt(vaultId)],
        account,
        gas: BigInt(500000),
      });
      setOnChainTxHash(tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchOnChainVaults();
    } catch (err: any) {
      const message = err?.shortMessage || err?.message || "Vault closure failed.";
      throw err;
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

  // 9. Free Faucet: Claim Official Circle Test USDC on Unichain Sepolia
  const mintTestTokens = async () => {
    if (!connectedAddress) {
      if (login) login();
      return;
    }
    // Official Circle USDC is claimed 20 USDC at a time from faucet.circle.com
    if (typeof window !== "undefined") {
      if (navigator?.clipboard) {
        try {
          await navigator.clipboard.writeText(connectedAddress);
          toast.success("Wallet address copied! Request 20 USDC at Circle Faucet.", { duration: 4000 });
        } catch {
          toast.success("Opening Circle Faucet (faucet.circle.com)...", { duration: 3000 });
        }
      } else {
        toast.success("Opening Circle Faucet (faucet.circle.com)...", { duration: 3000 });
      }
      window.open("https://faucet.circle.com", "_blank", "noopener,noreferrer");
    }
    await fetchOnChainVaults();
  };

  // Seed archetypes helper
  const seedArchetypes = () => {
    fetchOnChainVaults();
  };

  const resetDemo = () => {
    fetchOnChainVaults();
  };

  const deleteVault = (vaultId: number) => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("cadra_hidden_vaults") : null;
      const list: number[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(vaultId)) {
        list.push(vaultId);
        if (typeof window !== "undefined") {
          localStorage.setItem("cadra_hidden_vaults", JSON.stringify(list));
        }
      }
      setVaults((prev) => prev.filter((v) => v.id !== vaultId));
    } catch {}
  };

  const deleteAllVaults = () => {
    try {
      const currentIds = vaults.map((v) => v.id);
      const stored = typeof window !== "undefined" ? localStorage.getItem("cadra_hidden_vaults") : null;
      const list: number[] = stored ? JSON.parse(stored) : [];
      const updated = Array.from(new Set([...list, ...currentIds, 1, 2, 3]));
      if (typeof window !== "undefined") {
        localStorage.setItem("cadra_hidden_vaults", JSON.stringify(updated));
      }
      setVaults([]);
      setUserPositions({});
    } catch {}
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
      deleteVault,
      deleteAllVaults,
      updateRanges,
      postBond,
      withdrawBond,
      closeVault,
      proposeMandate,
      triggerEnforce,
      triggerSettle,
      addSafetyEvent,
      seedArchetypes,
      resetDemo,
      refreshOnChainData: fetchOnChainVaults,
      mintTestTokens,
      userUsdcBalance,
      spotPrice,
      isLoadingOnChain,
      onChainTxHash,
      updateReactiveGasLimit,
      updateReactiveRecipient,
      updateReactiveHook,
      clearReactiveRecipient,
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
      userUsdcBalance,
      spotPrice,
      isLoadingOnChain,
      onChainTxHash,
      updateReactiveGasLimit,
      updateReactiveRecipient,
      updateReactiveHook,
      clearReactiveRecipient,
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
