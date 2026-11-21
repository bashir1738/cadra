// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Script, console2} from "forge-std/Script.sol";

contract PrintTopics is Script {
    function run() external pure {
        bytes32 bandLeft = keccak256("BandLeft(uint256,int24)");
        bytes32 epochReady = keccak256("EpochReady(uint256,uint256)");
        bytes32 vaultParked = keccak256("VaultParked(uint256,uint256,uint256)");
        bytes32 enforceExecuted = keccak256("EnforceExecuted(uint256,bool,uint256)");
        bytes32 settleExecuted = keccak256("SettleExecuted(uint256,uint256)");

        console2.log("=== Cadra Event Topics ===");
        console2.log("BandLeft(uint256,int24):");
        console2.logBytes32(bandLeft);
        console2.log("EpochReady(uint256,uint256):");
        console2.logBytes32(epochReady);
        console2.log("VaultParked(uint256,uint256,uint256):");
        console2.logBytes32(vaultParked);
        console2.log("EnforceExecuted(uint256,bool,uint256):");
        console2.logBytes32(enforceExecuted);
        console2.log("SettleExecuted(uint256,uint256):");
        console2.logBytes32(settleExecuted);
    }
}
