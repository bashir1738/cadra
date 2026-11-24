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

## How the Uniswap v4 Hook and Reactive Contracts Work Hand in Hand

Cadra uses Uniswap v4 for custody, liquidity management, and rule enforcement, while Reactive Network supplies the autonomous trigger path:

| Stage | Uniswap v4 / Unichain Sepolia | Reactive Network / Lasna |
| :--- | :--- | :--- |
| Observe | `CadraHook.afterSwap` evaluates the pool price and vault mandate. | `CadraReactive` receives subscribed `BandLeft` and `EpochReady` logs. |
| Decide | The hook exposes permissionless `enforce()` and `settle()` entry points. | `react()` maps each event topic to the correct callback payload. |
| Dispatch | `CadraCallback` is the only destination contract accepted by the hook workflow. | The system contract sends the callback request to chain `1301`. |
| Execute | `CadraCallback` calls `CadraHook.enforce(vaultId)` or `settle(vaultId)`. | Reactive supplies the authenticated RSC sender identity. |

The hook remains the source of truth. Reactive does not custody USDC, calculate vault NAV, or override mandates. It only transports an event-derived request across chains. The callback performs a second authorization check before forwarding the request, and the hook performs the final caller, timing, price-deviation, and vault-state checks.

### End-to-End Safety Flow

1. A Uniswap v4 swap moves the pool outside a curator's permitted range.
2. `CadraHook` emits `BandLeft(vaultId, currentTick)` after the swap.
3. `CadraReactive.react()` verifies the system caller, source chain, hook address, and topic.
4. Reactive's system contract schedules `enforce(address,uint256)` for the Unichain callback proxy.
5. `CadraCallback` verifies both the callback proxy and the pinned Reactive sender.
6. `CadraHook.enforce(vaultId)` freezes the vault and parks liquidity into the full-range Pace position when the shortfall rules require it.

Settlement follows the same path with `EpochReady`. If settlement conditions temporarily reject the operation, `CadraCallback` records `SettleFailed` instead of reverting the callback service; anyone can retry settlement once the hook's conditions are satisfied.

### What Happens During a Curator Exit

`closeVault(vaultId)` is executed directly by the curator on Unichain. It permanently stops new deposits, rebalances, and bond additions, then unwinds the vault's active ranges. Followers request withdrawals through the hook; a closed vault can settle immediately, and the frontend prompts the follower wallet and submits the claim flow. Only after follower obligations are satisfied can the curator withdraw excess bond collateral.

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

**In simple terms:** `CadraReactive` watches the Uniswap v4 hook for events that need an automatic response. `CadraCallback` delivers that response back to Unichain, where the hook performs the actual safety or settlement action. The Reactive contracts are automation infrastructure, not a custody layer.

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
| **CadraHook** | Unichain Sepolia (1301) | `0x3515ffDABa1A7c16d5b217013EA6589DAaBA50c0` |

The hook address above is the current Uniswap v4 deployment. The Reactive and callback addresses in this table are from the previous deployment and must be redeployed/relinked before autonomous callbacks are live for this pool.

Deployment transactions:

- CadraReactive: `0xc229c642051e028ed5c4a2ea3516f9418f18e3895b5d229dff63805f461e63db`
- CadraCallback: `0xcc49666c619a4631af8ab9a03c0620b771b9375c67a18f39f59797fd2ef58fae`
- Callback link: `0x8dbc4a6abf03cafe0fe2254168135858dec123e24e743cc93dfbde5f8a4b7ebb`
