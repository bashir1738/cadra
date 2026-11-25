// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {Mandate, Range} from "../types/Mandate.sol";

/// @title MandateLib
/// @notice Validation and enforcement logic for curator mandates and rebalance ranges.
library MandateLib {
    uint16 internal constant MAX_BPS = 10000;

    /// @notice Returns true if the vault has been permanently closed (epochStart set to sentinel).
    function isClosed(uint256 epochStart) internal pure returns (bool) {
        return epochStart == type(uint256).max;
    }

    error InvalidTickBounds();
    error InvalidRangeWidth();
    error InvalidConcentration();
    error InvalidShortfall();
    error EmptyRanges();
    error RangeOutOfBounds(int24 tickLower, int24 tickUpper, int24 minTick, int24 maxTick);
    error RangeTooNarrow(int24 width, int24 minRangeWidth);
    error RangeNotAligned(int24 tickLower, int24 tickUpper, int24 tickSpacing);
    error ConcentrationExceeded(uint256 rangeValue, uint256 maxAllowed);

    /// @notice Validates a newly created or proposed mandate
    function validateMandate(Mandate memory mandate) internal pure {
        if (mandate.minTick >= mandate.maxTick) revert InvalidTickBounds();
        if (mandate.minTick < TickMath.MIN_TICK || mandate.maxTick > TickMath.MAX_TICK) revert InvalidTickBounds();
        if (mandate.minRangeWidth <= 0 || (mandate.maxTick - mandate.minTick) < mandate.minRangeWidth) revert InvalidRangeWidth();
        if (mandate.maxConcentrationBps == 0 || mandate.maxConcentrationBps > MAX_BPS) revert InvalidConcentration();
        if (mandate.maxShortfallBps == 0 || mandate.maxShortfallBps > MAX_BPS) revert InvalidShortfall();
    }

    /// @notice Validates that a set of ranges complies with the mandate and tickSpacing
    function validateRanges(
        Mandate memory mandate,
        Range[] memory ranges,
        int24 tickSpacing
    ) internal pure {
        if (ranges.length == 0) revert EmptyRanges();
        for (uint256 i = 0; i < ranges.length; i++) {
            Range memory r = ranges[i];
            if (r.tickLower >= r.tickUpper) revert InvalidTickBounds();
            if (r.tickLower < mandate.minTick || r.tickUpper > mandate.maxTick) {
                revert RangeOutOfBounds(r.tickLower, r.tickUpper, mandate.minTick, mandate.maxTick);
            }
            if ((r.tickUpper - r.tickLower) < mandate.minRangeWidth) {
                revert RangeTooNarrow(r.tickUpper - r.tickLower, mandate.minRangeWidth);
            }
            if (r.tickLower % tickSpacing != 0 || r.tickUpper % tickSpacing != 0) {
                revert RangeNotAligned(r.tickLower, r.tickUpper, tickSpacing);
            }
        }
    }

    /// @notice Validates concentration for an individual range against total vault value
    function validateConcentration(
        uint256 rangeValue,
        uint256 totalVaultValue,
        uint16 maxConcentrationBps
    ) internal pure {
        if (totalVaultValue == 0) return;
        uint256 maxAllowed = FullMath.mulDiv(totalVaultValue, maxConcentrationBps, MAX_BPS);
        // Allow a small rounding leeway of 1 unit
        if (rangeValue > maxAllowed + 1) {
            revert ConcentrationExceeded(rangeValue, maxAllowed);
        }
    }
}
