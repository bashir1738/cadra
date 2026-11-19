# Cadra Reactive Subproject (`contracts/reactive`)

This subproject implements the **Reactive Network** cross-chain autonomous safety and settlement loop for Cadra.

---

## 1. Architecture

```
Unichain Sepolia (Chain ID: 1301)                Reactive Lasna (Chain ID: 5318007)
┌───────────────────────────────────────┐        ┌───────────────────────────────────┐
│ CadraHook.sol                         │        │ CadraReactive.sol                 │
│  - Emits: BandLeft(vaultId, tick)     │───────►│  - SYSTEM.subscribe(BandLeft)     │
│  - Emits: EpochReady(vaultId, epoch)  │ logs   │  - SYSTEM.subscribe(EpochReady)   │
│                                       │        │  - react()                        │
│                                       │        │  - SYSTEM.requestCallbackV_1_0()  │
├───────────────────────────────────────┤        └─────────────────┬─────────────────┘
│ CadraCallback.sol                     │                          │
│  - Receives cross-chain execution     │◄─────────────────────────┘
│  - Verifies: onlyServiceProvider      │ callback proxy (0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4)
│  - Verifies: onlyCallbackSender       │ gasLimit: 1,500,000
│  - Calls hook.enforce() / settle()    │
└───────────────────────────────────────┘
```

---

## 2. Contracts Overview

### `CadraReactive.sol` (Deploy on Reactive Lasna)
* **Chain ID**: `5318007` (Reactive Lasna Testnet)
* Subscribes to two origin events from `CadraHook` on Unichain Sepolia:
  * `BandLeft(uint256,int24)`: keccak256 topic `0x...`
  * `EpochReady(uint256,uint256)`: keccak256 topic `0x...`
* In `react(LogRecord calldata log)`, constructs callback configuration with:
  * Destination Chain ID: `1301` (Unichain Sepolia)
  * Recipient: `CadraCallback` address
  * Gas Limit: `1_500_000` (comfortable budget for full-range liquidity parking)
  * Payload: `enforce(uint256)` or `settle(uint256)`

### `CadraCallback.sol` (Deploy on Unichain Sepolia)
* **Chain ID**: `1301` (Unichain Sepolia)
* Inherits `AbstractCallback` from `@reactive/src/base/AbstractCallback.sol`.
* **Access Control**:
  * `onlyServiceProvider`: Ensures the caller is the verified Unichain callback proxy (`0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`).
  * `onlyCallbackSender(sender)`: Ensures the first 160-bit address parameter matches the pinned `CadraReactive` address on Lasna.
* **Execution**: Forwards authenticated requests directly to `hook.enforce(vaultId)` or `hook.settle(vaultId)`.

---

## 3. Testing (8 Tests)

The test suite covers callback authentication, system caller checks, payload topic encoding, and full cross-chain lifecycle simulation:

```bash
# From within contracts/reactive:
forge test
```

### Test Suite:
* `test_callback_enforce_executes_when_authorized`: Authorized proxy + sender executes `enforce()`.
* `test_callback_settle_executes_when_authorized`: Authorized proxy + sender executes `settle()`.
* `test_callback_rejects_unauthorized_proxy`: Caller not matching proxy address reverts `NotAuthorized()`.
* `test_callback_rejects_unauthorized_sender`: Caller not matching reactive address reverts `CallbackNotAuthorized()`.
* `test_react_encodes_enforce_payload_on_band_left`: Verifies 1301 chain ID, recipient, and `enforce` payload encoding.
* `test_react_encodes_settle_payload_on_epoch_ready`: Verifies 1301 chain ID, recipient, and `settle` payload encoding.
* `test_react_reverts_if_not_system`: Non-system callers of `react()` revert.
* `test_end_to_end_cross_chain_lifecycle_enforce_and_settle`: Simulates full event capture $\to$ reaction $\to$ callback dispatch $\to$ hook execution.

---

## 4. Deployment Procedure

Follow the strict 4-step sequence in [DeployReactive.s.sol](file:///home/bash/Documents/GitHub/cadra/contracts/reactive/script/DeployReactive.s.sol):
1. **Deploy CadraReactive** on Lasna:
   ```bash
   forge script script/DeployReactive.s.sol --sig "deployReactive(address)" <HOOK_ADDR> --rpc-url https://lasna-rpc.rnk.dev/ --broadcast
   ```
2. **Deploy CadraCallback** on Unichain Sepolia:
   ```bash
   forge script script/DeployReactive.s.sol --sig "deployCallback(address,address,address)" 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 <REACTIVE_ADDR> <HOOK_ADDR> --rpc-url https://sepolia.unichain.org --broadcast
   ```
3. **Link Callback Recipient** on Lasna:
   ```bash
   forge script script/DeployReactive.s.sol --sig "linkCallback(address,address)" <REACTIVE_ADDR> <CALLBACK_ADDR> --rpc-url https://lasna-rpc.rnk.dev/ --broadcast
   ```
4. **Fund Gas Balances**: Maintain native ETH on Unichain Sepolia for callback billing, and REACT on Lasna for subscription state.
