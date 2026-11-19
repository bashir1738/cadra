// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IPayable} from "../interfaces/IPayable.sol";

abstract contract AbstractCallback {
    IPayable internal immutable callbackProxy;
    address internal immutable callbackSender;

    error NotAuthorized();
    error CallbackNotAuthorized();

    modifier onlyServiceProvider() {
        if (msg.sender != address(callbackProxy)) revert NotAuthorized();
        _;
    }

    modifier onlyCallbackSender(address sender) {
        if (sender != callbackSender) revert CallbackNotAuthorized();
        _;
    }

    constructor(IPayable callbackProxy_, address callbackSender_) payable {
        callbackProxy = callbackProxy_;
        callbackSender = callbackSender_;
    }

    function _coverDebt() internal {
        uint256 debt = callbackProxy.debt(address(this));
        if (debt > 0 && address(this).balance >= debt) {
            callbackProxy.coverDebt{value: debt}(address(this));
        }
    }
}
