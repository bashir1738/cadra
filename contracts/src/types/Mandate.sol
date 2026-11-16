// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Mandate defining rules for a curator's vault.
struct Mandate {
    int24 minTick;             // Lower bound of allowed price band
    int24 maxTick;             // Upper bound of allowed price band
    uint16 maxConcentrationBps;// Max portion of vault value in any single range (basis points, 10000 = 100%)
    int24 minRangeWidth;       // Minimum tick width of any range
    uint16 maxShortfallBps;    // Max allowed shortfall behind the Pace before parking (basis points, e.g. 500 = 5%)
}

/// @notice A liquidity range within a pool.
struct Range {
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
}
