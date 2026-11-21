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

    mapping(uint256 => bool) public lastEnforceResult;
    mapping(uint256 => uint256) public lastEnforceTimestamp;
    mapping(uint256 => uint256) public lastSettleTimestamp;

    constructor(IPayable callbackProxy_, address reactive_, address hook_)
        payable
        AbstractCallback(callbackProxy_, reactive_)
    {
        hook = ICadraHook(hook_);
    }

    function enforce(address sender, uint256 vaultId)
        external
        onlyServiceProvider
        onlyCallbackSender(sender)
    {
        bool success = hook.enforce(vaultId);
        lastEnforceResult[vaultId] = success;
        lastEnforceTimestamp[vaultId] = block.timestamp;
        emit EnforceExecuted(vaultId, success, block.timestamp);
    }

    function settle(address sender, uint256 vaultId)
        external
        onlyServiceProvider
        onlyCallbackSender(sender)
    {
        hook.settle(vaultId);
        lastSettleTimestamp[vaultId] = block.timestamp;
        emit SettleExecuted(vaultId, block.timestamp);
    }

    function coverDebt() external {
        _coverDebt();
    }
}
