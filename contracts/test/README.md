# Cadra Test Suites (`contracts/test`)

This directory contains the automated test suites for Cadra, combining end-to-end integration with Uniswap v4 `PoolManager`, mathematical property testing, and multi-actor stateful invariant fuzzing.

---

## Running the Tests

```bash
# Run all 39 tests in this folder
forge test

# Run stateful invariant fuzz tests (16 runs x 32 depth = 512 calls)
forge test --match-test invariant

# Run with verbose call traces on failure
forge test -vvv
```

---

## Test Suites (39 Passing Tests)

### 1. `CadraHook.t.sol` (17 Tests)
Validates core hook workflows and lifecycle execution:
* `test_createVault_and_postBond`: Vault initialization, bond deposits, and capacity multiplier scaling.
* `test_proposeMandate_applies_only_at_settlement`: Propose mandate activates strictly at upcoming epoch boundaries.
* `test_deposit_queue_and_capacity_limit`: Queued deposit and capacity cap enforcement.
* `test_anti_sandwich_deposit_locks_shares`: Verifies share issuance is locked at deposit time via TWAP, neutralizing front-running.
* `test_queued_withdrawals_lifecycle`: Queued share redemptions pay out properly at epoch boundaries.
* `test_pro_rata_dual_token_withdrawal_with_position_unwind`: Proves dual-token payouts unwind liquidity correctly.
* `test_withdrawal_pays_token0_when_idle1_insufficient`: Verifies `token0` is paid when `idle1` is depleted.
* `test_rebalance_only_curator`: Access control on rebalancing.
* `test_rebalance_rejected_for_out_of_bounds`: Mandate rejection on illegal rebalance.
* `test_rebalance_rejected_for_too_narrow`: Narrow range rejection.
* `test_afterSwap_sets_bandLeft_and_enforce_parks_vault`: Tests live trigger: swap out of band sets `bandLeft = true`, and `enforce()` parks funds into the full-range Pace.
* `test_enforce_noop_when_ahead_or_below_threshold`: Verifies keeper/reactive `enforce()` returns `false` cleanly without reverting.
* `test_settle_ahead_lifecycle`: Outperformance fee distribution and multiplier increase.
* `test_settle_spot_deviation_grace_fallback`: Immediate deviation reverts; beyond 1-hour grace window, settlement cleanly succeeds on TWAP fallback.
* `test_signalEpochReady_emits_when_epoch_ended`: Emits `EpochReady` for Reactive settlement.
* `test_signalEpochReady_reverts_early`: Reverts if called before epoch end.
* `test_signalEpochReady_reverts_double`: Prevents duplicate signals within the same epoch.

### 2. `CadraHook.invariant.t.sol` (1 Invariant Suite / 512 Calls)
Stateful invariant fuzzing running through `CadraHandler` across 512 random actions:
* `invariant_idleBackedByBalances`: Contract token balances strictly equal or exceed internal idle records.
* `invariant_mandateBounds`: All active ranges strictly conform to mandate bounds.
* `invariant_multiplierBounds`: Capacity multipliers strictly clamp within $[2, 20]$.
* `invariant_sharesAccounting`: Total vault shares strictly equal sum of follower and curator balances.

### 3. `SettlementLib.t.sol` (6 Tests)
Validates asymmetric settlement and follower protection:
* `test_settle_ahead_no_prior_deficit`: Outperformance fee calculation.
* `test_settle_behind_covered_by_bond`: Bond reimbursement covers shortfall.
* `test_settle_behind_exceeding_bond_creates_deficit`: Uncovered shortfall forms carried deficit.
* `test_deficit_must_be_recovered_before_new_fees`: Curators cannot earn fees while deficit carry remains.
* `test_multiplier_bounds`: Multipliers clamp within $[2, 20]$.
* `testFuzz_invariant_follower_protection`: Invariant test proving follower net value $\ge$ Pace value (capped by bond).

### 4. `PaceLib.t.sol` (5 Tests)
Validates mathematical benchmark derivations:
* `test_computePaceLiquidity_basic`: Initial benchmark liquidity calculation.
* `test_paceValue_increases_with_price`: Price appreciation tracking.
* `test_paceValue_increases_with_fees`: Pool global fee growth accrual.
* `testFuzz_computePaceLiquidity_and_InitialValue`: Fuzz testing initial valuation.
* `testFuzz_referenceModelComparison`: Fuzz comparison against an independent reference model.

### 5. `MandateLib.t.sol` (10 Tests)
Validates constraint checks:
* Verifies mandate boundaries, tick alignments, minimum range widths, and maximum concentration caps.
