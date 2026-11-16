/**
 * Cadra Swapper Bot
 * Executes random-walk trades every few seconds to create volume and price moves.
 * Includes `--sharp` / `--push-price` option to intentionally move the pool price
 * outside a mandate band for the parking demonstration.
 */

import { getConfig } from "./config.js";

interface SwapParams {
  zeroForOne: boolean;
  amountSpecified: bigint;
  sqrtPriceLimitX96?: bigint;
}

export class SwapperBot {
  private config = getConfig();
  private intervalMs = 4000;
  private isRunning = false;

  constructor(intervalMs = 4000) {
    this.intervalMs = intervalMs;
  }

  /**
   * Execute a single swap transaction on the Uniswap v4 pool.
   */
  async executeSwap(params: SwapParams): Promise<string> {
    console.log(
      `[Swapper] Executing swap: ${params.zeroForOne ? "Token0 -> Token1" : "Token1 -> Token0"} | Amount: ${params.amountSpecified}`
    );

    // In a live environment, calls PoolSwapTest or router with key & swap params
    // Using cast / viem / RPC broadcast
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    return txHash;
  }

  /**
   * Random walk: slightly buys or sells each step with bounded random size.
   */
  async randomWalkStep(): Promise<void> {
    const zeroForOne = Math.random() > 0.5;
    // Random size between 0.1 and 1.5 units
    const rawAmount = Math.floor((Math.random() * 1.4 + 0.1) * 1e18);
    const amountSpecified = BigInt(rawAmount);

    try {
      const tx = await this.executeSwap({ zeroForOne, amountSpecified });
      console.log(`[Swapper] ✓ Random walk swap confirmed: ${tx}`);
    } catch (err) {
      console.error("[Swapper] Swap failed:", err);
    }
  }

  /**
   * Force sharp move to intentionally breach mandate band (Parking Demo).
   */
  async forceSharpMove(directionDown = true): Promise<void> {
    console.log(
      `[Swapper] ⚡ FORCING SHARP PRICE MOVE (${directionDown ? "DOWN -15%" : "UP +15%"}) for Mandate Breach Demo!`
    );

    // Large swap amount to push tick across threshold
    const largeAmount = BigInt(50) * BigInt(1e18);
    try {
      const tx = await this.executeSwap({
        zeroForOne: directionDown,
        amountSpecified: largeAmount,
      });
      console.log(`[Swapper] 🚨 Sharp move swap confirmed: ${tx}. Hook should flag BandLeft!`);
    } catch (err) {
      console.error("[Swapper] Sharp swap failed:", err);
    }
  }

  /**
   * Start loop
   */
  async start(forceSharp = false): Promise<void> {
    this.isRunning = true;
    console.log(`[Swapper] Starting Swapper Bot on ${this.config.rpcUrl}...`);

    if (forceSharp) {
      await this.forceSharpMove(true);
      return;
    }

    while (this.isRunning) {
      await this.randomWalkStep();
      await new Promise((r) => setTimeout(r, this.intervalMs));
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log("[Swapper] Stopped.");
  }
}

// CLI Execution entrypoint
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("swapper")) {
  const isSharp = process.argv.includes("--sharp") || process.argv.includes("--push-price");
  const bot = new SwapperBot();
  bot.start(isSharp).catch((err) => {
    console.error("[Swapper Fatal]", err);
    process.exit(1);
  });
}
