// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IPayable {
    function debt(address client) external view returns (uint256);
    function coverDebt(address client) external payable;
}
