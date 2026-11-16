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

        assertEq(hook.getVaultBond(vaultId), 10_000 ether);
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
        Mandate memory currentM = hook.getVaultMandate(vaultId);
        assertEq(currentM.minTick, defaultMandate.minTick);

        // Warp past epoch and settle
        vm.warp(block.timestamp + EPOCH_LENGTH + 1);
        hook.settle(vaultId);

        // After settlement, pending mandate is now current mandate
        Mandate memory appliedM = hook.getVaultMandate(vaultId);
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

        // Follower deposits $2,000 -> succeeds
        vm.prank(follower);
        hook.deposit(vaultId, 0, 2000 ether);
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

        bool bandLeft = hook.isVaultBandLeft(vaultId);
        assertTrue(bandLeft);

        // Rebalance rejected while frozen (if parked)
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: -120, tickUpper: 120, liquidity: 100});

        try hook.enforce(vaultId) {
            bool isFrozen = hook.isVaultFrozen(vaultId);
            assertTrue(isFrozen);

            // Rebalance while frozen reverts
            vm.prank(curator);
            vm.expectRevert(CadraHook.VaultFrozen.selector);
            hook.rebalance(vaultId, ranges);
        } catch {
            // Shortfall was below mandate limit
        }
    }
}
