// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @title TwapOracle
/// @notice Implements a ring-buffer oracle storing time-weighted tick accumulations.
library TwapOracle {
    uint16 internal constant BUFFER_SIZE = 256;

    struct Observation {
        uint32 timestamp;
        int56 tickCumulative;
        bool initialized;
    }

    struct Buffer {
        uint16 index;
        uint16 cardinality;
        Observation[256] observations;
    }

    error BufferNotInitialized();
    error WindowTooLarge();

    /// @notice Initializes the oracle buffer with an initial tick and timestamp
    function initialize(Buffer storage buffer, int24 initialTick) internal {
        buffer.observations[0] = Observation({
            timestamp: uint32(block.timestamp),
            tickCumulative: 0,
            initialized: true
        });
        buffer.index = 0;
        buffer.cardinality = 1;
    }

    /// @notice Records an observation if in a new block. Called in beforeSwap.
    function write(Buffer storage buffer, int24 currentTick) internal returns (uint16 newIndex) {
        Observation memory last = buffer.observations[buffer.index];
        uint32 currentTimestamp = uint32(block.timestamp);

        // At most one observation per block
        if (currentTimestamp == last.timestamp) {
            return buffer.index;
        }

        uint32 delta = currentTimestamp - last.timestamp;
        int56 newCumulative = last.tickCumulative + int56(currentTick) * int56(uint56(delta));

        newIndex = (buffer.index + 1) % BUFFER_SIZE;
        buffer.observations[newIndex] = Observation({
            timestamp: currentTimestamp,
            tickCumulative: newCumulative,
            initialized: true
        });
        buffer.index = newIndex;
        if (buffer.cardinality < BUFFER_SIZE) {
            buffer.cardinality++;
        }
    }

    /// @notice Returns the time-weighted average tick over a requested window (in seconds)
    function getTwapTick(Buffer storage buffer, uint32 window, int24 currentTick) internal view returns (int24 twapTick) {
        if (buffer.cardinality == 0) revert BufferNotInitialized();

        Observation memory latest = buffer.observations[buffer.index];
        uint32 currentTimestamp = uint32(block.timestamp);

        // If time passed since latest recorded observation, extend cumulative to now
        int56 currentCumulative = latest.tickCumulative;
        if (currentTimestamp > latest.timestamp) {
            currentCumulative += int56(currentTick) * int56(uint56(currentTimestamp - latest.timestamp));
        }

        if (window == 0) {
            return currentTick;
        }

        uint32 targetTime = currentTimestamp >= window ? currentTimestamp - window : 0;

        // Find the oldest valid observation at or before targetTime
        Observation memory targetObs = findSurroundingObservation(buffer, targetTime, latest);

        uint32 timeElapsed = currentTimestamp - targetObs.timestamp;
        if (timeElapsed == 0) {
            return currentTick;
        }

        int56 deltaCumulative = currentCumulative - targetObs.tickCumulative;
        twapTick = int24(deltaCumulative / int56(uint56(timeElapsed)));
    }

    /// @notice Searches the ring buffer for the observation closest to targetTime
    function findSurroundingObservation(
        Buffer storage buffer,
        uint32 targetTime,
        Observation memory latest
    ) private view returns (Observation memory) {
        uint16 count = buffer.cardinality;
        uint16 curr = buffer.index;

        Observation memory best = buffer.observations[curr];
        for (uint16 i = 0; i < count; i++) {
            uint16 idx = (curr + BUFFER_SIZE - i) % BUFFER_SIZE;
            Observation memory obs = buffer.observations[idx];
            if (!obs.initialized) break;
            if (obs.timestamp <= targetTime) {
                return obs;
            }
            best = obs; // Oldest observed so far
        }
        return best;
    }

    /// @notice Converts tick to sqrtPriceX96
    function tickToSqrtPriceX96(int24 tick) internal pure returns (uint160) {
        return TickMath.getSqrtPriceAtTick(tick);
    }
}
