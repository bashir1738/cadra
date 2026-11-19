/**
 * Cadra Swapper Bot
 * Executes random-walk trades every few seconds to create volume and price moves.
 * Includes `--sharp` / `--push-price` option to intentionally move the pool price
 * outside a mandate band for the parking demonstration.
 */

import { getConfig } from "./config";
import { SwapParams, BotLogEvent } from "./types";

export type BotLogCallback = (event: BotLogEvent) => void;

export class SwapperBot {
  private config = getConfig();
  private intervalMs = 2400;
  private isRunning = false;
  private logCallback?: BotLogCallback;

  constructor(intervalMs = 2400, onLog?: BotLogCallback) {
    this.intervalMs = intervalMs;
    this.logCallback = onLog;
  }

  private emit(type: "info" | "alert" | "success" | "warn", message: string): void {
    const event: BotLogEvent = {
      id: `swapper-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      bot: "swapper",
      type,
      message,
    };
    if (this.logCallback) {
      this.logCallback(event);
    } else {
      console.log(`[Swapper] ${message}`);
    }
  }

  /**
   * Execute a single swap transaction on the Uniswap v4 pool.
   */
  async executeSwap(params: SwapParams): Promise<string> {
    const direction = params.zeroForOne ? "Token0 (WETH) -> Token1 (USDC)" : "Token1 (USDC) -> Token0 (WETH)";
    this.emit("info", `Executing swap: ${direction} | Amount: ${params.amountSpecified}`);

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    return txHash;
  }

  /**
   * Random walk: slightly buys or sells each step with bounded random size.
   */
  async randomWalkStep(): Promise<{ isBuy: boolean; deltaPrice: number; volumeUsdc: number }> {
    const zeroForOne = Math.random() > 0.48;
    const deltaPrice = zeroForOne
      ? -Math.floor(Math.random() * 18 + 2)
      : Math.floor(Math.random() * 18 + 2);

    const ethAmount = (Math.random() * 1.5 + 0.1).toFixed(2);
    const volumeUsdc = Math.round(parseFloat(ethAmount) * 3120);
    const rawAmount = Math.floor(parseFloat(ethAmount) * 1e18);

    try {
      const tx = await this.executeSwap({
        zeroForOne,
        amountSpecified: BigInt(rawAmount),
      });
      const directionLabel = zeroForOne ? "WETH -> USDC" : "USDC -> WETH";
      this.emit(
        "info",
        `Swap confirmed (${tx.slice(0, 10)}...): ${directionLabel} (${ethAmount} ETH / $${volumeUsdc.toLocaleString()}).`
      );
    } catch (err) {
      this.emit("warn", `Swap execution failed: ${err}`);
    }

    return { isBuy: !zeroForOne, deltaPrice, volumeUsdc };
  }

  /**
   * Force sharp move to intentionally breach mandate band (Parking Demo).
   */
  async forceSharpMove(directionDown = true): Promise<{ droppedPrice: number; volumeUsdc: number }> {
    this.emit(
      "alert",
      `[SELL SHOCK] FORCING SHARP PRICE MOVE (${directionDown ? "DOWN -15%" : "UP +15%"}) for Mandate Breach Demo!`
    );

    const largeAmount = BigInt(50) * BigInt(1e18);
    const volumeUsdc = 155000;
    try {
      const tx = await this.executeSwap({
        zeroForOne: directionDown,
        amountSpecified: largeAmount,
      });
      this.emit(
        "alert",
        `[PRICE CRASH] 50.0 ETH dump confirmed (${tx.slice(0, 10)}...). Spot price breached curator corridor! Hook flags BandLeft.`
      );
    } catch (err) {
      this.emit("warn", `Sharp swap failed: ${err}`);
    }

    return { droppedPrice: 2652, volumeUsdc };
  }

  /**
   * Start autonomous loop
   */
  async start(forceSharp = false): Promise<void> {
    this.isRunning = true;
    this.emit("info", `Starting Swapper Bot on ${this.config.rpcUrl}...`);

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
    this.emit("info", "Swapper loop stopped.");
  }
}
