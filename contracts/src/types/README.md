# Cadra Type Definitions (`contracts/src/types`)

This directory contains Solidity data structures and custom types used by CadraHook and its associated libraries.

## Files Overview

### 1. `Mandate.sol`
Defines the curator's published strategy rules:
```solidity
struct Mandate {
    int24 minTick;             // Lower boundary of allowed corridor
    int24 maxTick;             // Upper boundary of allowed corridor
    uint16 maxConcentrationBps;// Max value share in one range (basis points)
    int24 minRangeWidth;       // Minimum tick width per range
    uint16 maxShortfallBps;    // Shortfall trigger for keeper parking
}
```

### 2. `Vault.sol`
Defines vault storage records:
- Curator address and pool identifier.
- Active mandate and proposed future mandate for the next epoch.
- Posted bond, managing capacity, and capacity multiplier ($m \in [2, 20]$).
- Benchmarking state: initial Pace liquidity $L_{pace}$, initial price $P_0$, initial fee growth globals.
- Queued deposits and withdrawals.
- Parking flags (`isParked`, `bandLeft`).
