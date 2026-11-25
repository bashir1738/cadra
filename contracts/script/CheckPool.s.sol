// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {CadraHook} from "../src/CadraHook.sol";

contract CheckPoolScript is Script {
    using PoolIdLibrary for PoolKey;

    address constant HOOK = 0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0;
    address constant POOL_MANAGER = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant TOKEN0 = 0x31d0220469e10c4E71834a79b1f276d740d3768F; // Circle USDC
    address constant TOKEN1 = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6; // WETH

    function run() external view {
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        PoolId poolId = key.toId();
        console.log("PoolId:");
        console.logBytes32(PoolId.unwrap(poolId));

        (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee) =
            StateLibrary.getSlot0(IPoolManager(POOL_MANAGER), poolId);

        console.log("Slot0 sqrtPriceX96:", sqrtPriceX96);
        console.log("Slot0 tick:", tick);

        CadraHook hook = CadraHook(HOOK);
        console.log("Next Vault ID:", hook.nextVaultId());
    }
}
