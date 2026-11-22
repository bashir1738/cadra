// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {SettlementLib} from "../src/libraries/SettlementLib.sol";

contract SettlementLibTest is Test {
    uint16 constant DEFAULT_FEE_BPS = 2000; // 20%
    uint256 constant INITIAL_MULTIPLIER = 5;

    function test_settle_ahead_no_prior_deficit() public pure {
        uint256 vaultVal = 1030 * 1e6; // $1,030
        uint256 paceVal = 1010 * 1e6;  // $1,010
        uint256 bond = 200 * 1e6;      // $200 bond
        uint256 deficit = 0;
        uint256 totalShares = 1000 * 1e6;

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            DEFAULT_FEE_BPS,
            INITIAL_MULTIPLIER,
            totalShares
        );

        assertTrue(res.isAhead);
        assertEq(res.gap, 20 * 1e6, "Gap must be +$20");
        // Fee = 20% of $20 = $4
        assertEq(res.fee, 4 * 1e6, "Fee should be $4");
        assertEq(res.bondPayout, 0);
        assertEq(res.newBond, bond);
        assertEq(res.newDeficit, 0);
        assertEq(res.newMultiplier, 6, "Multiplier should increase from 5 to 6");
        assertTrue(res.feeShares > 0, "Curator should receive fee shares");
    }

    function test_settle_ahead_with_one_percent_protocol_fee() public pure {
        uint256 vaultVal = 1100 * 1e6; // $1,100
        uint256 paceVal = 1000 * 1e6;  // $1,000 (excess $100)
        uint256 bond = 200 * 1e6;
        uint256 deficit = 0;
        uint256 totalShares = 1000 * 1e6;
        uint16 perfFeeBps = 2000;      // 20% total performance fee
        uint16 protocolFeeBps = 100;   // 1% platform fee (100 bps)

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            perfFeeBps,
            protocolFeeBps,
            INITIAL_MULTIPLIER,
            totalShares
        );

        assertTrue(res.isAhead);
        assertEq(res.gap, 100 * 1e6, "Gap must be +$100");
        // Total fee = 20% of $100 = $20
        assertEq(res.fee, 20 * 1e6, "Total fee should be $20");
        // Protocol fee = 1% of $100 = $1
        assertEq(res.protocolFee, 1 * 1e6, "Protocol fee must be exactly $1 (1% of profit)");
        // Curator fee = $20 - $1 = $19
        assertEq(res.curatorFee, 19 * 1e6, "Curator fee must be $19 (19% of profit)");
        // Shares split: curator + protocol equals total feeShares
        assertEq(res.curatorShares + res.protocolShares, res.feeShares, "Shares must sum to total feeShares");
        assertEq(res.protocolShares, res.feeShares / 20, "Protocol gets exactly 1/20 (5%) of total fee shares");
    }

    function test_settle_behind_covered_by_bond() public pure {
        uint256 vaultVal = 995 * 1e6;  // $995
        uint256 paceVal = 1010 * 1e6;  // $1,010
        uint256 bond = 200 * 1e6;      // $200 bond
        uint256 deficit = 0;
        uint256 totalShares = 1000 * 1e6;

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            DEFAULT_FEE_BPS,
            INITIAL_MULTIPLIER,
            totalShares
        );

        assertFalse(res.isAhead);
        assertEq(res.gap, -15 * 1e6, "Gap must be -$15");
        assertEq(res.fee, 0);
        assertEq(res.bondPayout, 15 * 1e6, "Bond should pay $15 to followers");
        assertEq(res.newBond, 185 * 1e6, "Bond reduced by $15");
        assertEq(res.newDeficit, 0, "No deficit carry when bond covers shortfall");
        assertEq(res.newMultiplier, 3, "Multiplier should decrease from 5 to 3");
        assertEq(res.netVaultValue, 1010 * 1e6, "Net vault value restored to Pace level ($1,010)");
    }

    function test_settle_behind_exceeding_bond_creates_deficit() public pure {
        uint256 vaultVal = 800 * 1e6;  // $800
        uint256 paceVal = 1000 * 1e6;  // $1,000 (shortfall $200)
        uint256 bond = 50 * 1e6;       // $50 bond
        uint256 deficit = 0;
        uint256 totalShares = 1000 * 1e6;

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            DEFAULT_FEE_BPS,
            INITIAL_MULTIPLIER,
            totalShares
        );

        assertFalse(res.isAhead);
        assertEq(res.bondPayout, 50 * 1e6, "Bond pays max possible ($50)");
        assertEq(res.newBond, 0, "Bond exhausted");
        assertEq(res.newDeficit, 150 * 1e6, "Carried deficit D = $200 - $50 = $150");
        assertEq(res.newMultiplier, 3);
        assertEq(res.netVaultValue, 850 * 1e6);
    }

    function test_deficit_must_be_recovered_before_new_fees() public pure {
        // Vault is ahead by $50, but has carried deficit of $100
        uint256 vaultVal = 1050 * 1e6;
        uint256 paceVal = 1000 * 1e6;
        uint256 bond = 100 * 1e6;
        uint256 deficit = 100 * 1e6;
        uint256 totalShares = 1000 * 1e6;

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            DEFAULT_FEE_BPS,
            INITIAL_MULTIPLIER,
            totalShares
        );

        assertTrue(res.isAhead);
        assertEq(res.fee, 0, "Curator earns $0 fee until full deficit is recovered");
        assertEq(res.newDeficit, 50 * 1e6, "Deficit reduced by $50 to $50");
        assertEq(res.newMultiplier, 6, "Multiplier still increases on ahead epoch");
    }

    function test_multiplier_bounds() public pure {
        // Test max multiplier bound 20
        SettlementLib.SettlementResult memory resMax = SettlementLib.computeSettlement(
            1100 * 1e6, 1000 * 1e6, 100 * 1e6, 0, DEFAULT_FEE_BPS, 20, 1000 * 1e6
        );
        assertEq(resMax.newMultiplier, 20, "Multiplier cannot exceed 20");

        // Test min multiplier bound 2
        SettlementLib.SettlementResult memory resMin = SettlementLib.computeSettlement(
            900 * 1e6, 1000 * 1e6, 100 * 1e6, 0, DEFAULT_FEE_BPS, 3, 1000 * 1e6
        );
        assertEq(resMin.newMultiplier, 2, "Multiplier cannot fall below 2");
    }

    function testFuzz_invariant_follower_protection(
        uint128 vaultVal,
        uint128 paceVal,
        uint128 bond,
        uint128 deficit,
        uint8 multiplier
    ) public pure {
        vaultVal = uint128(bound(vaultVal, 1e6, 1e12));
        paceVal = uint128(bound(paceVal, 1e6, 1e12));
        bond = uint128(bound(bond, 1e6, 1e12));
        deficit = uint128(bound(deficit, 0, 1e12));
        multiplier = uint8(bound(multiplier, 2, 20));

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            bond,
            deficit,
            DEFAULT_FEE_BPS,
            multiplier,
            1000 * 1e6
        );

        // Invariant: Followers' net value never exceeds total vault assets + bond
        assertTrue(res.netVaultValue <= uint256(vaultVal) + uint256(bond), "Claims <= assets + bond");
        // Invariant: Bond payout cannot exceed posted bond
        assertTrue(res.bondPayout <= bond, "Payout <= bond");
        // Invariant: Multiplier is always between 2 and 20
        assertTrue(res.newMultiplier >= 2 && res.newMultiplier <= 20, "Multiplier in [2, 20]");
    }
}
