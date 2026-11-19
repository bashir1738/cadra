// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Test} from "forge-std/Test.sol";
import {CadraReactive} from "../src/CadraReactive.sol";
import {CadraCallback, ICadraHook} from "../src/CadraCallback.sol";
import {LogRecord} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";

contract MockSystemContract is ISystemContract {
    uint256 public subscriptionCount;
    CallbackConfiguration_V_1_0 public lastCallback;

    function subscribe(
        uint256,
        address,
        bytes32,
        uint256,
        uint256,
        uint256
    ) external override {
        subscriptionCount++;
    }

    function unsubscribe(
        uint256,
        address,
        bytes32,
        uint256,
        uint256,
        uint256
    ) external override {}

    function requestCallbackV_1_0(CallbackConfiguration_V_1_0 calldata config) external override {
        lastCallback = config;
    }
}

contract MockCallbackProxy is IPayable {
    uint256 public debtAmount;

    function setDebt(uint256 d) external {
        debtAmount = d;
    }

    function debt(address) external view override returns (uint256) {
        return debtAmount;
    }

    function coverDebt(address) external payable override {}
}

contract MockHook is ICadraHook {
    uint256 public lastEnforcedVault;
    uint256 public lastSettledVault;

    function enforce(uint256 vaultId) external override returns (bool) {
        lastEnforcedVault = vaultId;
        return true;
    }

    function settle(uint256 vaultId) external override {
        lastSettledVault = vaultId;
    }
}

