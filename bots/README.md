# Cadra Autonomous Bots (`bots/`)

This directory contains automated actors designed for testing, market making, curator simulations, and keeper execution on local testnets (Anvil) or public testnets (Sepolia/Unichain).

## Bots Overview

### 1. `swapper.ts` (Trader / Market Activity)
- **Random-Walk Trades**: Emits random-sized swaps every few seconds across `token0` and `token1` to drive pool volume, fee growth globals, and tick movement.
- **Forced Sharp Price Move (`--sharp`)**: Executes an intentional large single-sided swap designed to breach curator mandate boundaries and trigger the hook's `BandLeft` callback for parking demonstrations.

**Usage:**
```bash
# Continuous random walk volume
npm run swapper

# Force sharp price drop to test parking
npm run swapper -- --sharp
```

### 2. `curators.ts` (Automated Curator Archetypes)
Simulates four distinct curator strategies:
- **Tight Curator**: Maintains a narrow corridor (±1% ~ 200 ticks) and re-centers whenever spot price leaves the middle 50% of the corridor.
- **Wide Curator**: Maintains a broad safety band (±10% ~ 2,000 ticks) and rarely rebalances.
- **Lazy Curator**: Deploys an initial position and never updates or rebalances, illustrating passive divergence from The Pace.
- **Reckless Curator**: Attempts an illegal out-of-bounds rebalance (which the hook rejects with `CadraHook__MandateBreached`), then sets a razor-thin corridor vulnerable to immediate keeper parking.

**Usage:**
```bash
npm run curators
```

### 3. `keeper.ts` (Enforcement & Settlement Daemon)
Autonomous keeper service that:
- **Listens for `BandLeft`**: When `CadraHook` flags a vault after a swap exits its price band, calls `enforce(vaultId)`. The hook values the vault at TWAP and, if shortfall exceeds `maxShortfallBps`, freezes the curator and parks the funds in The Pace.
- **Monitors Epochs**: Checks block timestamps against vault `epochStart + epochDuration` and triggers `settle(vaultId)`. Processes performance fees or bond payouts, clears queues, updates capacity multipliers, and unfreezes curators.

**Usage:**
```bash
npm run keeper
```

## Configuration

Set parameters via `.env`:
```env
RPC_URL=http://127.0.0.1:8545
HOOK_ADDRESS=0x...
POOL_MANAGER_ADDRESS=0x...
TOKEN0=0x...
TOKEN1=0x...
SWAPPER_PRIVATE_KEY=0x...
KEEPER_PRIVATE_KEY=0x...
CURATOR_TIGHT_KEY=0x...
CURATOR_WIDE_KEY=0x...
CURATOR_LAZY_KEY=0x...
CURATOR_RECKLESS_KEY=0x...
```
*(Never commit private keys containing real funds. Use local testnet keys only.)*
