// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {SettlementLib} from "../src/libraries/SettlementLib.sol";

contract FeeComparisonTest is Test {
    uint256 constant INITIAL_DEPOSIT = 100_000 * 1e6; // $100,000 USDC
    uint256 constant BOND = 20_000 * 1e6;            // $20,000 USDC bond
    uint16 constant CADRA_FEE_BPS = 2000;            // 20% curator fee rate
    uint256 constant INITIAL_SHARES = 100_000 * 1e6;

    function test_log_fee_comparison_table() public view {
        console2.log("==========================================================================================");
        console2.log("                               CADRA VS TRADITIONAL FEE COMPARISON                        ");
        console2.log("==========================================================================================");
        console2.log("Initial Follower Capital: $100,000 USDC | Cadra Outperformance Fee Rate: 20%");
        console2.log("------------------------------------------------------------------------------------------");
        console2.log("| Scenario                 | Vault Value | Pace Value | Flat 10% Fee | Flat 20% Fee | Cadra Fee |");
        console2.log("------------------------------------------------------------------------------------------");

        // Scenario 1: Market Move Only (Passive Beta +20%)
        // Both vault and Pace rise from $100k to $120k purely from market appreciation
        {
            uint256 vaultVal = 120_000 * 1e6;
            uint256 paceVal = 120_000 * 1e6;
            _logScenario("1. Market Move Only (+20%)", vaultVal, paceVal);
        }

        // Scenario 2: Market Move + Passive LP Fees (Zero Alpha)
        // Market rises to $120k + $5k baseline fee growth = $125k for both
        {
            uint256 vaultVal = 125_000 * 1e6;
            uint256 paceVal = 125_000 * 1e6;
            _logScenario("2. Move + Pool Fees (0 Alpha)", vaultVal, paceVal);
        }

        // Scenario 3: Real Outperformance (Active Alpha +$15,000 above Pace)
        // Pace is $125k, but active curator concentrated ranges achieve $140k
        {
            uint256 vaultVal = 140_000 * 1e6;
            uint256 paceVal = 125_000 * 1e6;
            _logScenario("3. Real Outperformance (+Alpha)", vaultVal, paceVal);
        }

        console2.log("------------------------------------------------------------------------------------------");
        console2.log("Key Takeaway:");
        console2.log("In Scenarios 1 & 2, traditional vault managers charge $2,000 - $5,000 for passive market luck.");
        console2.log("Cadra charges exactly $0 because the curator did not beat the passive Pace benchmark.");
        console2.log("In Scenario 3, Cadra charges only on the true $15,000 surplus value created ($3,000).");
        console2.log("==========================================================================================");
    }

    function _logScenario(string memory name, uint256 vaultVal, uint256 paceVal) internal view {
        uint256 traditionalProfit = vaultVal > INITIAL_DEPOSIT ? vaultVal - INITIAL_DEPOSIT : 0;
        uint256 flat10 = (traditionalProfit * 10) / 100;
        uint256 flat20 = (traditionalProfit * 20) / 100;

        SettlementLib.SettlementResult memory res = SettlementLib.computeSettlement(
            vaultVal,
            paceVal,
            BOND,
            0, // no carried deficit
            CADRA_FEE_BPS,
            5, // multiplier
            INITIAL_SHARES
        );

        console2.log(
            string.concat(
                "| ", name,
                " | $", vm.toString(vaultVal / 1e6),
                " | $", vm.toString(paceVal / 1e6),
                " | $", vm.toString(flat10 / 1e6),
                " | $", vm.toString(flat20 / 1e6),
                " | $", vm.toString(res.fee / 1e6), " |"
            )
        );

        if (vaultVal == paceVal) {
            assertEq(res.fee, 0, "Cadra fee must be 0 when matching Pace");
        } else if (vaultVal > paceVal) {
            uint256 excess = vaultVal - paceVal;
            assertEq(res.fee, (excess * CADRA_FEE_BPS) / 10000, "Cadra fee must be 20% of excess");
        }
    }
}