contract CadraReactiveSubprojectTest is Test {
    address constant SYSTEM_ADDR = 0x0000000000000000000000000000000000fffFfF;

    MockSystemContract mockSystem;
    MockCallbackProxy mockProxy;
    MockHook mockHook;
    CadraReactive reactiveContract;
    CadraCallback callbackContract;

    function setUp() public {
        mockSystem = new MockSystemContract();
        vm.etch(SYSTEM_ADDR, address(mockSystem).code);

        mockProxy = new MockCallbackProxy();
        mockHook = new MockHook();

        reactiveContract = new CadraReactive(address(mockHook));
        callbackContract = new CadraCallback(IPayable(address(mockProxy)), address(reactiveContract), address(mockHook));
        reactiveContract.setCallbackRecipient(address(callbackContract));
    }

    function test_react_encodes_enforce_payload_on_band_left() public {
        uint256 vaultId = 42;
        LogRecord memory logRecord = LogRecord({
            chainId: 1301,
            _contract: address(mockHook),
            topic0: uint256(reactiveContract.BAND_LEFT_TOPIC()),
            topic1: vaultId,
            topic2: 0,
            topic3: 0,
            data: "",
            blockNumber: 100,
            opCode: 0
        });

        vm.prank(SYSTEM_ADDR);
        reactiveContract.react(logRecord);

        (uint256 chainId, address recipient, uint64 gasLimit, bytes memory payload) = MockSystemContract(SYSTEM_ADDR).lastCallback();
        assertEq(chainId, 1301);
        assertEq(recipient, address(callbackContract));
        assertEq(gasLimit, 1_500_000);
        assertEq(payload, abi.encodeWithSignature("enforce(uint256)", vaultId));
    }

    function test_react_encodes_settle_payload_on_epoch_ready() public {
        uint256 vaultId = 99;
        LogRecord memory logRecord = LogRecord({
            chainId: 1301,
            _contract: address(mockHook),
            topic0: uint256(reactiveContract.EPOCH_READY_TOPIC()),
            topic1: vaultId,
            topic2: 0,
            topic3: 0,
            data: "",
            blockNumber: 200,
            opCode: 0
        });

        vm.prank(SYSTEM_ADDR);
        reactiveContract.react(logRecord);

        (uint256 chainId, address recipient, uint64 gasLimit, bytes memory payload) = MockSystemContract(SYSTEM_ADDR).lastCallback();
        assertEq(chainId, 1301);
        assertEq(recipient, address(callbackContract));
        assertEq(gasLimit, 1_500_000);
        assertEq(payload, abi.encodeWithSignature("settle(uint256)", vaultId));
    }

    function test_react_reverts_if_not_system() public {
        LogRecord memory logRecord;
        vm.prank(address(0x1234));
        vm.expectRevert(AbstractReactive.NotAuthorized.selector);
        reactiveContract.react(logRecord);
    }

    function test_callback_enforce_executes_when_authorized() public {
        vm.prank(address(mockProxy), address(reactiveContract));
        callbackContract.enforce(address(reactiveContract), 7);
        assertEq(mockHook.lastEnforcedVault(), 7);
    }

    function test_callback_settle_executes_when_authorized() public {
        vm.prank(address(mockProxy), address(reactiveContract));
        callbackContract.settle(address(reactiveContract), 13);
        assertEq(mockHook.lastSettledVault(), 13);
    }

    function test_callback_rejects_unauthorized_proxy() public {
        vm.prank(address(0xDEAD), address(reactiveContract));
        vm.expectRevert(AbstractCallback.NotAuthorized.selector);
        callbackContract.enforce(address(reactiveContract), 7);
    }

    function test_callback_rejects_unauthorized_sender() public {
        vm.prank(address(mockProxy));
        vm.expectRevert(AbstractCallback.CallbackNotAuthorized.selector);
        callbackContract.enforce(address(0xDEAD), 7);
    }

    /// @notice End-to-end cross-chain simulation (Unichain Sepolia -> Reactive Lasna -> Unichain Sepolia Callback)
    function test_end_to_end_cross_chain_lifecycle_enforce_and_settle() public {
        uint256 vaultId = 77;

        // Step 1: Simulate BandLeft event on Unichain Sepolia (1301)
        LogRecord memory bandLeftLog = LogRecord({
            chainId: 1301,
            _contract: address(mockHook),
            topic0: uint256(reactiveContract.BAND_LEFT_TOPIC()),
            topic1: vaultId,
            topic2: 0,
            topic3: 0,
            data: "",
            blockNumber: 1000,
            opCode: 0
        });

        // Step 2: Reactive Network VM delivers event to CadraReactive on Lasna
        vm.prank(SYSTEM_ADDR);
        reactiveContract.react(bandLeftLog);

        // Step 3: Capture emitted callback request from Reactive SYSTEM contract
        (uint256 destChainId, address callbackDest, uint64 gasBudget, ) = 
            MockSystemContract(SYSTEM_ADDR).lastCallback();

        assertEq(destChainId, 1301, "Target chain must be Unichain Sepolia");
        assertEq(callbackDest, address(callbackContract), "Target must be CadraCallback");
        assertEq(gasBudget, 1_500_000, "Gas budget must be 1.5M");

        // Step 4: Callback Proxy executes the cross-chain transaction on Unichain Sepolia
        // The proxy calls the callback contract with msg.sender = proxy, passing authorized sender as first param
        vm.prank(address(mockProxy));
        callbackContract.enforce(address(reactiveContract), vaultId);
        assertEq(mockHook.lastEnforcedVault(), vaultId, "Hook must be enforced with correct vaultId");

        // Step 5: Test EpochReady event triggering settlement
        LogRecord memory epochReadyLog = LogRecord({
            chainId: 1301,
            _contract: address(mockHook),
            topic0: uint256(reactiveContract.EPOCH_READY_TOPIC()),
            topic1: vaultId,
            topic2: 0,
            topic3: 0,
            data: "",
            blockNumber: 1005,
            opCode: 0
        });

        vm.prank(SYSTEM_ADDR);
        reactiveContract.react(epochReadyLog);

        vm.prank(address(mockProxy));
        callbackContract.settle(address(reactiveContract), vaultId);
        assertEq(mockHook.lastSettledVault(), vaultId, "Hook must be settled with correct vaultId");
    }
}
