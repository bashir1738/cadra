// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title CadraHookProxy
/// @notice ERC-1967 Proxy for CadraHook in Uniswap v4.
/// @dev This contract is mined via CREATE2 so that uint160(address(this)) satisfies Uniswap v4 hook flags:
///      AFTER_INITIALIZE_FLAG (1 << 12), BEFORE_SWAP_FLAG (1 << 7), AFTER_SWAP_FLAG (1 << 6).
///      All hook callbacks and state operations are delegated to the active implementation contract.
contract CadraHookProxy is ERC1967Proxy {
    /// @param _logic Address of the initial CadraHookUpgradeable implementation.
    /// @param _data Calldata of initialize(...) to execute on deployment.
    constructor(address _logic, bytes memory _data) payable ERC1967Proxy(_logic, _data) {}

    /// @notice Returns the expected hook permissions for Uniswap v4 PoolManager validation.
    function getHookPermissions() external pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
}
