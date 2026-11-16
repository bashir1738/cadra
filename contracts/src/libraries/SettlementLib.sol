// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";

/// @title SettlementLib
/// @notice Implements performance fee, bond payout, deficit tracking, and multiplier updates.
library SettlementLib {
    uint256 internal constant BPS_DENOMINATOR = 10000;
    uint256 internal constant MIN_MULTIPLIER = 2;
    uint256 internal constant MAX_MULTIPLIER = 20;

    struct SettlementResult {
        bool isAhead;
        uint256 fee;           // Curator performance fee (token1)
        uint256 feeShares;     // Equivalent shares minted to curator
        uint256 bondPayout;    // Payout from bond to followers (token1)
        uint256 newBond;       // Updated bond balance
        uint256 newDeficit;    // Updated deficit carry D
        uint256 newMultiplier; // Updated capacity multiplier m
        uint256 netVaultValue; // Vault value after fee / bond payout
        int256 gap;            // vaultValue - paceValue
    }

    /// @notice Computes epoch settlement outcomes according to Cadra rules.
    /// @param vaultValue Current total valuation of the vault in token1
    /// @param paceValue Current benchmark valuation of the Pace in token1
    /// @param currentBond Current bond posted by curator in token1
    /// @param currentDeficit Current deficit carry D
    /// @param perfFeeBps Performance fee in bps (e.g. 2000 = 20%)
    /// @param currentMultiplier Current capacity multiplier m
    /// @param totalShares Current total shares of the vault
    function computeSettlement(
        uint256 vaultValue,
        uint256 paceValue,
        uint256 currentBond,
        uint256 currentDeficit,
        uint16 perfFeeBps,
        uint256 currentMultiplier,
        uint256 totalShares
    ) internal pure returns (SettlementResult memory res) {
        if (vaultValue >= paceValue) {
            // Ahead of the Pace
            res.isAhead = true;
            uint256 excess = vaultValue - paceValue;
            res.gap = int256(excess);

            // Deficit must be recovered first: eligible profit = max(0, excess - deficit)
            uint256 eligibleExcess = 0;
            if (excess > currentDeficit) {
                eligibleExcess = excess - currentDeficit;
                res.newDeficit = 0;
            } else {
                res.newDeficit = currentDeficit - excess;
            }

            // Fee = perfFeeBps * eligibleExcess / 10000
            res.fee = FullMath.mulDiv(eligibleExcess, perfFeeBps, BPS_DENOMINATOR);
            res.bondPayout = 0;
            res.newBond = currentBond;

            // Capacity multiplier increases by 1, up to MAX_MULTIPLIER (20)
            res.newMultiplier = currentMultiplier + 1;
            if (res.newMultiplier > MAX_MULTIPLIER) {
                res.newMultiplier = MAX_MULTIPLIER;
            }

            // Calculate fee shares: curator is minted shares representing fee value
            // Net follower value is vaultValue - fee
            res.netVaultValue = vaultValue;
            if (res.fee > 0 && totalShares > 0 && vaultValue > res.fee) {
                // S_curator = (totalShares * fee) / (vaultValue - fee)
                res.feeShares = FullMath.mulDiv(totalShares, res.fee, vaultValue - res.fee);
            }
        } else {
            // Behind the Pace
            res.isAhead = false;
            uint256 shortfall = paceValue - vaultValue;
            res.gap = -int256(shortfall);

            // Bond pays followers up to bond balance
            if (shortfall <= currentBond) {
                res.bondPayout = shortfall;
                res.newBond = currentBond - shortfall;
                res.newDeficit = currentDeficit;
            } else {
                res.bondPayout = currentBond;
                res.newBond = 0;
                res.newDeficit = currentDeficit + (shortfall - currentBond);
            }

            res.fee = 0;
            res.feeShares = 0;

            // Multiplier decreases by 2, down to MIN_MULTIPLIER (2)
            if (currentMultiplier <= MIN_MULTIPLIER + 2) {
                res.newMultiplier = MIN_MULTIPLIER;
            } else {
                res.newMultiplier = currentMultiplier - 2;
            }

            // Payout is moved into the vault, raising its value to followers
            res.netVaultValue = vaultValue + res.bondPayout;
        }
    }
}
