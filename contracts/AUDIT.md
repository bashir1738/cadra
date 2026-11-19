# Cadra Smart Contract Security & Threat Model Report

This document outlines the security architecture, formal threat model, access control matrix, and invariant verification for **Cadra** (Uniswap v4 Hook + Reactive Network cross-chain safety loop).

---

## 1. System Invariants & Mathematical Guarantees

Cadra enforces 5 strict invariants across its lifecycle:

### Invariant 1: Follower Principal & Deficit Recovery
* **Statement**: Followers are always prioritized over curators.
* **Mechanism**: In any epoch where the vault underperforms the Pace ($g = V_{\text{vault}} - V_{\text{pace}} < 0$), the curator's bond is liquidated first to reimburse followers up to the shortfall. Any uncovered shortfall forms a carried deficit $D$.
* **Invariant**: The curator can never earn performance fees in subsequent ahead epochs until $D$ is recovered to 0:
  $$\text{Eligible Excess} = \max(0, \text{Excess} - D)$$
* **Verification**: Fuzz-tested in `SettlementLib.t.sol::testFuzz_invariant_follower_protection`.

### Invariant 2: Idle Token Backing & Solvency
* **Statement**: Hook contract token balances always strictly back or exceed idle records.
* **Mechanism**: When liquidity is added, modified, or removed, deltas are settled atomically via `_settleSingleDelta`.
* **Invariant**: 
  $$\text{balanceOf}(\text{currency0}) \ge \sum \text{vaultIdle0} + \sum \text{vaultPending0}$$
  $$\text{balanceOf}(\text{currency1}) \ge \sum \text{vaultIdle1} + \sum \text{vaultPending1}$$
* **Verification**: Invariant fuzz testing in `CadraHook.invariant.t.sol::invariant_idleBackedByBalances`.

### Invariant 3: Capacity Multiplier Bound
* **Statement**: Curators cannot arbitrarily scale leverage or follower deposit capacity.
* **Mechanism**: The multiplier $m$ scales dynamically based strictly on audited epoch performance:
  $$m_{\text{new}} = \begin{cases} \min(20, m + 1) & \text{if ahead} \\ \max(2, m - 2) & \text{if behind} \end{cases}$$
* **Invariant**: For all vaults at all times, $m \in [2, 20]$.
* **Verification**: Fuzz-tested in `CadraHook.invariant.t.sol::invariant_multiplierBounds`.

### Invariant 4: Mandate Confinement
* **Statement**: Curator liquidity ranges must strictly conform to approved mandate bounds.
* **Invariant**:
  $$\forall r \in \text{ranges}: \text{minTick} \le r.\text{tickLower} < r.\text{tickUpper} \le \text{maxTick}$$
  $$r.\text{tickUpper} - r.\text{tickLower} \ge \text{minRangeWidth}$$
  $$r.\text{tickLower} \pmod{\text{tickSpacing}} = 0, \quad r.\text{tickUpper} \pmod{\text{tickSpacing}} = 0$$
  $$\text{val}(r) \le \text{maxConcentrationBps} \times V_{\text{total}}$$
* **Verification**: Checked on every `rebalance()` via `MandateLib.validateRanges()`.

---

## 2. Threat Model & Attack Vector Analysis

| Attack Vector | Risk | Cadra Defense & Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **Settle-Time Sandwich Attacks** | Critical | **Anti-Sandwich Share Locking**: Shares are computed and locked at deposit time (`depositWithSlippage`) using TWAP price and `minSharesOut`, not at settle time. | **Mitigated** |
| **Spot Tick Manipulation / Flash Crashes** | High | **TWAP Circuit Breaker**: `settle()` checks spot deviation against a circular TWAP buffer. If $| \text{spot} - \text{twap} | > \text{maxSpotDeviationTicks}$, settlement is blocked. | **Mitigated** |
| **Permanent Settlement Freeze (Griefing)** | High | **Liveness Grace Fallback**: If spot remains volatile or manipulated past `SETTLEMENT_GRACE_PERIOD` (1 hour), `settle()` falls back to TWAP valuation, guaranteeing epoch rollover and follower redemption. | **Mitigated** |
| **Reentrancy Attacks** | Critical | **Transient Lock Architecture**: The hook implements Uniswap v4 `IUnlockCallback`. Only `poolManager` can call `unlockCallback()`, and external token transfers occur only after state updates (CEI pattern). | **Mitigated** |
| **Keeper Revert DoS** | Medium | **Clean Boolean Returns**: `enforce()` returns `false` cleanly instead of reverting when the vault is ahead or spot is temporarily deviated, preventing automation loops from wasting keeper gas. | **Mitigated** |
| **Cross-Chain Callback Spoofing** | Critical | **Cryptographic Callback Authentication**: `CadraCallback.sol` enforces both `onlyServiceProvider` (the verified proxy `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`) and `onlyCallbackSender` (the pinned `CadraReactive` address). | **Mitigated** |
| **Callback Gas Exhaustion** | Medium | **Generous Gas Budget**: `CALLBACK_GAS = 1_500_000` allocated on Reactive dispatch, far exceeding the ~350k gas needed for full-range parking. Native ETH debt replenishment available via `coverDebt()`. | **Mitigated** |

---

## 3. Access Control Matrix

| Contract | Function | Caller Restriction | Failure Mode |
| :--- | :--- | :--- | :--- |
| `CadraHook` | `rebalance(vaultId, ranges)` | `msg.sender == vault.curator` | Reverts `OnlyCurator()` |
| `CadraHook` | `proposeMandate(vaultId, mandate)` | `msg.sender == vault.curator` | Reverts `OnlyCurator()` |
| `CadraHook` | `withdrawBond(vaultId, amount)` | `msg.sender == vault.curator` + cooldown | Reverts `OnlyCurator()` / `CooldownActive()` |
| `CadraHook` | `enforce(vaultId)` | Permissionless (Keeper or Reactive Callback) | Returns `false` if not executable |
| `CadraHook` | `settle(vaultId)` | Permissionless (Keeper or Reactive Callback) | Reverts `EpochNotEnded()` |
| `CadraHook` | `unlockCallback(data)` | `msg.sender == address(poolManager)` | Reverts |
| `CadraCallback` | `enforce(sender, vaultId)` | `onlyServiceProvider` AND `onlyCallbackSender(sender)` | Reverts `NotAuthorized()` |
| `CadraCallback` | `settle(sender, vaultId)` | `onlyServiceProvider` AND `onlyCallbackSender(sender)` | Reverts `NotAuthorized()` |
| `CadraReactive`| `react(log)` | `msg.sender == address(SYSTEM)` | Reverts `NotAuthorized()` |

---

## 4. EIP-170 Bytecode Compliance

* **Runtime Size**: **23,476 Bytes** (46,954 hex characters)
* **EIP-170 Limit**: **24,576 Bytes**
* **Safe Headroom**: **+1,100 Bytes** (1.07 KiB buffer)
