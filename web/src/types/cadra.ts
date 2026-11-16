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
  carriedDeficit: number;
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
}
