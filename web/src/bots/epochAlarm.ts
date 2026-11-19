/**
 * Thin Epoch Alarm for Cadra Protocol
 * 
 * Reactive Network is purely event-driven (it has no internal timers/clocks).
 * This thin alarm checks if a vault's epoch duration has elapsed, and calls
 * the permissionless `signalEpochReady(vaultId)` on CadraHook.
 * This emits `EpochReady(vaultId, epoch)`, triggering CadraReactive on Lasna
 * to execute autonomous batch settlement via CadraCallback on Unichain Sepolia.
 */

import { createPublicClient, http } from "viem";
import { unichainSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { CADRA_HOOK_ABI } from "./abis";

export interface EpochAlarmConfig {
  rpcUrl?: string;
  hookAddress?: `0x${string}`;
  epochLengthSeconds?: number;
  checkIntervalMs?: number;
}

export class EpochAlarm {
  private client;
  private hookAddress: `0x${string}`;
  private epochLength: bigint;

  constructor(config?: EpochAlarmConfig) {
    this.client = createPublicClient({
      chain: unichainSepolia,
      transport: http(config?.rpcUrl || "https://sepolia.unichain.org"),
    });
    this.hookAddress = config?.hookAddress || CONTRACT_ADDRESSES.hook;
    this.epochLength = BigInt(config?.epochLengthSeconds || 3600);
  }

  /**
   * Check all known vaults and trigger signalEpochReady if epoch duration elapsed
   */
  async checkVaults(vaultIds: number[]): Promise<number[]> {
    const signaled: number[] = [];
    const now = BigInt(Math.floor(Date.now() / 1000));

    for (const vaultId of vaultIds) {
      try {
        const isSignaled = await this.client.readContract({
          address: this.hookAddress,
          abi: CADRA_HOOK_ABI,
          functionName: "epochReadySignaled",
          args: [BigInt(vaultId)],
        });

        if (isSignaled) continue;

        const vaultData = await this.client.readContract({
          address: this.hookAddress,
          abi: CADRA_HOOK_ABI,
          functionName: "getVault",
          args: [BigInt(vaultId)],
        }) as any;

        const epochStart = BigInt(vaultData.epochStart || 0);
        if (epochStart > BigInt(0) && now >= epochStart + this.epochLength) {
          signaled.push(vaultId);
        }
      } catch (err) {
        // Vault may not exist yet or RPC issue
        continue;
      }
    }

    return signaled;
  }
}
