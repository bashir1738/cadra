export interface Mandate {
  minTick: number;
  maxTick: number;
  minPrice: number;
  maxPrice: number;
  maxConcentrationBps: number; // e.g. 5000 = 50%
  minRangeWidth: number; // e.g. 200 ticks
  maxShortfallBps: number; // e.g. 500 = 5%
}

export interface RangePosition {
  id: string;
  lowerTick: number;
  upperTick: number;
  lowerPrice: number;
  upperPrice: number;
  liquidityPercent: number;
}

export interface VaultData {
  id: number;
  name: string;
  curatorAddress: `0x${string}`;
  tag: string;
  description: string;
  perfFeeBps: number; // e.g. 2000 = 20%
  bondAmount: number; // USDC
  capacity: number; // bond * multiplier
  capacityMultiplier: number; // 2x to 20x
  totalFollowerValue: number; // USDC
  followerShares: number;
  paceValue: number; // Benchmark value in USDC
  vaultValue: number; // Current vault value in USDC
  carriedDeficit: number; // Deficit carry D to be recovered before new fees
  curatorOwnershipBps: number; // Shares held by curator e.g. 1500 = 15%
  currentShortfallBps: number; // Current gap below pace e.g. 120 = 1.2%
  timesParked: number; // Number of times rule-guard parked
  timesShielded: number; // Number of times shock-guard shielded
  epoch: number;
  epochStart: number; // timestamp
  epochDuration: number; // seconds
  isParked: boolean;
  bandLeft: boolean;
  mandate: Mandate;
  activeRanges: RangePosition[];
  history: {
    epoch: number;
    vaultValue: number;
    paceValue: number;
    gap: number;
    outcome: "ahead" | "behind";
    feeOrPayout: number;
    multiplierAfter?: number;
    carriedDeficitAfter?: number;
  }[];
}

export interface UserPosition {
  vaultId: number;
  depositedAmount: number; // USDC
  currentValue: number;
  paceEquivalent: number;
  shares: number;
  pendingDeposit: number;
  pendingWithdraw: number;
  feesPaid?: number; // Total fees paid when curator beat the Pace
  bondPayoutsReceived?: number; // Total bond compensation received when curator lagged
}

export interface ReactiveSafetyAction {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type: "rule_guard" | "shock_guard" | "settlement";
  vaultId: number;
  vaultName: string;
  latencySeconds: number; // e.g. 1.1s for rule guard, 0.8s for shock guard
  originChain: "Unichain Sepolia" | "Base Sepolia" | "Reactive Lasna";
  originTxHash: string;
  reactiveTxHash: string;
  callbackTxHash: string;
  summary: string;
  details: string;
}
