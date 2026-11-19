# Cadra Protocol — External Audit Scope & Specification Package

*Prepared for External Security Reviewers (OpenZeppelin, Spearbit, Code4rena, Cantina)*

---

## 1. Engagement Overview

* **Protocol Name**: Cadra
* **Repository**: github.com/cadra-fi/cadra (working branch: `main`)
* **Solidity Version**: `0.8.26` (Cancun EVM, `via_ir = true`, `optimizer_runs = 1`)
* **Framework**: Foundry
* **Core Integrations**: Uniswap v4 (`@uniswap/v4-core`, `@uniswap/v4-periphery`), Reactive Network (`@reactive/reactive-lib-omni`)

---

## 2. Audit Scope & SLOC Breakdown

| File Path | Description | nSLOC | Complexity |
| :--- | :--- | :---: | :---: |
| `contracts/src/CadraHook.sol` | Core Uniswap v4 Hook & Unlock Callback | ~420 | High |
| `contracts/src/libraries/PaceLib.sol` | Benchmark derivation & Q96/Q128 valuation | ~78 | Medium |
| `contracts/src/libraries/SettlementLib.sol` | Outperformance fees, deficit carry & multiplier | ~106 | High |
| `contracts/src/libraries/MandateLib.sol` | Tick alignment, band containment & concentration cap | ~85 | Medium |
| `contracts/src/libraries/TwapOracle.sol` | Circular ring buffer tracking time-weighted ticks | ~95 | Low |
| `contracts/reactive/src/CadraReactive.sol` | Cross-chain reactive contract (Lasna 5318007) | ~60 | Medium |
| `contracts/reactive/src/CadraCallback.sol` | Authenticated callback proxy executor (1301) | ~45 | Medium |
| **Total In Scope** | **7 core contracts / libraries** | **~889** | — |

---

## 3. High-Priority Areas for Reviewers

### A. Epoch Settlement & Dual-Token Withdrawal Unwinding
* **Location**: `CadraHook.sol::settle()` (lines 470–595)
* **Invariants Under Test**:
  * Unwinding liquidity must never leave unbacked debts with Uniswap v4 `PoolManager`.
  * Pro-rata payouts for `token0` and `token1` must be strictly proportional to queued shares over total active shares (`FullMath.mulDiv`).
  * Idle token accounting must strictly equal actual ERC20 balances held by the hook.

### B. Anti-Sandwich Deposit Mechanism
* **Location**: `CadraHook.sol::depositWithSlippage()` (lines 335–375)
* **Mechanic**: `sharesToMint` is calculated using the TWAP sqrt price at the exact moment of queuing rather than at epoch rollover.
* **Review Goal**: Verify that sudden liquidity shifts or sandwich attacks between deposit queuing and epoch settlement cannot dilute depositors or grant disproportionate share issuance.

### C. Cross-Chain Authenticity Verification
* **Location**: `CadraCallback.sol`
* **Mechanic**: The contract inherits `AbstractCallback` and verifies:
  1. `msg.sender == address(callbackProxy)` via `onlyServiceProvider`.
  2. The prepended sender matches the immutable `reactiveContract` via `onlyCallbackSender(sender)`.
* **Review Goal**: Confirm that zero privilege escalation or spoofed execution of `enforce()` or `settle()` can occur from unauthorized cross-chain or local callers.

### D. TWAP Liveness Fallback Circuit Breaker
* **Location**: `CadraHook.sol::settle()` & `_checkSpotDeviation()`
* **Mechanic**: Beyond `SETTLEMENT_GRACE_PERIOD = 1 hours`, `settle()` falls back to TWAP valuation to avoid permanent liveness freezing during sustained market trends.
* **Review Goal**: Validate whether a 300s TWAP window offers sufficient capital-cost resistance against multi-block manipulation.

---

## 4. Test Suite & Verification Results

* **Total Test Suites**: 6 suites (5 main, 1 reactive)
* **Total Automated Tests**: **47 / 47 passing** (0 failures, 0 regressions)
* **Invariant Fuzzing Parameters**:
  * Runs: 16 runs $\times$ 32 depth = 512 stateful handler calls per execution.
  * Invariants Proven: Solvency idle backing, mandate confinement, multiplier clamping $[2, 20]$, and share conservation.

---

## 5. Contact & Bug Bounty

* **Security Contact**: `security@cadra.fi`
* **Bug Bounty Target**: Immunefi (Tier: Critical $100,000 / High $25,000)
