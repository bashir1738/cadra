// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @title PaceLib
/// @notice Implements mathematical benchmark calculations for the Pace and vault valuation in token1.
library PaceLib {
    uint256 internal constant Q95 = 1 << 95;
    uint256 internal constant Q96 = 1 << 96;
    uint256 internal constant Q128 = 1 << 128;

    /// @notice Computes benchmark full-range liquidity at epoch start:
    ///         L_pace = V0 / (2 * sqrt(P0)) = (V0 * 2^95) / sqrtPriceX96_0
    /// @param startValue V0: Initial vault value in token1 raw units
    /// @param sqrtPriceX96_0 Sqrt price of token0 in token1 (X96 fixed point) at epoch start
    /// @return paceLiquidity L_pace in Uniswap v4 liquidity units
    function computePaceLiquidity(uint256 startValue, uint160 sqrtPriceX96_0) internal pure returns (uint128 paceLiquidity) {
        if (startValue == 0 || sqrtPriceX96_0 == 0) return 0;
        uint256 l = FullMath.mulDiv(startValue, Q95, sqrtPriceX96_0);
        require(l <= type(uint128).max, "PaceLiquidityOverflow");
        paceLiquidity = uint128(l);
    }

    /// @notice Computes the benchmark value of the Pace at current time t:
    ///         V_pace(t) = 2 * L_pace * sqrt(Pt) + L_pace * (dF0 * Pt + dF1)
    ///         where Pt = (sqrtPriceX96_t)^2 / 2^192
    /// @param paceLiquidity Benchmark liquidity L_pace
    /// @param sqrtPriceX96_t Time-weighted sqrt price at time t
    /// @param deltaFeeGrowth0X128 Pool global fee growth of token0 since epoch start (X128)
    /// @param deltaFeeGrowth1X128 Pool global fee growth of token1 since epoch start (X128)
    /// @return paceValue Total value of the benchmark in token1 raw units
    function computePaceValue(
        uint128 paceLiquidity,
        uint160 sqrtPriceX96_t,
        uint256 deltaFeeGrowth0X128,
        uint256 deltaFeeGrowth1X128
    ) internal pure returns (uint256 paceValue) {
        if (paceLiquidity == 0) return 0;

        // 1. Principal value: 2 * L * sqrt(P) = (L * sqrtPriceX96) / 2^95
        uint256 principal = FullMath.mulDiv(paceLiquidity, sqrtPriceX96_t, Q95);

        // 2. Token1 fee value: L * deltaFeeGrowth1X128 / 2^128
        uint256 fee1Value = FullMath.mulDiv(paceLiquidity, deltaFeeGrowth1X128, Q128);

        // 3. Token0 fee value: (L * deltaFeeGrowth0X128 / 2^128) * Pt
        //    amount0 = (L * deltaFeeGrowth0X128) / 2^128
        //    amount0 * Pt = amount0 * (sqrtPriceX96 / 2^96) * (sqrtPriceX96 / 2^96)
        uint256 fee0Amount = FullMath.mulDiv(paceLiquidity, deltaFeeGrowth0X128, Q128);
        uint256 fee0Value = token0ToToken1Value(fee0Amount, sqrtPriceX96_t);

        paceValue = principal + fee1Value + fee0Value;
    }

    /// @notice Converts an amount of token0 to its equivalent value in token1 at sqrtPriceX96
    /// @param amount0 Amount of token0
    /// @param sqrtPriceX96 Sqrt price of token0 in terms of token1 (X96)
    /// @return valueInToken1 Equivalent token1 value
    function token0ToToken1Value(uint256 amount0, uint160 sqrtPriceX96) internal pure returns (uint256 valueInToken1) {
        if (amount0 == 0 || sqrtPriceX96 == 0) return 0;
        // value = amount0 * (sqrtPriceX96 / 2^96)^2
        uint256 step1 = FullMath.mulDiv(amount0, sqrtPriceX96, Q96);
        valueInToken1 = FullMath.mulDiv(step1, sqrtPriceX96, Q96);
    }

    /// @notice Converts an amount of token1 to its equivalent amount in token0 at sqrtPriceX96
    /// @param amount1 Amount of token1
    /// @param sqrtPriceX96 Sqrt price of token0 in terms of token1 (X96)
    /// @return valueInToken0 Equivalent token0 amount
    function token1ToToken0Value(uint256 amount1, uint160 sqrtPriceX96) internal pure returns (uint256 valueInToken0) {
        if (amount1 == 0 || sqrtPriceX96 == 0) return 0;
        // amount0 = amount1 / Pt = amount1 * 2^192 / sqrtPriceX96^2
        uint256 step1 = FullMath.mulDiv(amount1, Q96, sqrtPriceX96);
        valueInToken0 = FullMath.mulDiv(step1, Q96, sqrtPriceX96);
    }
}
