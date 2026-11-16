// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {PaceLib} from "../src/libraries/PaceLib.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";

contract PaceLibTest is Test {
    // 1 ETH = 2500 USDC
    // token0 = WETH (18 dec), token1 = USDC (6 dec)
    // price = 2500 * 10^6 / 10^18 = 2.5 * 10^-9
    // sqrtPriceX96 ~= 3.96 * 10^24
    uint160 constant SQRT_PRICE_2500 = 3961408125713216879677197;

    function setUp() public {}

    function test_computePaceLiquidity_basic() public pure {
        uint256 startVal = 1000 * 1e6; // $1,000 USDC
        uint128 L = PaceLib.computePaceLiquidity(startVal, SQRT_PRICE_2500);
        assertTrue(L > 0, "L should be non-zero");

        // At t=0 with zero fee growth, pace value must equal startVal (within rounding of 1 wei)
        uint256 paceVal = PaceLib.computePaceValue(L, SQRT_PRICE_2500, 0, 0);
        assertApproxEqAbs(paceVal, startVal, 2, "Pace value at t=0 must equal V0");
    }

    function testFuzz_computePaceLiquidity_and_InitialValue(uint128 startVal, uint160 sqrtPriceX96) public pure {
        // Bound startVal between $1 and $100M USDC (6 dec)
        startVal = uint128(bound(startVal, 1e6, 1e14));
        // Bound sqrtPrice between $10 and $100,000 per token
        sqrtPriceX96 = uint160(bound(sqrtPriceX96, 250541448375047929948, 79228162514264337593543950336));

        uint128 L = PaceLib.computePaceLiquidity(startVal, sqrtPriceX96);
        assertTrue(L > 0);

        uint256 paceVal = PaceLib.computePaceValue(L, sqrtPriceX96, 0, 0);
        assertApproxEqRel(paceVal, startVal, 0.0001e18, "Initial pace value should match startVal within 0.01%");
    }

    function test_paceValue_increases_with_price() public pure {
        uint256 startVal = 1000 * 1e6;
        uint128 L = PaceLib.computePaceLiquidity(startVal, SQRT_PRICE_2500);

        // Price rises 10%
        uint160 higherPrice = uint160((uint256(SQRT_PRICE_2500) * 10488) / 10000); // sqrt(1.10) ~= 1.0488
        uint256 valHigher = PaceLib.computePaceValue(L, higherPrice, 0, 0);

        assertTrue(valHigher > startVal, "Pace value must increase when price rises");
    }

    function test_paceValue_increases_with_fees() public pure {
        uint256 startVal = 1000 * 1e6;
        uint128 L = PaceLib.computePaceLiquidity(startVal, SQRT_PRICE_2500);

        uint256 noFees = PaceLib.computePaceValue(L, SQRT_PRICE_2500, 0, 0);
        // Fee growth of 1 USDC per unit of liquidity
        uint256 dF1 = 1 << 128; // 1 unit in X128
        uint256 withFees = PaceLib.computePaceValue(L, SQRT_PRICE_2500, 0, dF1);

        assertTrue(withFees > noFees, "Pace value must increase with fee growth");
        assertEq(withFees - noFees, L, "Fee difference should equal L * 1 unit");
    }

    function testFuzz_referenceModelComparison(
        uint128 startVal,
        uint160 price0,
        uint160 price1,
        uint64 feeGrowth0,
        uint64 feeGrowth1
    ) public pure {
        startVal = uint128(bound(startVal, 10e6, 1e12));
        price0 = uint160(bound(price0, 1e23, 1e26));
        price1 = uint160(bound(price1, 1e23, 1e26));

        uint128 L = PaceLib.computePaceLiquidity(startVal, price0);

        uint256 dF0 = uint256(feeGrowth0) << 64;
        uint256 dF1 = uint256(feeGrowth1) << 64;

        uint256 paceVal = PaceLib.computePaceValue(L, price1, dF0, dF1);

        // Reference model calculation:
        // Principal: (2 * L * price1) / 2^96
        uint256 refPrincipal = FullMath.mulDiv(L, price1, 1 << 95);
        uint256 refFee1 = FullMath.mulDiv(L, dF1, 1 << 128);
        uint256 refFee0Amount = FullMath.mulDiv(L, dF0, 1 << 128);
        uint256 refFee0Val = PaceLib.token0ToToken1Value(refFee0Amount, price1);

        uint256 refTotal = refPrincipal + refFee1 + refFee0Val;

        assertEq(paceVal, refTotal, "PaceLib must exactly match reference model");
    }
}
