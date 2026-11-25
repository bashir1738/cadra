// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";

import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {Mandate, Range} from "../src/types/Mandate.sol";
import {Vault} from "../src/types/Vault.sol";

contract DemoLoopScript is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    address constant HOOK = 0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0;
    address constant POOL_MANAGER = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant TOKEN0 = 0x31d0220469e10c4E71834a79b1f276d740d3768F; // Official Circle USDC
    address constant TOKEN1 = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6; // Mock WETH

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });
        PoolId poolId = key.toId();

        CadraHook hook = CadraHook(HOOK);

        vm.startBroadcast(deployerKey);

        // Deploy fresh test routers
        PoolModifyLiquidityTest modifyRouter = new PoolModifyLiquidityTest(IPoolManager(POOL_MANAGER));
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(POOL_MANAGER));

        // 1. Mint test WETH only; official USDC cannot be minted
        MockERC20(TOKEN1).mint(deployer, 1_000_000_000 * 1e18);

        IERC20(TOKEN0).approve(address(modifyRouter), type(uint256).max);
        MockERC20(TOKEN1).approve(address(modifyRouter), type(uint256).max);
        IERC20(TOKEN0).approve(address(swapRouter), type(uint256).max);
        MockERC20(TOKEN1).approve(address(swapRouter), type(uint256).max);
        IERC20(TOKEN0).approve(HOOK, type(uint256).max);
        MockERC20(TOKEN1).approve(HOOK, type(uint256).max);

        // 2. Read current slot0
        (, int24 currentTick, , ) = StateLibrary.getSlot0(IPoolManager(POOL_MANAGER), poolId);
        console2.log("Initial spot tick:", currentTick);

        // Seed liquidity around current tick (-198180 to -197940)
        modifyRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -198180,
                tickUpper: -197940,
                liquidityDelta: 1e8,
                salt: bytes32(block.timestamp)
            }),
            ""
        );
        console2.log("Seeded pool liquidity");

        // 3. Create Vault with low maxShortfallBps (100 = 1%)
        // Mandate covers [-198180, -198060] (spot tick -198080 is INSIDE this corridor)
        Mandate memory mandate = Mandate({
            minTick: -198180,
            maxTick: -198060,
            maxConcentrationBps: 10000,
            minRangeWidth: 60,
            maxShortfallBps: 100
        });

        uint256 vaultId = hook.createVault(key, 2000, mandate, 1000 ether);
        console2.log("Created Vault ID:", vaultId);

        // Post Bond: $5,000 USDC
        hook.postBond(vaultId, 5000 * 1e6);
        console2.log("Posted Bond: 5000 USDC");

        // Follower Deposit: 1000 USDC + 10^10 wei of WETH
        hook.deposit(vaultId, 1000 * 1e6, 10_000_000_000);
        console2.log("Deposited Follower Capital: 1000 USDC + 1e10 wei WETH");

        // Rebalance into active range [-198120, -198060]
        Range[] memory ranges = new Range[](1);
        ranges[0] = Range({
            tickLower: -198120,
            tickUpper: -198060,
            liquidity: 0
        });
        hook.rebalance(vaultId, ranges);
        console2.log("Rebalanced vault into corridor [-198120, -198060]");
        console2.log("Pool Active Band Mask after rebalance:", hook.poolActiveBandMask(poolId));

        // 4. Execute a small swap pushing tick UP past -198060 (zeroForOne: false)
        console2.log("Executing breach swap crossing upper band (-198060)...");
        swapRouter.swap(
            key,
            SwapParams({
                zeroForOne: false,
                amountSpecified: -100, // exact input token1
                sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        (, int24 newTick, , ) = StateLibrary.getSlot0(IPoolManager(POOL_MANAGER), poolId);
        console2.log("Post-swap spot tick:", newTick);

        Vault memory v = hook.getVault(vaultId);
        console2.log("Vault bandLeft emitted:", v.bandLeft);
        console2.log("Active Band Mask now:", hook.poolActiveBandMask(poolId));

        // 5. Valuation metrics
        uint256 vaultVal = hook.getVaultValue(vaultId);
        uint256 paceVal = hook.getPaceValue(vaultId);
        uint256 shortfall = paceVal > vaultVal ? paceVal - vaultVal : 0;
        uint256 shortfallBps = paceVal > 0 ? (shortfall * 10000) / paceVal : 0;

        console2.log("=== Post-Breach Valuation Metrics ===");
        console2.log("Vault Value:    ", vaultVal);
        console2.log("Pace Value:     ", paceVal);
        console2.log("Shortfall (raw):", shortfall);
        console2.log("Shortfall (bps):", shortfallBps);
        console2.log("Max Shortfall:  ", v.mandate.maxShortfallBps);

        // Test enforce()
        bool parked = hook.enforce(vaultId);
        console2.log("enforce() execution result:", parked);

        v = hook.getVault(vaultId);
        console2.log("Vault isFrozen:", v.isFrozen);
        console2.log("Vault timesParked:", v.record.timesParked);

        vm.stopBroadcast();
    }
}
