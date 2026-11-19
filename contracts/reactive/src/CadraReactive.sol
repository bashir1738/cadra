// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {LogRecord} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

contract CadraReactive is AbstractReactive {
    uint256 public constant UNICHAIN_SEPOLIA = 1301;

    bytes32 public constant BAND_LEFT_TOPIC   = keccak256("BandLeft(uint256,int24)");
    bytes32 public constant EPOCH_READY_TOPIC = keccak256("EpochReady(uint256,uint256)");

    uint64 public constant CALLBACK_GAS = 1_500_000;

    address public owner;
    address public callbackRecipient;

    modifier onlyOwner() { require(msg.sender == owner, "NotOwner"); _; }

    constructor(address hook_) payable {
        owner = msg.sender;
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

        uint256 vaultId = uint256(log_.topic1);

        bytes memory payload = log_.topic0 == uint256(BAND_LEFT_TOPIC)
            ? abi.encodeWithSignature("enforce(uint256)", vaultId)
            : abi.encodeWithSignature("settle(uint256)", vaultId);

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
