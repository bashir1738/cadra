// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Mandate, Range} from "./Mandate.sol";

/// @notice Historical performance track record for a curator vault.
struct Record {
    uint32 epochsAhead;
    uint32 epochsBehind;
    uint32 timesParked;
    int256 cumulativeExcess; // Total excess value over the Pace across epochs (in token1)
}

/// @notice Queued deposit to be processed at the next epoch settlement.
struct QueuedDeposit {
    address follower;
    uint256 amount0;
    uint256 amount1;
    uint256 minSharesOut;
}

/// @notice Queued withdrawal to be processed at the next epoch settlement.
struct QueuedWithdraw {
    address follower;
    uint256 shares;
}

/// @notice In-storage representation of a curator vault.
struct Vault {
    address curator;
    PoolKey poolKey;
    uint16 perfFeeBps; // Performance fee in bps (e.g. 2000 = 20%, max 3000 = 30%)
    Mandate mandate;
    Mandate pendingMandate;
    bool hasPendingMandate;
    uint256 bond; // Bond deposited in USDC
    uint256 bondUnlockTime; // Cooldown timestamp for bond withdrawals
    uint256 capacityMultiplier; // Current multiplier m (starts at 5, min 2, max 20)
    uint256 deficit; // Carried deficit D from uncovered shortfalls
    bool isFrozen; // True if vault is parked and curator is frozen
    bool bandLeft; // Flag set if spot price left [minTick, maxTick]
    uint256 epoch; // Current epoch index (starts at 1)
    uint256 epochStart; // Timestamp when the current epoch began
    uint256 startValue; // V0: Vault benchmark value at epoch start (in token1)
    uint128 paceLiquidity; // L_pace: Liquidity of the benchmark full-range position
    uint256 totalShares; // Total shares issued to followers and curator
    Record record; // Curator historical record
}
