// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CadraCallback} from "../src/CadraCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";

contract DeployCallback is Script {
    address constant CALLBACK_PROXY = 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4;
    // These are the deployed Cadra contracts. The PoolManager address must never
    // be used as the callback sender.
    address constant CADRA_REACTIVE = 0xf937aee2e988557ba3774a8a41af349ef7112680;
    address constant CADRA_HOOK = 0x3007A44a54EcBAe0335c4AcE9a00a1dD15Ca90c0;

    function run() external returns (address newCallback) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        CadraCallback cb = (new CadraCallback){value: 0.001 ether}(IPayable(CALLBACK_PROXY), CADRA_REACTIVE, CADRA_HOOK);
        newCallback = address(cb);

        console2.log("=== Redeployed CadraCallback ===");
        console2.log("New CadraCallback Address:", newCallback);
        console2.log("Callback Balance:", newCallback.balance);

        vm.stopBroadcast();
    }
}
