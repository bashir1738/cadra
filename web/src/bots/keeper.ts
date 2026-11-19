/**
 * Cadra Epoch Keeper & Reactive Sentinel
 * 
 * NOTE: Emergency parking (enforce) is now 100% autonomous and bot-free via Reactive Network.
 * CadraReactive on Lasna listens directly to `BandLeft` logs on Unichain Sepolia and executes
 * `enforce(vaultId)` in ~1 second via CadraCallback.
 * 
 * This keeper only runs the thin epoch alarm: calling the permissionless `signalEpochReady(vaultId)`
 * when an epoch concludes. This emits `EpochReady`, triggering CadraReactive to execute batch settlement.
 */

import { getConfig } from "./config";
import { VaultState, BotLogEvent } from "./types";
import { EpochAlarm } from "./epochAlarm";

export type KeeperLogCallback = (event: BotLogEvent) => void;

export class KeeperBot {
  private config = getConfig();
  private pollIntervalMs = 4800;
  private isRunning = false;
  private logCallback?: KeeperLogCallback;
  private alarm = new EpochAlarm();

  // Track known vaults
  private trackedVaults: Map<number, VaultState> = new Map([
    [1, { id: 1, name: "Alpha Yield", epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false, minPrice: 2800, maxPrice: 3500 }],
    [2, { id: 2, name: "Defensive WETH", epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false, minPrice: 2000, maxPrice: 4500 }],
    [3, { id: 3, name: "Passive Index", epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false, minPrice: 2500, maxPrice: 3800 }],
    [4, { id: 4, name: "Reckless Degens", epoch: 1, epochStart: Math.floor(Date.now() / 1000) - 3500, epochDuration: 3600, isParked: false, bandLeft: false, minPrice: 3050, maxPrice: 3180 }],
  ]);

  constructor(pollIntervalMs = 4800, onLog?: KeeperLogCallback) {
    this.pollIntervalMs = pollIntervalMs;
    this.logCallback = onLog;
  }

  private emit(type: "info" | "alert" | "success" | "warn", message: string): void {
    const event: BotLogEvent = {
      id: `keeper-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      bot: "keeper",
      type,
      message,
    };
    if (this.logCallback) {
      this.logCallback(event);
    } else {
      console.log(`[Keeper] ${message}`);
    }
  }

  /**
   * Check if any epoch has ended and signal EpochReady for Reactive settlement.
   * Emergency enforce is handled entirely by Reactive Network.
   */
  async runStep(): Promise<{ signaledVaultIds?: number[] }> {
    const vaultIds = Array.from(this.trackedVaults.keys());
    const signaledVaultIds = await this.alarm.checkVaults(vaultIds);

    for (const vId of signaledVaultIds) {
      const v = this.trackedVaults.get(vId);
      const name = v?.name || `Vault #${vId}`;
      this.emit("info", `[EPOCH ALARM] Epoch ended for ${name}. Calling signalEpochReady(${vId})...`);
      this.emit("success", `[REACTIVE READY] EpochReady emitted for ${name}. CadraReactive triggered.`);
    }

    return { signaledVaultIds };
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.emit("info", `Starting Cadra Epoch Keeper on ${this.config.rpcUrl}...`);
    this.emit("info", `Monitoring ${this.trackedVaults.size} vaults for EpochReady signals. Emergency parking is autonomously handled by Reactive Network.`);

    while (this.isRunning) {
      await this.runStep();
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  stop(): void {
    this.isRunning = false;
    this.emit("info", "Keeper loop stopped.");
  }
}
