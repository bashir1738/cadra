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
│  - Verifies: onlyCallbackSender       │ gasLimit: configurable (1,500,000 default)
│  - Calls hook.enforce() / settle()    │
└───────────────────────────────────────┘
```

---

## 2. Contracts Overview

### `CadraReactive.sol` (Deploy on Reactive Lasna)
* **Chain ID**: `5318007` (Reactive Lasna Testnet)
* Subscribes to two origin events from `CadraHook` on Unichain Sepolia:
  * `BandLeft(uint256,int24)`: topic `0x6c356a6957ccf065fc59d3c74724e228c51994b9e42ae4c08e230a1918e8ddd0`
  * `EpochReady(uint256,uint256)`: topic `0x7b1263dc6ed177a3419ec2537a03364b6c7fd870ff1e4d4d83c06591b5534a02`
* In `react(LogRecord calldata log)`, constructs callback configuration with:
  * Destination Chain ID: `1301` (Unichain Sepolia)
  * Recipient: `CadraCallback` address
  * Gas Limit: configurable via `setCallbackGasLimit(uint64)` (default `1_500_000`; raise it for vaults with many positions)
  * Payload: `enforce(address,uint256)` or `settle(address,uint256)`; the zero address is replaced by Reactive with the RSC sender

### `CadraCallback.sol` (Deploy on Unichain Sepolia)
* **Chain ID**: `1301` (Unichain Sepolia)
* Inherits `AbstractCallback` from `@reactive/src/base/AbstractCallback.sol`.
* **Access Control**:
  * `onlyServiceProvider`: Ensures the caller is the verified Unichain callback proxy (`0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`).
  * `onlyCallbackSender(sender)`: Ensures the first 160-bit address parameter matches the pinned `CadraReactive` address on Lasna.
  * **Execution**: Forwards authenticated requests directly to `hook.enforce(vaultId)` or `hook.settle(vaultId)`. A temporary settlement revert is caught and emitted as `SettleFailed`, so the callback service itself does not fail silently.

---

## 3. Testing (15 Tests)

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
* Settlement callback failures are caught and emitted as `SettleFailed`; `lastSettleResult` and `lastSettleTimestamp` expose the latest attempt for monitoring and retry operations.

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
4. **Tune callback gas if needed**: The owner can call `setCallbackGasLimit(uint64)` on `CadraReactive` when vaults contain many positions.
5. **Fund Gas Balances**: Maintain native ETH on Unichain Sepolia for callback billing, and REACT on Lasna for subscription state.

---

## 5. Deployed Testnet Addresses

| Contract | Network | Address |
| :--- | :--- | :--- |
| **CadraReactive (Omni RSC)** | Reactive Lasna Omni (5318007) | `0xf937aee2e988557ba3774a8a41af349ef7112680` |
| **CadraCallback** | Unichain Sepolia (1301) | `0xdcff832e039c3793bc16f419cca13258e2203b25` |
| **Callback Proxy** | Unichain Sepolia (1301) | `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4` |
| **System Contract** | Reactive Lasna Omni (5318007) | `0x8888888888888888888888888888888888888888` |
| **CadraHook** | Unichain Sepolia (1301) | `0x728D9b5f428B736A26D07879F55C3982Ddf890C0` |

Deployment transactions:

- CadraReactive: `0xc229c642051e028ed5c4a2ea3516f9418f18e3895b5d229dff63805f461e63db`
- CadraCallback: `0xcc49666c619a4631af8ab9a03c0620b771b9375c67a18f39f59797fd2ef58fae`
- Callback link: `0x8dbc4a6abf03cafe0fe2254168135858dec123e24e743cc93dfbde5f8a4b7ebb`
