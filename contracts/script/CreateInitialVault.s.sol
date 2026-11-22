// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {Mandate} from "../src/types/Mandate.sol";
import {Vault} from "../src/types/Vault.sol";

contract CreateInitialVaultScript is Script {
    address constant HOOK = 0x6974BEEfCD6B8Bf30ee2838d830eEbFb892f50c0;
    address constant TOKEN0 = 0x31d0220469e10c4E71834a79b1f276d740d3768F; // Official Circle USDC
    address constant TOKEN1 = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6; // WETH

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        CadraHook hook = CadraHook(HOOK);
        IERC20 usdc = IERC20(TOKEN0);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // Current pool tick is -198080 (ETH ~$2500)
        // Set corridor: [-202080, -194080] (~$1675 to ~$3730)
        Mandate memory mandate = Mandate({
            minTick: -202080,
            maxTick: -194080,
            maxConcentrationBps: 5000,
            minRangeWidth: 120,
            maxShortfallBps: 500
        });

        uint256 vaultId = hook.createVault(key, 2000, mandate); // 20% perf fee
        console.log("Created Vault ID:", vaultId);

        // Approve and post 10 USDC bond (gives 50 USDC follower capacity)
        uint256 bondAmount = 10 * 1e6;
        usdc.approve(HOOK, bondAmount);
        hook.postBond(vaultId, bondAmount);
        console.log("Posted Bond:", bondAmount);

        vm.stopBroadcast();

        Vault memory v = hook.getVault(vaultId);
        console.log("Vault Curator:", v.curator);
        console.log("Vault Bond:", v.bond);
        console.log("Vault Capacity:", v.bond * v.capacityMultiplier);
    }
}
