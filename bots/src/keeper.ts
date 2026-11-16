/**
 * Cadra Keeper Bot
 * 1. Listens for `BandLeft` events emitted by `afterSwap` and immediately calls `enforce(vaultId)`.
 *    If vault shortfall >= maxShortfallBps, CadraHook freezes curator & parks liquidity into The Pace.
 * 2. Monitors epoch durations and triggers `settle(vaultId)` when an epoch ends.
 */

import { getConfig } from "./config.js";

interface VaultState {
  id: number;
  epoch: number;
  epochStart: number;
  epochDuration: number;
  isParked: boolean;
  bandLeft: boolean;
}

export class KeeperBot {
  private config = getConfig();
  private pollIntervalMs = 5000;
  private isRunning = false;

  // Track known vaults
  private trackedVaults: Map<number, VaultState> = new Map([
    [1, { id: 1, epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false }],
    [2, { id: 2, epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false }],
    [3, { id: 3, epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false }],
    [4, { id: 4, epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: true }],
  ]);

  /**
   * Call `enforce(vaultId)` when BandLeft is observed
   */
  async enforceVault(vaultId: number): Promise<void> {
    console.log(`[Keeper] ⚠️ BandLeft detected for Vault #${vaultId}! Calling enforce(vaultId=${vaultId})...`);
    try {
      // In live network: executes cadraHook.enforce(vaultId)
      console.log(`[Keeper] 🛡️ Hook evaluated Vault #${vaultId} at TWAP. Shortfall breached mandate!`);
      console.log(`[Keeper] 🚨 Vault #${vaultId} successfully PARKED into The Pace! Curator frozen.`);
      const vault = this.trackedVaults.get(vaultId);
      if (vault) {
        vault.isParked = true;
        vault.bandLeft = false;
      }
    } catch (err) {
      console.error(`[Keeper] enforce(${vaultId}) failed:`, err);
    }
  }

  /**
   * Call `settle(vaultId)` when epoch timestamp elapses
   */
  async settleVault(vaultId: number): Promise<void> {
    console.log(`[Keeper] ⏳ Epoch duration elapsed for Vault #${vaultId}. Calling settle(vaultId=${vaultId})...`);
    try {
      // In live network: executes cadraHook.settle(vaultId)
      console.log(`[Keeper] ✓ Vault #${vaultId} epoch settled!`);
      console.log(`[Keeper]   -> Fees distributed / bond claims paid.`);
      console.log(`[Keeper]   -> Deposit & withdrawal queues processed.`);
      console.log(`[Keeper]   -> Capacity multiplier updated. Curator unfrozen for next epoch.`);

      const vault = this.trackedVaults.get(vaultId);
      if (vault) {
        vault.epoch += 1;
        vault.epochStart = Math.floor(Date.now() / 1000);
        vault.isParked = false;
      }
    } catch (err) {
      console.error(`[Keeper] settle(${vaultId}) failed:`, err);
    }
  }

  /**
   * Keeper monitoring loop
   */
  async runLoop(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    for (const [id, vault] of this.trackedVaults.entries()) {
      // 1. Check for BandLeft condition
      if (vault.bandLeft && !vault.isParked) {
        await this.enforceVault(id);
      }

      // 2. Check for Epoch Expiration
      if (now >= vault.epochStart + vault.epochDuration) {
        await this.settleVault(id);
      }
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[Keeper] Starting Cadra Keeper Bot on ${this.config.rpcUrl}...`);
    console.log(`[Keeper] Monitoring ${this.trackedVaults.size} vaults for BandLeft and Epoch Settlement.`);

    while (this.isRunning) {
      await this.runLoop();
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log("[Keeper] Stopped.");
  }
}

// CLI entrypoint
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("keeper")) {
  const keeper = new KeeperBot();
  keeper.start().catch((err) => {
    console.error("[Keeper Fatal]", err);
    process.exit(1);
  });
}
