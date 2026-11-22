// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Script} from "forge-std/Script.sol";
import {CadraReactive} from "../src/CadraReactive.sol";
import {CadraCallback} from "../src/CadraCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";

/// @title DeployReactiveScript
/// @notice Deploys CadraReactive on Reactive Lasna (5318007) and CadraCallback on Unichain Sepolia (1301)
contract DeployReactiveScript is Script {
    // Unichain Sepolia Callback Proxy address
    address public constant DEFAULT_CALLBACK_PROXY = 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4;

    function deployReactive(address hookAddress) external returns (CadraReactive reactive) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // Step 1: Deploy CadraReactive on Reactive Lasna
        reactive = new CadraReactive{value: 0.1 ether}(hookAddress);

        vm.stopBroadcast();
    }

    function deployCallback(
        address callbackProxy,
        address reactiveAddr,
        address hookAddress
    ) external returns (CadraCallback callback) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        address proxy = callbackProxy == address(0) ? DEFAULT_CALLBACK_PROXY : callbackProxy;

        // Step 2: Deploy CadraCallback on Unichain Sepolia with 0.003 ETH gas reserve
        callback = new CadraCallback{value: 0.003 ether}(
            IPayable(proxy),
            reactiveAddr,
            hookAddress
        );

        vm.stopBroadcast();
    }

    function linkCallback(address payable reactiveAddr, address callbackAddr) external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // Step 3: Link Callback Recipient on Lasna
        CadraReactive(reactiveAddr).setCallbackRecipient(callbackAddr);

        vm.stopBroadcast();
    }

    function updateReactive(address payable reactiveAddr, address hookAddr, address callbackAddr) external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        CadraReactive(reactiveAddr).subscribeHook(hookAddr);
        CadraReactive(reactiveAddr).setCallbackRecipient(callbackAddr);

        vm.stopBroadcast();
    }
}
