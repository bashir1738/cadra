/**
 * Thin Epoch Alarm for Cadra Protocol
 * 
 * Reactive Network is purely event-driven (it has no internal timers/clocks).
 * This thin alarm checks if a vault's epoch duration has elapsed, and calls
 * the permissionless `signalEpochReady(vaultId)` on CadraHook.
 * This emits `EpochReady(vaultId, epoch)`, triggering CadraReactive on Lasna
 * to execute autonomous batch settlement via CadraCallback on Unichain Sepolia.
 * 
 * Verified Settlement Hashes:
 * - signalEpochReady(1): 0x52928d6272359d7ebbe5bc12c092a2556273f4b60f2622039df4961359323cee (Block 68400766)
 * - settle(1):           0xe848006291887cfd0c9d4d6d3f9532c771b3aad2d01787865084e216102d5545 (Block 68400832)
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { unichainSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import { CADRA_HOOK_ABI } from "./abis";

export interface EpochAlarmConfig {
  rpcUrl?: string;
  hookAddress?: `0x${string}`;
  epochLengthSeconds?: number;
  privateKey?: `0x${string}`;
}

export class EpochAlarm {
  private client;
  private hookAddress: `0x${string}`;
  private epochLength: bigint;
  private privateKey?: `0x${string}`;

  constructor(config?: EpochAlarmConfig) {
    this.client = createPublicClient({
      chain: unichainSepolia,
      transport: http(config?.rpcUrl || "https://sepolia.unichain.org"),
    });
    this.hookAddress = config?.hookAddress || CONTRACT_ADDRESSES.hook;
    this.epochLength = BigInt(config?.epochLengthSeconds || 3600);
    this.privateKey = config?.privateKey;
  }

  /**
   * Check all known vaults and return IDs of vaults ready to settle
   */
  async checkVaults(vaultIds: number[]): Promise<number[]> {
    const readyToSettle: number[] = [];
    const now = BigInt(Math.floor(Date.now() / 1000));

    for (const vaultId of vaultIds) {
      try {
        const isSignaled = await this.client.readContract({
          address: this.hookAddress,
          abi: CADRA_HOOK_ABI,
          functionName: "epochReadySignaled",
          args: [BigInt(vaultId)],
        });

        const vaultData = await this.client.readContract({
          address: this.hookAddress,
          abi: CADRA_HOOK_ABI,
          functionName: "getVault",
          args: [BigInt(vaultId)],
        }) as any;

        const epochStart = BigInt(vaultData.epochStart || 0);
        if (epochStart > BigInt(0) && now >= epochStart + this.epochLength) {
          readyToSettle.push(vaultId);
        }
      } catch (err) {
        continue;
      }
    }

    return readyToSettle;
  }

  /**
   * Execute permissionless signalEpochReady on CadraHook
   */
  async triggerSignalEpochReady(vaultId: number): Promise<`0x${string}`> {
    if (!this.privateKey) throw new Error("Private key required to broadcast transactions");
    const account = privateKeyToAccount(this.privateKey);
    const wallet = createWalletClient({
      account,
      chain: unichainSepolia,
      transport: http(),
    });

    const hash = await wallet.writeContract({
      address: this.hookAddress,
      abi: CADRA_HOOK_ABI,
      functionName: "signalEpochReady",
      args: [BigInt(vaultId)],
    });

    return hash;
  }

  /**
   * Execute settlement cycle
   */
  async triggerSettle(vaultId: number): Promise<`0x${string}`> {
    if (!this.privateKey) throw new Error("Private key required to broadcast transactions");
    const account = privateKeyToAccount(this.privateKey);
    const wallet = createWalletClient({
      account,
      chain: unichainSepolia,
      transport: http(),
    });

    const hash = await wallet.writeContract({
      address: this.hookAddress,
      abi: CADRA_HOOK_ABI,
      functionName: "settle",
      args: [BigInt(vaultId)],
    });

    return hash;
  }
}
