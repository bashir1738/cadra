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
        hook.enforce(vaultId);
    }

    function settle(address sender, uint256 vaultId)
        external
        onlyServiceProvider
        onlyCallbackSender(sender)
    {
        hook.settle(vaultId);
    }

    function coverDebt() external {
        _coverDebt();
    }
}
