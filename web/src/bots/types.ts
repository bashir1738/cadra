/**
 * Shared types for Cadra Autonomous Bots
 */

export interface RangeTarget {
  tickLower: number;
  tickUpper: number;
  shareBps: number;
}

export interface SwapParams {
  zeroForOne: boolean;
  amountSpecified: bigint;
  sqrtPriceLimitX96?: bigint;
}

export interface VaultState {
  id: number;
  name?: string;
  epoch: number;
  epochStart: number;
  epochDuration: number;
  isParked: boolean;
  bandLeft: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface BotLogEvent {
  id: string;
  time: string;
  bot: "swapper" | "curator" | "keeper" | "hook";
  type: "info" | "alert" | "success" | "warn";
  message: string;
}

export interface BotMetrics {
  totalSwaps: number;
  totalVolumeUsdc: number;
  totalRebalances: number;
  totalEnforcements: number;
  totalSettlements: number;
  spotPrice: number;
}
