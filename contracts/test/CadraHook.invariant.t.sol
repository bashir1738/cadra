// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
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
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {CadraHook} from "../src/CadraHook.sol";
import {Mandate, Range} from "../src/types/Mandate.sol";
import {Vault} from "../src/types/Vault.sol";

/// @notice Handler for stateful fuzzing of the full CadraHook lifecycle.
contract CadraHandler is Test {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    CadraHook public hook;
    PoolKey public poolKey;
    PoolSwapTest public swapRouter;
    address public curator;
    address[] public followers;

    uint256 public constant EPOCH_LENGTH = 1 hours;
    uint256 public lastVaultId;

    constructor(
        CadraHook _hook,
        PoolKey memory _poolKey,
        PoolSwapTest _swapRouter,
        address _curator,
        address[] memory _followers
    ) {
        hook = _hook;
        poolKey = _poolKey;
        swapRouter = _swapRouter;
        curator = _curator;
        followers = _followers;

        address token0 = Currency.unwrap(poolKey.currency0);
        address token1 = Currency.unwrap(poolKey.currency1);
        MockERC20(token0).approve(address(swapRouter), type(uint256).max);
        MockERC20(token1).approve(address(swapRouter), type(uint256).max);
    }

    function createVault(uint256 seed) external {
        uint16 perfFeeBps = uint16(bound(seed % 3001, 0, 3000));
        Mandate memory m = Mandate({
            minTick: -1200,
            maxTick: 1200,
            maxConcentrationBps: 6000,
            minRangeWidth: 120,
            maxShortfallBps: 500
        });
        vm.prank(curator);
        uint256 id = hook.createVault(poolKey, perfFeeBps, m);
        lastVaultId = id;
    }

    function postBond(uint256 vaultId, uint256 amount) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        amount = bound(amount, 100 ether, 50_000 ether);
        address token1 = Currency.unwrap(poolKey.currency1);
        MockERC20(token1).mint(curator, amount);
        vm.startPrank(curator);
        MockERC20(token1).approve(address(hook), amount);
        hook.postBond(vaultId, amount);
        vm.stopPrank();
    }

    function depositDual(uint256 vaultId, uint256 a0Seed, uint256 a1Seed) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        Vault memory v = hook.getVault(vaultId);
        if (v.curator == address(0) || v.bond == 0) return;

        uint256 a0 = bound(a0Seed, 0, 10 ether);
        uint256 a1 = bound(a1Seed, 0, 100 ether);
        if (a0 == 0 && a1 == 0) a1 = 1 ether;

        address token0 = Currency.unwrap(poolKey.currency0);
        address token1 = Currency.unwrap(poolKey.currency1);
        address follower = followers[bound(a0Seed % followers.length, 0, followers.length - 1)];

        if (a0 > 0) {
            MockERC20(token0).mint(follower, a0);
            vm.prank(follower);
            MockERC20(token0).approve(address(hook), a0);
        }
        if (a1 > 0) {
            MockERC20(token1).mint(follower, a1);
            vm.prank(follower);
            MockERC20(token1).approve(address(hook), a1);
        }

        vm.prank(follower);
        try hook.deposit(vaultId, a0, a1) {} catch {}
    }

    function rebalance(uint256 vaultId) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        Vault memory v = hook.getVault(vaultId);
        if (v.curator == address(0) || v.isFrozen) return;

        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({tickLower: -120, tickUpper: 120, liquidity: 100});
        vm.prank(curator);
        try hook.rebalance(vaultId, ranges) {} catch {}
    }

    function swap(bool zeroForOne, uint256 amountSeed) external {
        uint256 amount = bound(amountSeed, 0.001 ether, 2 ether);
        address tokenIn = zeroForOne ? Currency.unwrap(poolKey.currency0) : Currency.unwrap(poolKey.currency1);
        MockERC20(tokenIn).mint(address(this), amount);
        try swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(amount),
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        ) {} catch {}
    }

    function requestWithdraw(uint256 vaultId, uint256 shareSeed) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        address follower = followers[bound(shareSeed % followers.length, 0, followers.length - 1)];
        uint256 bal = hook.vaultFollowerShares(vaultId, follower);
        if (bal == 0) return;
        uint256 shares = bound(shareSeed, 1, bal);
        vm.prank(follower);
        hook.requestWithdraw(vaultId, shares);
    }

    function settle(uint256 vaultId) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        Vault memory v = hook.getVault(vaultId);
        if (v.curator == address(0)) return;
        if (v.epochStart + EPOCH_LENGTH > block.timestamp) {
            vm.warp(v.epochStart + EPOCH_LENGTH);
        }
        try hook.settle(vaultId) {} catch {}
    }

    function enforce(uint256 vaultId) external {
        if (vaultId == 0 || vaultId > lastVaultId) return;
        Vault memory v = hook.getVault(vaultId);
        if (v.curator == address(0)) return;
        hook.enforce(vaultId);
    }

    function warpTime(uint256 dt) external {
        vm.warp(block.timestamp + bound(dt, 1, 2 hours));
    }
}

