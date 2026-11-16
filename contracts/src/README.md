# Cadra Core Contracts & Libraries (`contracts/src`)

This directory contains the production smart contracts and core math libraries for Cadra.

---

## Files Overview

### `CadraHook.sol`
The primary Uniswap v4 hook implementing `BaseHook` and `IUnlockCallback`.
- **Address Mining**: Uses flags `AFTER_INITIALIZE_FLAG (1 << 12)`, `BEFORE_SWAP_FLAG (1 << 7)`, and `AFTER_SWAP_FLAG (1 << 6)`.
- **Vault Management**: Creates vaults, tracks follower shares (ERC-6909 style internal accounting), and records time-weighted prices.
- **Hook-Owned Liquidity**: Executes curator rebalancing and parking liquidity adjustments inside `poolManager.unlock()`.
- **Queued Operations**: Processes deposits and share withdrawals at epoch boundaries to eliminate front-running.
- **Enforcement & Settlement**: Manages keeper `enforce()` to park lagging vaults into the Pace full range, and `settle()` to distribute outperformance fees or bond reimbursements.

---

## Subdirectories

### `libraries/`
- **`PaceLib.sol`**: Computes the benchmark liquidity $L_{\text{pace}} = V_0 / (2 \sqrt{P_0})$ and monitors Pace value using global pool fee growth snapshots.
- **`SettlementLib.sol`**: Evaluates epoch outperformance, mints fee shares, pays bond reimbursements, manages carried deficit, and scales capacity multipliers ($m \in [2, 20]$).
- **`MandateLib.sol`**: Enforces the 4 core mandate rules: allowed price bands, minimum range widths, tick alignment, and max concentration caps.
- **`TwapOracle.sol`**: Ring-buffer storing cumulative tick observations on swaps to ensure manipulation-resistant pool valuations.
- **`LiquidityAmounts.sol`**: Calculates concentrated liquidity amounts and token values across tick ranges.

### `types/`
- **`Mandate.sol`**: `Mandate` and `Range` struct definitions.
- **`Vault.sol`**: `Vault`, `Record`, `QueuedDeposit`, and `QueuedWithdraw` struct definitions.

### `mocks/`
- **`MockERC20.sol`**: Standard ERC-20 token implementation with mint and burn capabilities for local testing.
