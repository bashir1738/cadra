// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {LogRecord} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

contract CadraReactive is AbstractReactive {
    uint256 public constant UNICHAIN_SEPOLIA = 1301;

    uint256 public constant BAND_LEFT_TOPIC = uint256(keccak256("BandLeft(uint256,int24)"));
    uint256 public constant EPOCH_READY_TOPIC = uint256(keccak256("EpochReady(uint256,uint256)"));

    uint64 public constant CALLBACK_GAS = 1_500_000;

    address public owner;
    address public hook;
    address public callbackRecipient;
    uint64 public callbackGasLimit = CALLBACK_GAS;

    event HookSubscriptionUpdated(address indexed oldHook, address indexed newHook);
    event CallbackRecipientUpdated(address indexed recipient);
    event CallbackGasLimitUpdated(uint64 gasLimit);

    modifier onlyOwner() {
        require(msg.sender == owner, "NotOwner");
        _;
    }

    constructor(address hook_) payable {
        owner = msg.sender;
        _subscribeHook(hook_);
    }

    function subscribeHook(address hook_) external onlyOwner {
        require(hook_ != address(0), "InvalidHook");
        address oldHook = hook;
        if (oldHook == hook_) return;

        if (oldHook != address(0)) {
            SYSTEM.unsubscribe(
                UNICHAIN_SEPOLIA, oldHook, BAND_LEFT_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
            SYSTEM.unsubscribe(
                UNICHAIN_SEPOLIA, oldHook, EPOCH_READY_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
        }

        hook = hook_;
        _subscribeHook(hook_);
        emit HookSubscriptionUpdated(oldHook, hook_);
    }

    function setCallbackRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "InvalidRecipient");
        callbackRecipient = recipient;
        emit CallbackRecipientUpdated(recipient);
    }

    /// @notice Explicit emergency stop for callbacks; avoids overloading a valid recipient setter with address(0).
    function clearCallbackRecipient() external onlyOwner {
        callbackRecipient = address(0);
        emit CallbackRecipientUpdated(address(0));
    }

    function setCallbackGasLimit(uint64 gasLimit) external onlyOwner {
        require(gasLimit > 0, "InvalidGasLimit");
        callbackGasLimit = gasLimit;
        emit CallbackGasLimitUpdated(gasLimit);
    }

    function react(LogRecord calldata log_) external onlySystem {
        require(log_.chainId == UNICHAIN_SEPOLIA, "InvalidChain");
        require(log_._contract == hook, "InvalidHook");
        require(callbackRecipient != address(0), "NoRecipient");

        uint256 vaultId = log_.topic1;

        require(log_.topic0 == BAND_LEFT_TOPIC || log_.topic0 == EPOCH_READY_TOPIC, "InvalidTopic");

        // address(0) is placeholder replaced by Reactive Network with RSC identity on destination
        bytes memory payload = log_.topic0 == BAND_LEFT_TOPIC
            ? abi.encodeWithSignature("enforce(address,uint256)", address(0), vaultId)
            : abi.encodeWithSignature("settle(address,uint256)", address(0), vaultId);

        // Native Reactive Omni callback request
        SYSTEM.requestCallbackV_1_0(
            ISystemContract.CallbackConfiguration_V_1_0({
                chainId: UNICHAIN_SEPOLIA, recipient: callbackRecipient, gasLimit: callbackGasLimit, payload: payload
            })
        );
    }

    function _subscribeHook(address hook_) internal {
        require(hook_ != address(0), "InvalidHook");
        hook = hook_;
        SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, BAND_LEFT_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        SYSTEM.subscribe(UNICHAIN_SEPOLIA, hook_, EPOCH_READY_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
    }
}
