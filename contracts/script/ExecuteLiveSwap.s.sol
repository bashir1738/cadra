// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";

import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {Vault} from "../src/types/Vault.sol";

contract ExecuteLiveSwapScript is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    address constant HOOK = 0x728D9b5f428B736A26D07879F55C3982Ddf890C0;
    address constant POOL_MANAGER = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant TOKEN0 = 0x688Cfa2501c44CB6B3886f4C5662c55b73f36e8D;
    address constant TOKEN1 = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        PoolId poolId = key.toId();

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy test routers
        PoolModifyLiquidityTest modifyRouter = new PoolModifyLiquidityTest(IPoolManager(POOL_MANAGER));
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(POOL_MANAGER));

        console.log("ModifyLiquidityRouter deployed at:", address(modifyRouter));
        console.log("SwapRouter deployed at:", address(swapRouter));

        // 2. Mint plenty of tokens to deployer
        MockERC20(TOKEN0).mint(deployer, 1_000_000_000 * 1e18);
        MockERC20(TOKEN1).mint(deployer, 1_000_000_000 * 1e18);

        // 3. Approve routers
        MockERC20(TOKEN0).approve(address(modifyRouter), type(uint256).max);
        MockERC20(TOKEN1).approve(address(modifyRouter), type(uint256).max);
        MockERC20(TOKEN0).approve(address(swapRouter), type(uint256).max);
        MockERC20(TOKEN1).approve(address(swapRouter), type(uint256).max);

        // 4. Add initial liquidity around spot tick -198080
        // Valid ticks with tickSpacing 60: -198180 to -198000
        modifyRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -198180,
                tickUpper: -198000,
                liquidityDelta: 1e9,
                salt: 0
            }),
            ""
        );

        console.log("Liquidity added successfully!");

        // 5. Execute swap to trigger afterSwap and emit BandLeft
        swapRouter.swap(
            key,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -100, // exact input 100 token0
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        console.log("Swap executed successfully!");

        vm.stopBroadcast();

        // 6. Verify BandLeft status
        CadraHook hook = CadraHook(HOOK);
        Vault memory v = hook.getVault(1);
        console.log("Post-swap Vault 1 bandLeft:", v.bandLeft);
        console.log("Post-swap activeBandMask:", hook.poolActiveBandMask(poolId));
    }
}
