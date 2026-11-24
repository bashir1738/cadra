// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";

interface ICadraHook {
    function enforce(uint256 vaultId) external returns (bool);
    function settle(uint256 vaultId) external;
}

contract CadraCallback is AbstractCallback {
    ICadraHook public immutable hook;

    event EnforceExecuted(uint256 indexed vaultId, bool success, uint256 timestamp);
    event SettleExecuted(uint256 indexed vaultId, uint256 timestamp);
    event SettleFailed(uint256 indexed vaultId, bytes reason, uint256 timestamp);

    mapping(uint256 => bool) public lastEnforceResult;
    mapping(uint256 => uint256) public lastEnforceTimestamp;
    mapping(uint256 => uint256) public lastSettleTimestamp;
    mapping(uint256 => bool) public lastSettleResult;

    constructor(IPayable callbackProxy_, address reactive_, address hook_)
        payable
        AbstractCallback(callbackProxy_, reactive_)
    {
        hook = ICadraHook(hook_);
    }

    function enforce(address sender, uint256 vaultId) external onlyServiceProvider onlyCallbackSender(sender) {
        bool success = hook.enforce(vaultId);
        lastEnforceResult[vaultId] = success;
        lastEnforceTimestamp[vaultId] = block.timestamp;
        emit EnforceExecuted(vaultId, success, block.timestamp);
    }

    function settle(address sender, uint256 vaultId) external onlyServiceProvider onlyCallbackSender(sender) {
        // Settlement can legitimately be unavailable temporarily (for example while
        // spot deviation is outside the permitted range). Do not revert the callback:
        // the failure is recorded for operators and permissionless keepers can retry.
        (bool success, bytes memory reason) = address(hook).call(abi.encodeCall(ICadraHook.settle, (vaultId)));
        lastSettleResult[vaultId] = success;
        lastSettleTimestamp[vaultId] = block.timestamp;
        if (success) {
            emit SettleExecuted(vaultId, block.timestamp);
        } else {
            emit SettleFailed(vaultId, reason, block.timestamp);
        }
    }

    function coverDebt() external {
        _coverDebt();
    }
}
