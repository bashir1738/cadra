# Cadra Core Contracts & Libraries (`contracts/src`)

This directory contains the production smart contracts, mathematical benchmark libraries, and storage types for Cadra.

---

## 1. Contracts Overview

### `CadraHook.sol`
The core Uniswap v4 hook implementing `BaseHook` and `IUnlockCallback`.
* **Runtime Size**: **23,476 Bytes** (1,100 B headroom under EIP-170).
* **Mined Hook Flags**:
  * `AFTER_INITIALIZE_FLAG` (`1 << 12`): Initializes pool state and TwapOracle circular buffer.
  * `BEFORE_SWAP_FLAG` (`1 << 7`): Records block tick observation once per block into the TWAP buffer.
  * `AFTER_SWAP_FLAG` (`1 << 6`): Evaluates spot tick against active vault bands; emits `BandLeft` if out of bounds. Uses a global safe tick envelope to skip checks on >97% of normal swaps.
* **Accounting & Capital Management**:
  * Anti-sandwich deposit queue (`depositWithSlippage`) locking shares at deposit time.
  * Dual-token pro-rata queued withdrawals unwinding pool liquidity and paying `token0` and `token1`.
  * Hook-owned liquidity managed inside `poolManager.unlock()` callbacks.
  * Liveness-preserving settlement with a 1-hour TWAP fallback grace period.

---

## 2. Mathematical Libraries (`contracts/src/libraries`)

* **`PaceLib.sol`**:
  * Derives benchmark liquidity: $L_{\text{pace}} = V_0 / (2 \sqrt{P_0})$.
  * Tracks benchmark value in real-time by combining price appreciation and pool global fee growth:
    $$V_{\text{pace}}(t) = 2 L_{\text{pace}}\sqrt{P_t} + L_{\text{pace}}(\Delta f_0 P_t + \Delta f_1)$$
  * Full precision math using $Q96$ and $Q128$ without intermediate precision loss.
* **`SettlementLib.sol`**:
  * Computes epoch outcomes: mints outperformance fee shares to curators when ahead, or reimburses followers from the curator bond when behind.
  * Tracks carried deficit $D$ that must be fully recovered before future performance fees can be earned.
  * Clamps capacity multipliers dynamically within $[2, 20]$.
* **`MandateLib.sol`**:
  * Enforces the 4 core on-chain rules: price corridors $[\text{minTick}, \text{maxTick}]$, minimum range widths, pool tick spacing alignment, and concentration caps per range.
* **`TwapOracle.sol`**:
  * Circular ring-buffer storing cumulative tick observations to deliver time-weighted average prices resilient to flash loan manipulation.
* **`LiquidityAmounts.sol`**:
  * Calculates exact token amounts and liquidity units for concentrated ranges in Uniswap v4.

---

## 3. Data Types (`contracts/src/types`)

* **`Mandate.sol`**: Defines `Mandate` (boundary constraints, concentration cap, shortfall tolerance) and `Range` (lower tick, upper tick, liquidity).
* **`Vault.sol`**: Defines `Vault` (curator, bond, poolKey, multiplier, deficit, epoch metrics), `Record` (track record), `QueuedDeposit`, and `QueuedWithdraw`.
