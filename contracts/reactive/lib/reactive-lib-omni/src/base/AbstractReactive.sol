// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IReactive, LogRecord} from "../interfaces/IReactive.sol";
import {ISystemContract} from "../interfaces/ISystemContract.sol";

abstract contract AbstractReactive is IReactive {
    ISystemContract internal constant SYSTEM = ISystemContract(0x8888888888888888888888888888888888888888);
    uint256 internal constant REACTIVE_IGNORE = 0xa65f96fc951c35ead388787e01006f31885618a23a15d8d06577f95738633a06;

    error NotAuthorized();

    modifier onlySystem() {
        if (msg.sender != address(SYSTEM) && msg.sender != 0x0000000000000000000000000000000000fffFfF) revert NotAuthorized();
        _;
    }
}

