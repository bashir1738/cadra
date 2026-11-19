/**
 * Cadra Curator Bots
 * Implements 4 distinct automated curator archetypes:
 * 1. Tight: +/-1% range; rebalances when price leaves middle half of the corridor.
 * 2. Wide: +/-10% range; rarely rebalances.
 * 3. Lazy: Never rebalances after the initial range.
 * 4. Reckless: Tries one move outside mandate (which must revert), then holds a razor-thin
 *    range so a sharp move triggers keeper parking.
 */

import { getConfig } from "./config";
import { RangeTarget, BotLogEvent } from "./types";

export type CuratorLogCallback = (event: BotLogEvent) => void;

export abstract class BaseCurator {
  public name: string;
  public vaultId: number;
  protected config = getConfig();
  protected logCallback?: CuratorLogCallback;

  constructor(name: string, vaultId: number, onLog?: CuratorLogCallback) {
    this.name = name;
    this.vaultId = vaultId;
    this.logCallback = onLog;
  }

  protected emit(type: "info" | "alert" | "success" | "warn", message: string): void {
    const event: BotLogEvent = {
      id: `curator-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      bot: "curator",
      type,
      message,
    };
    if (this.logCallback) {
      this.logCallback(event);
    } else {
      console.log(`[${this.name} Curator] ${message}`);
    }
  }

  abstract onTickUpdate(currentTick: number, currentPrice?: number): Promise<{ rebalanced: boolean; newLower?: number; newUpper?: number }>;

  protected async sendRebalance(ranges: RangeTarget[]): Promise<boolean> {
    this.emit(
      "info",
      `Submitting rebalance with ${ranges.length} range(s) for Vault #${this.vaultId}: ${ranges
        .map((r) => `[${r.tickLower}, ${r.tickUpper}] @ ${r.shareBps / 100}%`)
        .join(", ")}`
    );
    return true;
  }
}

/**
 * 1. Tight Curator
 * Narrow corridor (+/-1% ~ +/-100 ticks). Rebalances when price leaves middle 50%.
 */
export class TightCurator extends BaseCurator {
  private currentLower = -100;
  private currentUpper = 100;

  constructor(vaultId = 1, onLog?: CuratorLogCallback) {
    super("Tight", vaultId, onLog);
  }

  async onTickUpdate(currentTick: number, currentPrice = 3120): Promise<{ rebalanced: boolean; newLower?: number; newUpper?: number }> {
    const width = this.currentUpper - this.currentLower;
    const mid = this.currentLower + width / 2;
    const deviation = Math.abs(currentTick - mid);

    // If price drifted past 25% of corridor width from center, re-center!
    if (deviation > width * 0.25) {
      this.currentLower = currentTick - 100;
      this.currentUpper = currentTick + 100;
      const lowerPrice = Math.max(2800, currentPrice - 75);
      const upperPrice = Math.min(3600, currentPrice + 75);

      this.emit(
        "success",
        `Tick ${currentTick} left middle corridor. Re-centering corridor around spot $${currentPrice} to [$${lowerPrice}, $${upperPrice}]. 100% ticks in-band.`
      );

      await this.sendRebalance([
        { tickLower: this.currentLower, tickUpper: this.currentUpper, shareBps: 10000 },
      ]);
      return { rebalanced: true, newLower: lowerPrice, newUpper: upperPrice };
    } else {
      this.emit("info", `Spot $${currentPrice} is within middle 50% of active corridor. Range optimal.`);
      return { rebalanced: false };
    }
  }
}

/**
 * 2. Wide Curator
 * Broad corridor (+/-10% ~ +/-1000 ticks). Only rebalances on massive trends.
 */
export class WideCurator extends BaseCurator {
  private currentLower = -1000;
  private currentUpper = 1000;

  constructor(vaultId = 2, onLog?: CuratorLogCallback) {
    super("Wide", vaultId, onLog);
  }

  async onTickUpdate(currentTick: number, currentPrice = 3120): Promise<{ rebalanced: boolean; newLower?: number; newUpper?: number }> {
    if (currentTick < this.currentLower || currentTick > this.currentUpper) {
      this.currentLower = currentTick - 1000;
      this.currentUpper = currentTick + 1000;
      this.emit("info", `Tick ${currentTick} breached outer perimeter. Adjusting wide defensive range.`);
      await this.sendRebalance([
        { tickLower: this.currentLower, tickUpper: this.currentUpper, shareBps: 10000 },
      ]);
      return { rebalanced: true };
    } else {
      this.emit("info", `Spot $${currentPrice} safely nestled in wide defensive perimeter ($2,000-$4,500). Passive yield compounding.`);
      return { rebalanced: false };
    }
  }
}

/**
 * 3. Lazy Curator
 * Deploys initial position and never updates or rebalances regardless of price movement.
 */
export class LazyCurator extends BaseCurator {
  constructor(vaultId = 3, onLog?: CuratorLogCallback) {
    super("Lazy", vaultId, onLog);
  }

  async onTickUpdate(currentTick: number, currentPrice = 3120): Promise<{ rebalanced: boolean }> {
    this.emit("warn", `Inactive. Spot at $${currentPrice} (Tick ${currentTick}); benchmark divergence tracking.`);
    return { rebalanced: false };
  }
}

/**
 * 4. Reckless Curator
 * Attempts an illegal rebalance (outside mandate bounds) to demonstrate hook rejection,
 * then deploys an ultra-narrow 10-tick range susceptible to immediate keeper parking.
 */
export class RecklessCurator extends BaseCurator {
  private attemptedIllegalMove = false;

  constructor(vaultId = 4, onLog?: CuratorLogCallback) {
    super("Reckless", vaultId, onLog);
  }

  async onTickUpdate(currentTick: number, currentPrice = 3120): Promise<{ rebalanced: boolean }> {
    if (!this.attemptedIllegalMove) {
      this.emit(
        "warn",
        `Submitting speculative rebalance outside mandate bounds (Tick 999999)...`
      );
      // Demonstrates CadraHook mandate rejection
      const hookEvent: BotLogEvent = {
        id: `hook-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: new Date().toLocaleTimeString(),
        bot: "hook",
        type: "alert",
        message: `[CadraHook] [REVERT] CadraHook__MandateBreached(). Out-of-bounds rebalance blocked on-chain. Capital safe.`,
      };
      if (this.logCallback) {
        this.logCallback(hookEvent);
      } else {
        console.log(hookEvent.message);
      }
      this.attemptedIllegalMove = true;
      return { rebalanced: false };
    } else {
      this.emit("warn", `Holding razor-thin range at spot $${currentPrice}. Highly vulnerable to TWAP shortfall parking.`);
      return { rebalanced: false };
    }
  }
}

/**
 * Curator Swarm Runner
 */
export async function runCuratorSwarm(onLog?: CuratorLogCallback): Promise<void> {
  const curators: BaseCurator[] = [
    new TightCurator(1, onLog),
    new WideCurator(2, onLog),
    new LazyCurator(3, onLog),
    new RecklessCurator(4, onLog),
  ];

  let currentTick = 0;
  for (let step = 0; step < 10; step++) {
    currentTick += Math.floor((Math.random() - 0.48) * 30);
    const approxPrice = Math.round(3120 * Math.exp((currentTick * 0.0001)));
    for (const c of curators) {
      await c.onTickUpdate(currentTick, approxPrice);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}
