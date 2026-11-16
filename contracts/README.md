# Cadra Smart Contracts

This folder contains the Foundry smart contract suite for **Cadra**, a Uniswap v4 hook for curated liquidity benchmarking against the Pace.

---

## 1. Contract Architecture

The contracts are built in Solidity `0.8.26` targeting the `cancun` EVM with `via_ir = true`.

```
contracts/
├── src/
│   ├── CadraHook.sol                # Core Uniswap v4 hook and unlock callback
│   ├── libraries/
│   │   ├── PaceLib.sol              # Pace benchmark math & Q96/Q128 valuation
│   │   ├── SettlementLib.sol        # Asymmetric ahead/behind settlement math
│   │   ├── MandateLib.sol           # On-chain mandate and range validation rules
│   │   ├── TwapOracle.sol           # Circular ring buffer recording TWAP ticks
│   │   └── LiquidityAmounts.sol     # Concentrated liquidity amount math
│   ├── types/
│   │   ├── Mandate.sol              # Mandate and Range struct definitions
│   │   └── Vault.sol                # Vault, Record, QueuedDeposit/Withdraw structs
│   └── mocks/
│       └── MockERC20.sol            # Test ERC20 token with mint capabilities
├── test/
│   ├── CadraHook.t.sol              # End-to-end integration test suite
│   ├── PaceLib.t.sol                # Benchmark math & fuzz testing suite
│   ├── SettlementLib.t.sol          # Settlement logic & invariant follower protection
│   └── MandateLib.t.sol             # Mandate constraint validation test suite
└── script/
    ├── Deploy.s.sol                 # HookMiner mining salt for flags & deploy
    └── SeedDemo.s.sol               # Pool initialization & 4 demo curators seeding
```

---

## 2. Core Components

### `CadraHook.sol`
The main hook inheriting from `BaseHook` and `IUnlockCallback`.
- **Hook Flags**:
  - `AFTER_INITIALIZE` (`1 << 12`): Registers pools and starts the TWAP oracle ring buffer.
  - `BEFORE_SWAP` (`1 << 7`): Records spot tick observation into the oracle buffer once per block.
  - `AFTER_SWAP` (`1 << 6`): Cheap $O(1)$ check flagging `bandLeft = true` if pool spot price leaves any active vault's mandate band.
- **Hook-Owned Liquidity**:
  - Vault liquidity is owned directly by the hook contract inside `PoolManager`.
  - Curators submit rebalance instructions; the hook verifies constraints and calls `poolManager.unlock()` to adjust positions.
- **Queued Operations**:
  - `deposit(vaultId, amount0, amount1)`: Queues capital until the next epoch start, ensuring no epoch timing.
  - `requestWithdraw(vaultId, shares)`: Queues shares for payout at the next settlement.
- **Safety Net & Enforcement**:
  - `enforce(vaultId)`: Called by keepers. If a vault's shortfall vs the Pace exceeds `maxShortfallBps`, the curator is frozen and funds are parked 100% into the full-range Pace position.
  - `settle(vaultId)`: Concludes the epoch, mints outperformance fee shares or pays shortfall from the curator bond, adjusts capacity multipliers ($m \in [2, 20]$), processes deposit/withdraw queues, and resets the Pace benchmark for the next epoch.

### `PaceLib.sol`
Computes the honest benchmark:
$$L_{\text{pace}} = \frac{V_0}{2\sqrt{P_0}}$$
$$V_{\text{pace}}(t) = 2 L_{\text{pace}}\sqrt{P_t} + L_{\text{pace}}\left(\Delta f_0 \, P_t + \Delta f_1\right)$$
All arithmetic uses full precision $Q96$ and $Q128$ math without intermediate overflows.

### `SettlementLib.sol`
Evaluates epoch outcomes:
- **Ahead ($g \ge 0$)**: Curator earns performance fee on outperformance above carried deficit; capacity multiplier increases ($m \leftarrow \min(20, m + 1)$).
- **Behind ($g < 0$)**: Curator bond pays follower shortfall; excess forms carried deficit; multiplier drops ($m \leftarrow \max(2, m - 2)$).

