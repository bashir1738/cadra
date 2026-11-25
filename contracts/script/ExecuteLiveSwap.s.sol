// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";

import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {Range} from "../src/types/Mandate.sol";
import {Vault} from "../src/types/Vault.sol";

/// @notice Pushes the pool price outside Vault 1's mandate band to emit BandLeft,
///         starting the Reactive cross-chain safety loop (BandLeft -> CadraReactive.react()
///         on Reactive Lasna -> callback proxy -> CadraCallback.enforce() on Unichain).
contract ExecuteLiveSwapScript is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    address constant HOOK = 0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0;
    address constant POOL_MANAGER = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant TOKEN0 = 0x31d0220469e10c4E71834a79b1f276d740d3768F; // Official Circle USDC
    address constant TOKEN1 = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6; // Mock WETH

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

        CadraHook hook = CadraHook(HOOK);
        Vault memory vault = hook.getVault(1);
        require(vault.curator == deployer, "Deployer is not Vault 1 curator");
        require(vault.bandLeft, "Vault 1 is not currently out of band");

        (, int24 beforeTick,,) = StateLibrary.getSlot0(IPoolManager(POOL_MANAGER), poolId);
        console.log("Pre-swap spot tick:", beforeTick);

        vm.startBroadcast(deployerPrivateKey);

        // The pool was left near MIN_TICK after the first attempt. Restore its price
        // inside Vault 1's mandate so the curator can re-arm its band monitor.
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(POOL_MANAGER));
        console.log("SwapRouter deployed at:", address(swapRouter));

        IERC20(TOKEN0).approve(address(swapRouter), type(uint256).max);
        IERC20(TOKEN1).approve(address(swapRouter), type(uint256).max);

        swapRouter.swap(
            key,
            SwapParams({
                zeroForOne: false,
                amountSpecified: -100,
                sqrtPriceLimitX96: TickMath.getSqrtPriceAtTick(-198080)
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        (, int24 inBandTick,,) = StateLibrary.getSlot0(IPoolManager(POOL_MANAGER), poolId);
        require(
            inBandTick >= vault.mandate.minTick && inBandTick <= vault.mandate.maxTick,
            "Pool price did not return inside Vault 1 mandate"
        );
        console.log("Restored in-band tick:", inBandTick);

        Range[] memory zeroLiquidityRange = new Range[](1);
        zeroLiquidityRange[0] = Range({tickLower: -198120, tickUpper: -197820, liquidity: 0});
        hook.rebalance(1, zeroLiquidityRange);
        Vault memory rearmedVault = hook.getVault(1);
        require(!rearmedVault.bandLeft, "Vault 1 did not re-arm");
        require((hook.poolActiveBandMask(poolId) & 1) != 0, "Vault 1 active bit not set");

        // Move below the lower mandate edge. There is no pool liquidity, so this
        // exact-input swap changes only the test pool price and emits BandLeft.
        swapRouter.swap(
            key,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -100,
                sqrtPriceLimitX96: TickMath.getSqrtPriceAtTick(vault.mandate.minTick - key.tickSpacing)
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        Vault memory finalVault = hook.getVault(1);
        uint32 finalActiveMask = hook.poolActiveBandMask(poolId);
        console.log("Post-swap Vault 1 bandLeft:", finalVault.bandLeft);
        console.log("Post-swap activeBandMask:", finalActiveMask);
        require(finalVault.bandLeft, "BandLeft event was not recorded");
        require((finalActiveMask & 1) == 0, "Vault 1 active bit was not cleared");

        vm.stopBroadcast();
    }
}
