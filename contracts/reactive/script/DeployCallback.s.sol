// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CadraCallback} from "../src/CadraCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";

contract DeployCallback is Script {
    address constant CALLBACK_PROXY = 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4;
    address constant CADRA_REACTIVE = 0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C;
    address constant CADRA_HOOK     = 0x6974BEEfCD6B8Bf30ee2838d830eEbFb892f50c0;

    function run() external returns (address newCallback) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        CadraCallback cb = (new CadraCallback){value: 0.001 ether}(
            IPayable(CALLBACK_PROXY),
            CADRA_REACTIVE,
            CADRA_HOOK
        );
        newCallback = address(cb);

        console2.log("=== Redeployed CadraCallback ===");
        console2.log("New CadraCallback Address:", newCallback);
        console2.log("Callback Balance:", newCallback.balance);

        vm.stopBroadcast();
    }
}
