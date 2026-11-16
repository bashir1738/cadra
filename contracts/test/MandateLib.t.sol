// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {MandateLib} from "../src/libraries/MandateLib.sol";
import {Mandate, Range} from "../src/types/Mandate.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

contract MandateLibWrapper {
    function validateMandate(Mandate memory mandate) external pure {
        MandateLib.validateMandate(mandate);
    }

    function validateRanges(Mandate memory mandate, Range[] memory ranges, int24 tickSpacing) external pure {
        MandateLib.validateRanges(mandate, ranges, tickSpacing);
    }

    function validateConcentration(uint256 rangeValue, uint256 totalVaultValue, uint16 maxConcentrationBps) external pure {
        MandateLib.validateConcentration(rangeValue, totalVaultValue, maxConcentrationBps);
    }
}

contract MandateLibTest is Test {
    MandateLibWrapper wrapper;
    Mandate validMandate;

    function setUp() public {
        wrapper = new MandateLibWrapper();
        validMandate = Mandate({
            minTick: -10000,
            maxTick: 10000,
            maxConcentrationBps: 5000, // 50%
            minRangeWidth: 200,        // 200 ticks
            maxShortfallBps: 500       // 5%
        });
    }

    function test_validateMandate_valid() public view {
        wrapper.validateMandate(validMandate);
    }

    function test_validateMandate_invalidTicks() public {
        Mandate memory m = validMandate;
        m.minTick = 100;
        m.maxTick = 50; // min > max
        vm.expectRevert(MandateLib.InvalidTickBounds.selector);
        wrapper.validateMandate(m);
    }

    function test_validateMandate_invalidRangeWidth() public {
        Mandate memory m = validMandate;
        m.minRangeWidth = 0;
        vm.expectRevert(MandateLib.InvalidRangeWidth.selector);
        wrapper.validateMandate(m);

        m.minRangeWidth = 25000; // greater than maxTick - minTick (20000)
        vm.expectRevert(MandateLib.InvalidRangeWidth.selector);
        wrapper.validateMandate(m);
    }

    function test_validateMandate_invalidConcentration() public {
        Mandate memory m = validMandate;
        m.maxConcentrationBps = 0;
        vm.expectRevert(MandateLib.InvalidConcentration.selector);
        wrapper.validateMandate(m);

        m.maxConcentrationBps = 10001;
        vm.expectRevert(MandateLib.InvalidConcentration.selector);
        wrapper.validateMandate(m);
    }

    function test_validateMandate_invalidShortfall() public {
        Mandate memory m = validMandate;
        m.maxShortfallBps = 0;
        vm.expectRevert(MandateLib.InvalidShortfall.selector);
        wrapper.validateMandate(m);

        m.maxShortfallBps = 10001;
        vm.expectRevert(MandateLib.InvalidShortfall.selector);
        wrapper.validateMandate(m);
    }

    function test_validateRanges_valid() public view {
        Range[] memory ranges = new Range[](2);
        ranges[0] = Range({tickLower: -5000, tickUpper: 0, liquidity: 1000});
        ranges[1] = Range({tickLower: 0, tickUpper: 5000, liquidity: 1000});

        wrapper.validateRanges(validMandate, ranges, 10);
    }

    function test_validateRanges_outOfBounds_reverts() public {
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: -12000, tickUpper: 0, liquidity: 1000}); // below minTick (-10000)

        vm.expectRevert(abi.encodeWithSelector(MandateLib.RangeOutOfBounds.selector, -12000, 0, -10000, 10000));
        wrapper.validateRanges(validMandate, ranges, 10);
    }

    function test_validateRanges_tooNarrow_reverts() public {
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: 0, tickUpper: 100, liquidity: 1000}); // width 100 < min 200

        vm.expectRevert(abi.encodeWithSelector(MandateLib.RangeTooNarrow.selector, 100, 200));
        wrapper.validateRanges(validMandate, ranges, 10);
    }

    function test_validateRanges_notAligned_reverts() public {
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: 3, tickUpper: 300, liquidity: 1000}); // not multiple of tickSpacing 10

        vm.expectRevert(abi.encodeWithSelector(MandateLib.RangeNotAligned.selector, 3, 300, 10));
        wrapper.validateRanges(validMandate, ranges, 10);
    }

    function test_validateConcentration() public {
        uint256 totalVaultValue = 1000 * 1e6; // $1000
        uint16 maxConcentrationBps = 5000;    // 50% ($500 max per range)

        // $400 is allowed
        wrapper.validateConcentration(400 * 1e6, totalVaultValue, maxConcentrationBps);

        // $600 should revert
        vm.expectRevert(abi.encodeWithSelector(MandateLib.ConcentrationExceeded.selector, 600 * 1e6, 500 * 1e6));
        wrapper.validateConcentration(600 * 1e6, totalVaultValue, maxConcentrationBps);
    }
}