### `MandateLib.sol`
Enforces the 4 core rules:
1. All ranges must sit inside the allowed price band $[\text{minTick}, \text{maxTick}]$.
2. Range widths must be at least $\text{minRangeWidth}$ ticks.
3. Range boundaries must align with pool tick spacing.
4. No single range can exceed $\text{maxConcentrationBps}$ of the vault's total value.

---

## 3. Testing & Verification

The suite includes **30 automated tests** across 4 test contracts, combining unit tests, end-to-end hook integration, and invariant fuzzing.

```bash
# Run all tests
forge test

# Run with verbose trace on failure
forge test -vvv

# Run invariant fuzz testing
forge test --match-test testFuzz
```

### Test Suite Breakdown:
- **`MandateLibTest` (10 tests)**:
  - `test_validateMandate_valid`: Valid mandate setup.
  - `test_validateMandate_invalidTicks`: Out-of-order ticks revert.
  - `test_validateMandate_invalidRangeWidth`: Range width below minimum reverts.
  - `test_validateMandate_invalidConcentration`: Concentration $> 100\%$ reverts.
  - `test_validateMandate_invalidShortfall`: Shortfall threshold $> 100\%$ reverts.
  - `test_validateRanges_valid`: Valid ranges pass.
  - `test_validateRanges_outOfBounds_reverts`: Range outside band reverts.
  - `test_validateRanges_tooNarrow_reverts`: Range width below minimum reverts.
  - `test_validateRanges_notAligned_reverts`: Misaligned tick spacing reverts.
  - `test_validateConcentration`: Concentration cap enforcement.
- **`SettlementLibTest` (6 tests)**:
  - `test_settle_ahead_no_prior_deficit`: Ahead settlement without deficit.
  - `test_settle_behind_covered_by_bond`: Behind shortfall reimbursed by bond.
  - `test_settle_behind_exceeding_bond_creates_deficit`: Shortfall exceeding bond creates carried deficit.
  - `test_deficit_must_be_recovered_before_new_fees`: Carried deficit must be paid back before curator earns fees.
  - `test_multiplier_bounds`: Multipliers clamp within $[2, 20]$.
  - `testFuzz_invariant_follower_protection`: Invariant test proving follower value after bond payout $\ge$ Pace value (capped by bond).
- **`PaceLibTest` (5 tests)**:
  - `test_computePaceLiquidity_basic`: Accurate benchmark liquidity derivation.
  - `test_paceValue_increases_with_price`: Monotonic value increase with spot price.
  - `test_paceValue_increases_with_fees`: Exact fee growth accrual matching full-range position.
  - `testFuzz_computePaceLiquidity_and_InitialValue`: Fuzz testing liquidity consistency.
  - `testFuzz_referenceModelComparison`: Fuzz comparison against an independent reference model.
- **`CadraHookTest` (9 tests)**:
  - `test_createVault_and_postBond`: Vault initialization and capacity scaling.
  - `test_proposeMandate_applies_only_at_settlement`: Propose mandate activates strictly at epoch boundary.
  - `test_deposit_queue_and_capacity_limit`: Queued deposit and capacity cap enforcement.
  - `test_queued_withdrawals_lifecycle`: Queued withdrawal and share redemption.
  - `test_rebalance_only_curator`: Access control on rebalancing.
  - `test_rebalance_rejected_for_out_of_bounds`: Mandate rejection on illegal rebalance.
  - `test_rebalance_rejected_for_too_narrow`: Narrow range rejection.
  - `test_afterSwap_sets_bandLeft_and_enforce_parks_vault`: Swap outside band triggers `bandLeft`, keeper `enforce` parks vault into full-range Pace.
  - `test_settle_ahead_lifecycle`: Full settlement cycle with performance fee distribution and multiplier increase.

---

## 4. Deployment

### Using HookMiner for Flag Mining
Uniswap v4 requires hook contracts to possess an address whose leading bits encode their callback permissions (`AFTER_INITIALIZE | BEFORE_SWAP | AFTER_SWAP`).

To deploy using Foundry Script:
```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

To seed the 4 demo curators and test follower positions:
```bash
forge script script/SeedDemo.s.sol --rpc-url <RPC_URL> --broadcast
```
