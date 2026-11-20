// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {LogRecord} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

contract CadraReactive is AbstractReactive {
    uint256 public constant UNICHAIN_SEPOLIA = 1301;

    uint256 public constant BAND_LEFT_TOPIC   = uint256(keccak256("BandLeft(uint256,int24)"));
    uint256 public constant EPOCH_READY_TOPIC = uint256(keccak256("EpochReady(uint256,uint256)"));

    uint64 public constant CALLBACK_GAS = 1_500_000;

    address public owner;
    address public callbackRecipient;

    modifier onlyOwner() { require(msg.sender == owner, "NotOwner"); _; }

    constructor(address hook_) payable {
        owner = msg.sender;
        if (hook_ != address(0)) {
            SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, BAND_LEFT_TOPIC,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
            SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, EPOCH_READY_TOPIC,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function subscribeHook(address hook_) external onlyOwner {
        SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, BAND_LEFT_TOPIC,
            REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, EPOCH_READY_TOPIC,
            REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
    }

    function setCallbackRecipient(address recipient) external onlyOwner {
        callbackRecipient = recipient;
    }

    function react(LogRecord calldata log_) external onlySystem {
        require(callbackRecipient != address(0), "NoRecipient");

        uint256 vaultId = log_.topic1;

        // address(0) is placeholder replaced by Reactive Network with RSC identity on destination
        bytes memory payload = log_.topic0 == BAND_LEFT_TOPIC
            ? abi.encodeWithSignature("enforce(address,uint256)", address(0), vaultId)
            : abi.encodeWithSignature("settle(address,uint256)", address(0), vaultId);

        // Native Reactive Omni callback request
        SYSTEM.requestCallbackV_1_0(
            ISystemContract.CallbackConfiguration_V_1_0({
                chainId:   UNICHAIN_SEPOLIA,
                recipient: callbackRecipient,
                gasLimit:  CALLBACK_GAS,
                payload:   payload
            })
        );
    }
}


