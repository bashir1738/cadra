// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MockERC20} from "../src/mocks/MockERC20.sol";
import {CadraHook} from "../src/CadraHook.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

contract DeployScript is Script {
    using CurrencyLibrary for Currency;

    // Testnet parameters: 1 hour epochs, 5 minute TWAP, 200 tick spot tolerance
    uint256 constant EPOCH_LENGTH = 1 hours;
    uint32 constant TWAP_WINDOW = 300; // 5 minutes
    int24 constant MAX_SPOT_DEVIATION = 200;

    // Initial pool price: 1 ETH = 2500 USDC
    uint160 constant SQRT_PRICE_2500 = 3961408125713216879677197;

    function run() external returns (
        MockERC20 weth,
        MockERC20 usdc,
        PoolManager manager,
        CadraHook hook,
        PoolKey memory key
    ) {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(1));
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Tokens
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Sort tokens for Uniswap v4
        address token0 = address(weth) < address(usdc) ? address(weth) : address(usdc);
        address token1 = address(weth) < address(usdc) ? address(usdc) : address(weth);

        // 2. Deploy PoolManager
        manager = new PoolManager(deployer);

        // 3. Hook permissions: AFTER_INITIALIZE | BEFORE_SWAP | AFTER_SWAP
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        // Deploy CadraHook at mined address matching flags via CREATE2 Deployer proxy
        bytes memory constructorArgs = abi.encode(
            manager,
            IERC20(address(usdc)),
            EPOCH_LENGTH,
            TWAP_WINDOW,
            MAX_SPOT_DEVIATION,
            deployer
        );

        address CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

        (address expectedHookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(CadraHook).creationCode,
            constructorArgs
        );

        bytes memory initCode = abi.encodePacked(type(CadraHook).creationCode, constructorArgs);
        (bool success, ) = CREATE2_DEPLOYER.call(abi.encodePacked(salt, initCode));
        require(success, "CadraHook CREATE2 deployment failed");
        hook = CadraHook(expectedHookAddress);
        require(address(hook).code.length > 0, "CadraHook code length is 0");
        require(hook.owner() == deployer, "Owner must be deployer EOA");

        // 4. Initialize Pool
        key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000, // 0.3%
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        manager.initialize(key, SQRT_PRICE_2500);

        vm.stopBroadcast();
    }
}