contract CadraHookInvariantTest is StdInvariant, Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    CadraHook hook;
    CadraHandler handler;
    PoolKey poolKey;
    PoolId poolId;

    address curator = makeAddr("curator");

    uint256 constant EPOCH_LENGTH = 1 hours;
    uint32 constant TWAP_WINDOW = 300;
    int24 constant MAX_SPOT_DEVIATION = 200;

    function setUp() public {
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();

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

        (poolKey, poolId) = initPool(
            currency0,
            currency1,
            IHooks(address(hook)),
            3000,
            60,
            SQRT_PRICE_1_1
        );

        address[] memory followers = new address[](3);
        followers[0] = makeAddr("f1");
        followers[1] = makeAddr("f2");
        followers[2] = makeAddr("f3");

        handler = new CadraHandler(hook, poolKey, swapRouter, curator, followers);
        targetContract(address(handler));
    }

    /// @notice Hook contract ERC20 balances always cover recorded liabilities (idle + pending + bonds).
    function invariant_idleBackedByBalances() public view {
        uint256 sumIdle0;
        uint256 sumIdle1;
        uint256 sumPending0;
        uint256 sumPending1;
        uint256 sumBond;

        for (uint256 id = 1; id <= handler.lastVaultId(); id++) {
            sumIdle0 += hook.vaultIdle0(id);
            sumIdle1 += hook.vaultIdle1(id);
            sumPending0 += hook.vaultPending0(id);
            sumPending1 += hook.vaultPending1(id);
            sumBond += hook.getVault(id).bond;
        }

        address token0 = Currency.unwrap(poolKey.currency0);
        address token1 = Currency.unwrap(poolKey.currency1);

        assertGe(
            IERC20(token0).balanceOf(address(hook)),
            sumIdle0 + sumPending0,
            "token0 liabilities exceed balance"
        );

        assertGe(
            IERC20(token1).balanceOf(address(hook)),
            sumIdle1 + sumPending1 + sumBond,
            "token1 liabilities exceed balance"
        );
    }

    /// @notice totalShares always covers the sum of all tracked holder shares.
    function invariant_sharesAccounting() public view {
        address[] memory followers = _followers();
        for (uint256 id = 1; id <= handler.lastVaultId(); id++) {
            Vault memory v = hook.getVault(id);
            if (v.curator == address(0)) continue;
            uint256 sum;
            for (uint256 i = 0; i < followers.length; i++) {
                sum += hook.vaultFollowerShares(id, followers[i]);
            }
            sum += hook.vaultFollowerShares(id, v.curator);
            assertLe(sum, v.totalShares, "holder shares > totalShares");
        }
    }

    /// @notice Multiplier stays within SettlementLib bounds [2, 20].
    function invariant_multiplierBounds() public view {
        for (uint256 id = 1; id <= handler.lastVaultId(); id++) {
            Vault memory v = hook.getVault(id);
            if (v.curator == address(0)) continue;
            assertGe(v.capacityMultiplier, 2, "multiplier < 2");
            assertLe(v.capacityMultiplier, 20, "multiplier > 20");
        }
    }

    /// @notice Every active range respects the vault's mandate envelope.
    function invariant_mandateBounds() public view {
        for (uint256 id = 1; id <= handler.lastVaultId(); id++) {
            Vault memory v = hook.getVault(id);
            if (v.curator == address(0)) continue;
            Range[] memory positions = hook.getVaultPositions(id);
            for (uint256 i = 0; i < positions.length; i++) {
                if (positions[i].liquidity > 0) {
                    assertGe(positions[i].tickLower, v.mandate.minTick, "range below minTick");
                    assertLe(positions[i].tickUpper, v.mandate.maxTick, "range above maxTick");
                }
            }
        }
    }

    function _followers() internal pure returns (address[] memory followers) {
        followers = new address[](3);
        followers[0] = address(uint160(uint256(keccak256("f1"))));
        followers[1] = address(uint160(uint256(keccak256("f2"))));
        followers[2] = address(uint160(uint256(keccak256("f3"))));
    }
}
