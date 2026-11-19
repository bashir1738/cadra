# Cadra Autonomous Bot Engine (Web Integrated)

This directory provides the autonomous bot suite integrated directly into the `web` workspace.

## Autonomous Actors

1. **Swapper Bot (`swapper.ts`)**:
   - Executes stochastic taker trades on the Uniswap v4 pool.
   - Pushes pool spot price and generates trading volume.
   - Supports `--sharp` to force an emergency price crash (-15%) for mandate testing.

2. **Curator Swarm (`curators.ts`)**:
   - **Tight Curator**: +/-1% range; actively re-centers corridors around spot.
   - **Wide Curator**: +/-10% range; passive defensive liquidity.
   - **Lazy Curator**: Inactive; illustrates benchmark shortfall against The Pace.
   - **Reckless Curator**: Attempts out-of-bounds rebalances that are blocked inline on-chain by `CadraHook__MandateBreached()`.

3. **Keeper Daemon (`keeper.ts`)**:
   - Listens for `BandLeft` events emitted by `afterSwap`.
   - Triggers `enforce()` to freeze curators and park liquidity into The Pace benchmark on TWAP shortfall.
   - Conducts periodic epoch settlements (`settle()`).

4. **Bot Orchestrator (`orchestrator.ts`)**:
   - Runs all 3 actors concurrently in parallel loops.
   - Powers both CLI execution and browser UI telemetry at `/simulator`.

## Running the Bots

From the `web` workspace directory:

```bash
# Run all bots together in one process:
pnpm run bots

# Run individual bots:
pnpm run bots:swapper
pnpm run bots:curators
pnpm run bots:keeper

# Trigger a sharp price crash for mandate enforcement demo:
pnpm run bots:sharp
```
