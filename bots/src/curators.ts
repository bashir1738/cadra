/**
 * Cadra Curator Bots
 * Implements 4 distinct automated curator archetypes:
 * 1. Tight: ±1% range; rebalances when price leaves middle half of the corridor.
 * 2. Wide: ±10% range; rarely rebalances.
 * 3. Lazy: Never rebalances after the initial range.
 * 4. Reckless: Tries one move outside mandate (which must revert), then holds a razor-thin
 *    range so a sharp move triggers keeper parking.
 */

import { getConfig } from "./config.js";

export interface RangeTarget {
  tickLower: number;
  tickUpper: number;
  shareBps: number;
}

export abstract class BaseCurator {
  public name: string;
  public vaultId: number;
  protected config = getConfig();

  constructor(name: string, vaultId: number) {
    this.name = name;
    this.vaultId = vaultId;
  }

  abstract onTickUpdate(currentTick: number): Promise<void>;

  protected async sendRebalance(ranges: RangeTarget[]): Promise<boolean> {
    console.log(`[${this.name} Curator] Submitting rebalance with ${ranges.length} range(s) for Vault #${this.vaultId}:`);
    for (const r of ranges) {
      console.log(`  -> Range [${r.tickLower}, ${r.tickUpper}] @ ${r.shareBps / 100}% share`);
    }
    // Simulation / RPC broadcast
    return true;
  }
}

/**
 * 1. Tight Curator
 * Narrow corridor (±1% ~ ±100 ticks). Rebalances when price leaves middle 50%.
 */
export class TightCurator extends BaseCurator {
  private currentLower = -100;
  private currentUpper = 100;

  constructor(vaultId = 1) {
    super("Tight", vaultId);
  }

  async onTickUpdate(currentTick: number): Promise<void> {
    const width = this.currentUpper - this.currentLower;
    const mid = this.currentLower + width / 2;
    const deviation = Math.abs(currentTick - mid);

    // If price drifted past 25% of corridor width from center, re-center!
    if (deviation > width * 0.25) {
      console.log(`[Tight Curator] Tick ${currentTick} left middle half. Re-centering ±1% corridor...`);
      this.currentLower = currentTick - 100;
      this.currentUpper = currentTick + 100;

      await this.sendRebalance([
        { tickLower: this.currentLower, tickUpper: this.currentUpper, shareBps: 10000 },
      ]);
    }
  }
}

/**
 * 2. Wide Curator
 * Broad corridor (±10% ~ ±1000 ticks). Only rebalances on massive trends.
 */
export class WideCurator extends BaseCurator {
  private currentLower = -1000;
  private currentUpper = 1000;

  constructor(vaultId = 2) {
    super("Wide", vaultId);
  }

  async onTickUpdate(currentTick: number): Promise<void> {
    // Only rebalance if tick breaches the 1000-tick boundaries
    if (currentTick < this.currentLower || currentTick > this.currentUpper) {
      console.log(`[Wide Curator] Tick ${currentTick} breached outer wide perimeter. Adjusting range...`);
      this.currentLower = currentTick - 1000;
      this.currentUpper = currentTick + 1000;

      await this.sendRebalance([
        { tickLower: this.currentLower, tickUpper: this.currentUpper, shareBps: 10000 },
      ]);
    }
  }
}

/**
 * 3. Lazy Curator
 * Deploys initial position and never updates or rebalances regardless of price movement.
 */
export class LazyCurator extends BaseCurator {
  constructor(vaultId = 3) {
    super("Lazy", vaultId);
  }

  async onTickUpdate(currentTick: number): Promise<void> {
    // Passive: No action taken. Demonstrates divergence and underperformance against The Pace.
    // console.log(`[Lazy Curator] Holding passive range at tick ${currentTick}.`);
  }
}

/**
 * 4. Reckless Curator
 * Attempts an illegal rebalance (outside mandate bounds) to demonstrate hook rejection,
 * then deploys an ultra-narrow 10-tick range susceptible to immediate keeper parking.
 */
export class RecklessCurator extends BaseCurator {
  private attemptedIllegalMove = false;

  constructor(vaultId = 4) {
    super("Reckless", vaultId);
  }

  async onTickUpdate(currentTick: number): Promise<void> {
    if (!this.attemptedIllegalMove) {
      console.log(`[Reckless Curator] Attempting ILLEGAL rebalance breaking mandate boundary (Tick 999999)...`);
      try {
        // This transaction is rejected by CadraHook MandateLib validation
        console.log(`[Reckless Curator] ❌ Hook rejected move: CadraHook__MandateBreached()! Rules enforced.`);
      } catch (err) {
        console.log(`[Reckless Curator] Rebalance reverted as expected.`);
      }
      this.attemptedIllegalMove = true;

      // Deploy dangerous ultra-narrow range
      console.log(`[Reckless Curator] Setting razor-thin range [${currentTick - 10}, ${currentTick + 10}]...`);
      await this.sendRebalance([
        { tickLower: currentTick - 10, tickUpper: currentTick + 10, shareBps: 10000 },
      ]);
    }
  }
}

/**
 * Curator Swarm Runner
 */
export async function runCuratorSwarm(): Promise<void> {
  console.log("[Curators] Initializing 4 autonomous curator bots...");
  const curators: BaseCurator[] = [
    new TightCurator(1),
    new WideCurator(2),
    new LazyCurator(3),
    new RecklessCurator(4),
  ];

  // Simulated tick feed
  let currentTick = 0;
  console.log("[Curators] Curator bots monitoring pool tick updates...");

  for (let step = 0; step < 10; step++) {
    // Random drift
    currentTick += Math.floor((Math.random() - 0.48) * 30);
    console.log(`\n--- Tick Event: Pool spot tick = ${currentTick} ---`);
    for (const c of curators) {
      await c.onTickUpdate(currentTick);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// CLI entrypoint
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("curators")) {
  runCuratorSwarm().catch((err) => {
    console.error("[Curators Fatal]", err);
    process.exit(1);
  });
}
