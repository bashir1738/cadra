// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

contract DeployHookScript is Script {
    using CurrencyLibrary for Currency;

    uint256 constant EPOCH_LENGTH = 1 hours;
    uint32 constant TWAP_WINDOW = 300; // 5 minutes
    int24 constant MAX_SPOT_DEVIATION = 200;

    // Initial pool price: 1 ETH = 2500 USDC
    uint160 constant SQRT_PRICE_2500 = 3961408125713216879677197;

    // Official Circle testnet USDC on Unichain Sepolia
    address constant EXISTING_USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
    address constant EXISTING_WETH = 0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6;
    address constant EXISTING_MANAGER = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external returns (CadraHook hook, PoolKey memory key) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        PoolManager manager = PoolManager(EXISTING_MANAGER);

        // Required flags: AFTER_INITIALIZE | BEFORE_SWAP | AFTER_SWAP
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        bytes memory constructorArgs = abi.encode(
            manager,
            IERC20(EXISTING_USDC),
            EPOCH_LENGTH,
            TWAP_WINDOW,
            MAX_SPOT_DEVIATION,
            deployer
        );

        console.log("Mining CREATE2 salt for CadraHook...");
        (address expectedHookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(CadraHook).creationCode,
            constructorArgs
        );
        console.log("Mined hook address:", expectedHookAddress);

        bytes memory initCode = abi.encodePacked(type(CadraHook).creationCode, constructorArgs);
        (bool success, ) = CREATE2_DEPLOYER.call(abi.encodePacked(salt, initCode));
        require(success, "CadraHook CREATE2 deployment failed");
        hook = CadraHook(expectedHookAddress);
        require(address(hook).code.length > 0, "CadraHook code length is 0");
        require(hook.owner() == deployer, "Owner must be deployer EOA");

        // Canonical token ordering: USDC (0x688...) < WETH (0xB4A...)
        address token0 = EXISTING_USDC;
        address token1 = EXISTING_WETH;

        key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        console.log("Initializing Uniswap v4 pool with new hook...");
        manager.initialize(key, SQRT_PRICE_2500);

        vm.stopBroadcast();
        console.log("New CadraHook successfully deployed and pool initialized!");
    }
}
