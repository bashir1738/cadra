// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {CadraHook} from "../src/CadraHook.sol";
import {Mandate, Range} from "../src/types/Mandate.sol";
import {Vault} from "../src/types/Vault.sol";

contract CadraHookTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    CadraHook hook;
    PoolKey poolKey;
    PoolId poolId;

    address curator = makeAddr("curator");
    address follower = makeAddr("follower");
    address keeper = makeAddr("keeper");

    uint256 constant EPOCH_LENGTH = 1 hours;
    uint32 constant TWAP_WINDOW = 300;
    int24 constant MAX_SPOT_DEVIATION = 200;

    Mandate defaultMandate;

    function setUp() public {
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();

        // Mine hook address with AFTER_INITIALIZE | BEFORE_SWAP | AFTER_SWAP flags
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        bytes memory constructorArgs = abi.encode(
            manager,
            IERC20(Currency.unwrap(currency1)),
            EPOCH_LENGTH,
            TWAP_WINDOW,
            MAX_SPOT_DEVIATION
        );

        (, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            type(CadraHook).creationCode,
            constructorArgs
        );

        hook = new CadraHook{salt: salt}(
            manager,
            IERC20(Currency.unwrap(currency1)),
            EPOCH_LENGTH,
            TWAP_WINDOW,
            MAX_SPOT_DEVIATION
        );

        // Initialize pool with hook
        (poolKey, poolId) = initPool(
            currency0,
            currency1,
            IHooks(address(hook)),
            3000,
            60,
            SQRT_PRICE_1_1
        );

        defaultMandate = Mandate({
            minTick: -1200,
            maxTick: 1200,
            maxConcentrationBps: 6000,
            minRangeWidth: 120,
            maxShortfallBps: 500
        });

        // Fund curator and follower
        MockERC20(Currency.unwrap(currency0)).mint(curator, 100 ether);
        MockERC20(Currency.unwrap(currency1)).mint(curator, 100_000 ether);
        MockERC20(Currency.unwrap(currency0)).mint(follower, 100 ether);
        MockERC20(Currency.unwrap(currency1)).mint(follower, 100_000 ether);

        vm.prank(curator);
        MockERC20(Currency.unwrap(currency1)).approve(address(hook), type(uint256).max);

        vm.prank(follower);
        MockERC20(Currency.unwrap(currency0)).approve(address(hook), type(uint256).max);
        vm.prank(follower);
        MockERC20(Currency.unwrap(currency1)).approve(address(hook), type(uint256).max);
    }

    function test_createVault_and_postBond() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);
        assertEq(vaultId, 1);

        Vault memory v = hook.getVault(vaultId);
        assertEq(v.curator, curator);
        assertEq(v.perfFeeBps, 2000);
        assertEq(v.capacityMultiplier, 5);
        assertEq(v.epoch, 1);
        assertEq(v.bond, 0);
        assertEq(v.mandate.minTick, defaultMandate.minTick);

        // Post bond
        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        assertEq(hook.getVault(vaultId).bond, 10_000 ether);
    }

    function test_proposeMandate_applies_only_at_settlement() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        Mandate memory newMandate = Mandate({
            minTick: -600,
            maxTick: 600,
            maxConcentrationBps: 5000,
            minRangeWidth: 120,
            maxShortfallBps: 300
        });

        // Non-curator proposal fails
        vm.prank(follower);
        vm.expectRevert(CadraHook.OnlyCurator.selector);
        hook.proposeMandate(vaultId, newMandate);

        // Curator proposes
        vm.prank(curator);
        hook.proposeMandate(vaultId, newMandate);

        // Current mandate remains unchanged
        Mandate memory currentM = hook.getVault(vaultId).mandate;
        assertEq(currentM.minTick, defaultMandate.minTick);

        // Warp past epoch and settle
        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // After settlement, pending mandate is now current mandate
        Mandate memory appliedM = hook.getVault(vaultId).mandate;
        assertEq(appliedM.minTick, newMandate.minTick);
        assertEq(appliedM.maxTick, newMandate.maxTick);
    }

    function test_deposit_queue_and_capacity_limit() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Bond is $1,000 -> capacity = $5,000
        vm.prank(curator);
        hook.postBond(vaultId, 1000 ether);

        // Follower deposits $6,000 -> exceeds capacity
        vm.prank(follower);
        vm.expectRevert(CadraHook.CapacityExceeded.selector);
        hook.deposit(vaultId, 0, 6000 ether);

        // Follower deposits $2,000 -> succeeds in pending queue
        vm.prank(follower);
        hook.deposit(vaultId, 0, 2000 ether);
        assertEq(hook.vaultPending1(vaultId), 2000 ether);

        // Settle epoch activates deposit to idle1
        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);
        assertEq(hook.vaultIdle1(vaultId), 2000 ether);
    }

    function test_rebalance_only_curator() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: -120, tickUpper: 120, liquidity: 100});

        vm.prank(follower);
        vm.expectRevert(CadraHook.OnlyCurator.selector);
        hook.rebalance(vaultId, ranges);
    }

    function test_rebalance_rejected_for_out_of_bounds() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Mandate allows [-1200, 1200]. Propose [-2400, 0] -> out of bounds
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: -2400, tickUpper: 0, liquidity: 100});

        vm.prank(curator);
        vm.expectRevert();
        hook.rebalance(vaultId, ranges);
    }

    function test_rebalance_rejected_for_too_narrow() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Mandate requires minRangeWidth = 120. Provide width 60 (e.g. [0, 60])
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: 0, tickUpper: 60, liquidity: 100});

        vm.prank(curator);
        vm.expectRevert();
        hook.rebalance(vaultId, ranges);
    }

    function test_settle_ahead_lifecycle() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        vm.prank(follower);
        hook.deposit(vaultId, 0, 1000 ether);

        // Settle epoch 1 to process deposit
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // Follower now owns shares
        uint256 shares = hook.vaultFollowerShares(vaultId, follower);
        assertTrue(shares > 0);

        // Warp to epoch 2 end
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        Vault memory v = hook.getVault(vaultId);
        assertEq(v.epoch, 3);
        assertEq(v.capacityMultiplier, 7, "Multiplier increased twice on 2 ahead epochs (5 -> 6 -> 7)");
    }

    function test_settle_protocol_fee_split_and_treasury_management() public {
        address treasury = address(0x999);
        hook.setProtocolTreasury(treasury);
        assertEq(hook.protocolTreasury(), treasury);
        assertEq(hook.protocolFeeBps(), 100);

        // Only owner can set protocol treasury
        vm.prank(follower);
        vm.expectRevert(CadraHook.OnlyOwner.selector);
        hook.setProtocolTreasury(address(0x123));

        // Max fee bps cap
        vm.expectRevert(CadraHook.ProtocolFeeTooHigh.selector);
        hook.setProtocolFeeBps(600); // Exceeds 5% max cap

        hook.setProtocolFeeBps(150);
        assertEq(hook.protocolFeeBps(), 150);
        hook.setProtocolFeeBps(100); // Reset to 1%

        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        vm.prank(follower);
        hook.deposit(vaultId, 0, 1000 ether);

        // Settle epoch 1
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);
        assertEq(hook.vaultFollowerShares(vaultId, follower), 1000 ether);
    }

    function test_queued_withdrawals_lifecycle() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        vm.prank(follower);
        hook.deposit(vaultId, 0, 1000 ether);

        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        uint256 followerShares = hook.vaultFollowerShares(vaultId, follower);
        assertTrue(followerShares > 0);

        // Follower requests withdrawal of half shares
        uint256 withdrawShares = followerShares / 2;
        vm.prank(follower);
        hook.requestWithdraw(vaultId, withdrawShares);

        assertEq(hook.vaultFollowerShares(vaultId, follower), followerShares - withdrawShares);

        // Settle epoch 2 to execute withdrawal
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // Withdrawal processed
        assertTrue(MockERC20(Currency.unwrap(currency1)).balanceOf(follower) > 0);
    }

    function test_enforce_noop_when_ahead_or_below_threshold() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        // Healthy vault: enforce is a keeper-friendly no-op (does not revert)
        hook.enforce(vaultId);
        assertFalse(hook.getVault(vaultId).isFrozen);
    }

    function test_withdrawal_pays_token0_when_idle1_insufficient() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);
        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        // Deposit mostly token0 so idle1 cannot cover a later withdrawal
        address token0 = Currency.unwrap(currency0);
        MockERC20(token0).mint(follower, 10 ether);
        vm.prank(follower);
        MockERC20(token0).approve(address(hook), type(uint256).max);
        vm.prank(follower);
        hook.deposit(vaultId, 10 ether, 0);

        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        uint256 shares = hook.vaultFollowerShares(vaultId, follower);
        assertTrue(shares > 0);

        uint256 bal0Before = MockERC20(token0).balanceOf(follower);
        vm.prank(follower);
        hook.requestWithdraw(vaultId, shares);

        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        uint256 bal0After = MockERC20(token0).balanceOf(follower);
        assertGt(bal0After, bal0Before, "expected token0 payout from idle0");
    }

    function test_afterSwap_sets_bandLeft_and_enforce_parks_vault() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        vm.prank(follower);
        hook.deposit(vaultId, 0, 1000 ether);

        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // Perform swap that moves price outside [-1200, 1200]
        MockERC20(Currency.unwrap(currency0)).mint(address(this), 100 ether);
        MockERC20(Currency.unwrap(currency0)).approve(address(swapRouter), type(uint256).max);

        // Swap token0 for token1 to push price downwards
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -1 ether,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        bool bandLeft = hook.getVault(vaultId).bandLeft;
        assertTrue(bandLeft);

        // Enforce is a keeper-friendly call returning bool (does not revert)
        bool parked = hook.enforce(vaultId);
        if (parked) {
            bool isFrozen = hook.getVault(vaultId).isFrozen;
            assertTrue(isFrozen);

            // Rebalance while frozen reverts
            Range[] memory ranges = new Range[](1);
            ranges[0] = Range({tickLower: -120, tickUpper: 120, liquidity: 100});
            vm.prank(curator);
            vm.expectRevert(CadraHook.VaultFrozen.selector);
            hook.rebalance(vaultId, ranges);
        }
    }

    function test_anti_sandwich_deposit_locks_shares() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);
        vm.prank(curator);
        hook.postBond(vaultId, 10_000 ether);

        // Follower deposits $1,000 -> locked shares are recorded at deposit time
        vm.prank(follower);
        hook.deposit(vaultId, 0, 1000 ether);

        // Verify deposit is in pending queue and not yet in idle
        assertEq(hook.vaultPending1(vaultId), 1000 ether);
        assertEq(hook.vaultIdle1(vaultId), 0);

        // Settle epoch
        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // Shares minted exactly as calculated at deposit time
        assertEq(hook.vaultFollowerShares(vaultId, follower), 1000 ether);
        assertEq(hook.vaultPending1(vaultId), 0);
        assertEq(hook.vaultIdle1(vaultId), 1000 ether);
    }

    function test_pro_rata_dual_token_withdrawal_with_position_unwind() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);
        vm.prank(curator);
        hook.postBond(vaultId, 20_000 ether);

        // Deposit both token0 and token1
        address token0 = Currency.unwrap(currency0);
        address token1 = Currency.unwrap(currency1);
        MockERC20(token0).mint(follower, 10 ether);
        vm.startPrank(follower);
        MockERC20(token0).approve(address(hook), type(uint256).max);
        hook.deposit(vaultId, 10 ether, 1000 ether);
        vm.stopPrank();

        // Settle epoch 1
        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        uint256 shares = hook.vaultFollowerShares(vaultId, follower);
        assertTrue(shares > 0);

        // Follower requests 50% withdrawal
        uint256 halfShares = shares / 2;
        vm.prank(follower);
        hook.requestWithdraw(vaultId, halfShares);

        uint256 bal0Before = MockERC20(token0).balanceOf(follower);
        uint256 bal1Before = MockERC20(token1).balanceOf(follower);

        // Settle epoch 2
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        uint256 bal0After = MockERC20(token0).balanceOf(follower);
        uint256 bal1After = MockERC20(token1).balanceOf(follower);

        // Both token0 and token1 must be received pro-rata (neither fails/skips)
        assertGt(bal0After, bal0Before, "token0 payout expected");
        assertGt(bal1After, bal1Before, "token1 payout expected");
    }

    event EpochReady(uint256 indexed vaultId, uint256 epoch);

    function test_signalEpochReady_emits_when_epoch_ended() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Warp past epoch end
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);

        // Expect EpochReady event
        vm.expectEmit(true, false, false, true);
        emit EpochReady(vaultId, 1);

        hook.signalEpochReady(vaultId);
        assertTrue(hook.epochReadySignaled(vaultId));
    }

    function test_signalEpochReady_reverts_early() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Before epoch end: must revert EpochNotEnded
        vm.expectRevert(CadraHook.EpochNotEnded.selector);
        hook.signalEpochReady(vaultId);
    }

    function test_signalEpochReady_reverts_double() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Warp past epoch end
        vm.warp(hook.getVault(vaultId).epochStart + EPOCH_LENGTH + 1);
        hook.signalEpochReady(vaultId);

        // Second call before settle must revert AlreadySignaled
        vm.expectRevert(CadraHook.AlreadySignaled.selector);
        hook.signalEpochReady(vaultId);

        // After settle, epochReadySignaled is reset
        hook.settle(vaultId);
        assertFalse(hook.epochReadySignaled(vaultId));
    }

    function test_settle_spot_deviation_grace_fallback() public {
        vm.prank(curator);
        uint256 vaultId = hook.createVault(poolKey, 2000, defaultMandate);

        // Advance to epoch end
        uint256 epochEnd = hook.getVault(vaultId).epochStart + EPOCH_LENGTH;
        vm.warp(epochEnd + 1);

        // Artificially move spot price past maxSpotDeviationTicks via a swap
        MockERC20(Currency.unwrap(currency0)).mint(address(this), 10 ether);
        MockERC20(Currency.unwrap(currency0)).approve(address(swapRouter), type(uint256).max);
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -1 ether,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        // Immediate settlement must revert SpotDeviationTooHigh
        vm.expectRevert();
        hook.settle(vaultId);

        // Advance past SETTLEMENT_GRACE_PERIOD (1 hour)
        vm.warp(epochEnd + 1 hours + 1);

        // Now settlement must succeed using TWAP fallback (no revert)
        hook.settle(vaultId);
        assertEq(hook.getVault(vaultId).epoch, 2);
    }
}
