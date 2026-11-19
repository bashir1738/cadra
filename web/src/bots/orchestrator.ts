/**
 * Cadra Autonomous Bot Orchestrator
 * Runs the Swapper, Curator Swarm, and Keeper Daemon concurrently as a unified engine.
 */

import { SwapperBot } from "./swapper";
import { TightCurator, WideCurator, LazyCurator, RecklessCurator, BaseCurator } from "./curators";
import { KeeperBot } from "./keeper";
import { BotLogEvent, BotMetrics } from "./types";

export interface BotEngineOptions {
  onEvent?: (event: BotLogEvent) => void;
  onMetricsUpdate?: (metrics: BotMetrics) => void;
  swapperIntervalMs?: number;
  curatorIntervalMs?: number;
  keeperIntervalMs?: number;
}

export class BotOrchestrator {
  private swapper: SwapperBot;
  private curators: BaseCurator[];
  private keeper: KeeperBot;
  private isRunning = false;

  private swapperTimer?: NodeJS.Timeout;
  private curatorTimer?: NodeJS.Timeout;
  private keeperTimer?: NodeJS.Timeout;

  private spotPrice = 3120;
  private metrics: BotMetrics = {
    totalSwaps: 0,
    totalVolumeUsdc: 0,
    totalRebalances: 0,
    totalEnforcements: 0,
    totalSettlements: 0,
    spotPrice: 3120,
  };

  private onEvent?: (event: BotLogEvent) => void;
  private onMetricsUpdate?: (metrics: BotMetrics) => void;

  constructor(options: BotEngineOptions = {}) {
    this.onEvent = options.onEvent;
    this.onMetricsUpdate = options.onMetricsUpdate;

    const logProxy = (event: BotLogEvent) => {
      if (this.onEvent) {
        this.onEvent(event);
      } else {
        console.log(`[${event.time}] [${event.bot.toUpperCase()}] ${event.message}`);
      }
    };

    this.swapper = new SwapperBot(options.swapperIntervalMs || 2400, logProxy);
    this.curators = [
      new TightCurator(1, logProxy),
      new WideCurator(2, logProxy),
      new LazyCurator(3, logProxy),
      new RecklessCurator(4, logProxy),
    ];
    this.keeper = new KeeperBot(options.keeperIntervalMs || 4800, logProxy);
  }

  private emitHookEvent(type: "info" | "alert" | "success" | "warn", message: string): void {
    const event: BotLogEvent = {
      id: `hook-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      bot: "hook",
      type,
      message,
    };
    if (this.onEvent) {
      this.onEvent(event);
    } else {
      console.log(`[HOOK] ${message}`);
    }
  }

  private syncMetrics(): void {
    this.metrics.spotPrice = this.spotPrice;
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate({ ...this.metrics });
    }
  }

  /**
   * Run one swapper tick
   */
  async tickSwapper(): Promise<void> {
    const res = await this.swapper.randomWalkStep();
    this.spotPrice = Math.max(1800, Math.min(4500, this.spotPrice + res.deltaPrice));
    this.metrics.totalSwaps += 1;
    this.metrics.totalVolumeUsdc += res.volumeUsdc;
    this.syncMetrics();
  }

  /**
   * Run one curator tick
   */
  async tickCurators(): Promise<void> {
    const randomCurator = this.curators[Math.floor(Math.random() * this.curators.length)];
    const currentTick = Math.round(Math.log(this.spotPrice / 3120) * 10000);
    const result = await randomCurator.onTickUpdate(currentTick, this.spotPrice);

    if (result.rebalanced) {
      this.metrics.totalRebalances += 1;
      this.syncMetrics();
    }
  }

  /**
   * Run one keeper tick
   */
  async tickKeeper(): Promise<void> {
    const res = await this.keeper.runStep(this.spotPrice);
    if (res.enforcedVaultId) {
      this.metrics.totalEnforcements += 1;
      this.syncMetrics();
    }
    if (res.settledVaultId) {
      this.metrics.totalSettlements += 1;
      this.syncMetrics();
    }
  }

  /**
   * Force sharp move (-15% crash) to trigger TWAP shortfall enforcement
   */
  async triggerShock(): Promise<void> {
    const res = await this.swapper.forceSharpMove(true);
    this.spotPrice = res.droppedPrice;
    this.metrics.totalSwaps += 1;
    this.metrics.totalVolumeUsdc += res.volumeUsdc;

    this.emitHookEvent(
      "alert",
      `[CadraHook] afterSwap: Spot crashed to $${this.spotPrice}. Mandate corridors breached! Flagging BandLeft.`
    );

    await this.keeper.enforceVault(1);
    await this.keeper.enforceVault(4);
    this.metrics.totalEnforcements += 2;
    this.syncMetrics();
  }

  /**
   * Start all bots simultaneously
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.emitHookEvent(
      "success",
      "Master Switch: ALL AUTONOMOUS BOTS STARTED SIMULTANEOUSLY (Swapper + Curators + Keeper)."
    );

    // Swapper interval (2.4s)
    this.swapperTimer = setInterval(() => {
      this.tickSwapper().catch(console.error);
    }, 2400);

    // Curator swarm interval (3.6s)
    this.curatorTimer = setInterval(() => {
      this.tickCurators().catch(console.error);
    }, 3600);

    // Keeper daemon interval (4.8s)
    this.keeperTimer = setInterval(() => {
      this.tickKeeper().catch(console.error);
    }, 4800);
  }

  /**
   * Stop all bots
   */
  stop(): void {
    this.isRunning = false;
    if (this.swapperTimer) clearInterval(this.swapperTimer);
    if (this.curatorTimer) clearInterval(this.curatorTimer);
    if (this.keeperTimer) clearInterval(this.keeperTimer);

    this.emitHookEvent("info", "Master Switch: All bots paused.");
  }

  getMetrics(): BotMetrics {
    return { ...this.metrics };
  }

  getSpotPrice(): number {
    return this.spotPrice;
  }

  getActiveState(): boolean {
    return this.isRunning;
  }
}
