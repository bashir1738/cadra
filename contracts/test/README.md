# Cadra Test Suites (`contracts/test`)

This directory contains the automated test suites for Cadra, covering invariant fuzzing, mathematical accuracy, and end-to-end hook lifecycles.

---

## Running the Tests

From the project root:
```bash
forge test
```

Or from within `contracts/`:
```bash
forge test
```

---

## Test Suites (30 Passing Tests)

### 1. `CadraHook.t.sol` (9 Tests)
Tests full integration with Uniswap v4 `PoolManager`:
- `test_createVault_and_postBond`: Verifies vault registration, bond deposits, and capacity multiplier scaling.
- `test_proposeMandate_applies_only_at_settlement`: Verifies proposed mandate updates remain pending until the upcoming epoch settlement.
- `test_deposit_queue_and_capacity_limit`: Verifies deposits enter the queue and respect the curator's maximum capacity cap.
- `test_queued_withdrawals_lifecycle`: Verifies queued share redemptions pay out properly at epoch boundary.
- `test_rebalance_only_curator`: Validates caller permissions on rebalances.
- `test_rebalance_rejected_for_out_of_bounds`: Verifies `rebalance()` reverts when a range breaches the published mandate band.
- `test_rebalance_rejected_for_too_narrow`: Verifies `rebalance()` reverts when a range width is narrower than `minRangeWidth`.
- `test_afterSwap_sets_bandLeft_and_enforce_parks_vault`: Tests the live trigger lifecycle: trader swap pushes spot price out of band, `afterSwap` marks `bandLeft = true`, and keeper `enforce()` automatically freezes the curator and redeploys funds into the full-range Pace.
- `test_settle_ahead_lifecycle`: Tests ahead settlement, fee share minting to curator, and capacity multiplier increment ($m \leftarrow \min(20, m + 1)$).

### 2. `PaceLib.t.sol` (5 Tests)
Validates the Pace benchmark math:
- `test_computePaceLiquidity_basic`: Validates initial Pace liquidity computation.
- `test_paceValue_increases_with_price`: Validates price appreciation tracking.
- `test_paceValue_increases_with_fees`: Validates pool global fee growth tracking.
- `testFuzz_computePaceLiquidity_and_InitialValue`: Fuzz tests consistent initial valuation across arbitrary prices and initial deposits.
- `testFuzz_referenceModelComparison`: Invariant fuzz test comparing PaceLib against an independent mathematical reference model.

### 3. `SettlementLib.t.sol` (6 Tests)
Validates asymmetric settlement and follower protection:
- `test_settle_ahead_no_prior_deficit`: Verifies performance fee calculation when curator beats the Pace.
- `test_settle_behind_covered_by_bond`: Verifies bond reimbursement pays followers for shortfall.
- `test_settle_behind_exceeding_bond_creates_deficit`: Verifies shortfall beyond bond creates carried deficit.
- `test_deficit_must_be_recovered_before_new_fees`: Verifies curators cannot earn fees until prior deficits are erased.
- `test_multiplier_bounds`: Verifies capacity multipliers stay within the $[2, 20]$ bounds.
- `testFuzz_invariant_follower_protection`: Invariant fuzz test proving follower net value $\ge$ Pace value (capped by bond coverage).

### 4. `MandateLib.t.sol` (10 Tests)
Validates constraint checks:
- Verifies mandate boundaries, tick spacing alignments, minimum range widths, and maximum concentration caps.
