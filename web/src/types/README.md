# Cadra Web Types (`web/src/types`)

This directory defines TypeScript interfaces for data structures used across the Cadra frontend.

## Key Types (`cadra.ts`)

- `Mandate`: Price band limits (`minPrice`, `maxPrice`, `minTick`, `maxTick`), `maxConcentrationBps`, `minRangeWidth`, and `maxShortfallBps`.
- `RangePosition`: Individual concentrated liquidity positions with price limits and allocation percentages.
- `EpochRecord`: Historical records of epoch settlement outcomes (`"ahead"` or `"behind"`), vault values, Pace values, and fee/payout distributions.
- `VaultData`: Comprehensive vault state including curator address, bond amounts, capacity multiplier, active ranges, and mandate parameters.
- `UserPosition`: Follower position details (deposited value, current value, shares, and equivalent value in The Pace).
