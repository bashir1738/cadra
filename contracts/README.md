# Cadra Smart Contracts

This folder contains the Foundry smart contract suite for **Cadra**, a Uniswap v4 hook for curated liquidity benchmarking against the Pace, integrated with **Reactive Network** for autonomous cross-chain defense.

---

## 1. Architecture Overview

The contracts are built in Solidity `0.8.26` targeting the `cancun` EVM with `via_ir = true` and `optimizer_runs = 1`.

```
contracts/
├── src/
│   ├── CadraHook.sol                # Core Uniswap v4 hook and unlock callback (23,476 B)
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
│   ├── CadraHook.t.sol              # 17 Hook integration & unit tests
│   ├── CadraHook.invariant.t.sol    # Stateful invariant fuzzing suite (512 calls)
│   ├── PaceLib.t.sol                # Benchmark math & fuzz testing suite (5 tests)
│   ├── SettlementLib.t.sol          # Settlement logic & invariant follower protection (6 tests)
│   └── MandateLib.t.sol             # Mandate constraint validation test suite (10 tests)
├── script/
│   ├── Deploy.s.sol                 # HookMiner salt mining & Unichain hook deploy
│   ├── SeedDemo.s.sol               # Pool initialization & 4 demo curators seeding
│   └── deploy_all.sh                # End-to-end multi-chain automated deployer
├── reactive/                        # Isolated Reactive Network Subproject (Lasna 5318007)
│   ├── src/                         # CadraReactive.sol, CadraCallback.sol
│   ├── test/                        # 8 Reactive & Cross-Chain Integration Tests
│   └── script/                      # DeployReactive.s.sol
├── AUDIT.md                         # Formal Security & Threat Model Report
├── AUDIT_PACKAGE.md                 # External Audit Firm Engagement Package (889 nSLOC)
└── MIGRATION.md                     # Protocol Migration & Incident Runbook
```

---

## 2. Core Hook Mechanics (`CadraHook.sol`)

`CadraHook` inherits from `BaseHook` and `IUnlockCallback`:
- **Address Flag Mining**: Uses `AFTER_INITIALIZE` (`1 << 12`), `BEFORE_SWAP` (`1 << 7`), and `AFTER_SWAP` (`1 << 6`).
- **Runtime Size**: **23,476 B** (**+1,100 Bytes** of headroom under the EIP-170 hard limit of 24,576 B).
- **Anti-Sandwich Deposits**: Follower shares are calculated and locked at deposit time via `depositWithSlippage()`, referencing TWAP price and `minSharesOut`.
- **Pro-Rata Dual-Token Redemptions**: Queued withdrawals unwind proportional liquidity and pay out both `token0` and `token1` from idle balances.
- **Autonomous Enforcement**: When pool price breaches a mandate band, `BandLeft` is emitted. Keepers or the Reactive Network callback invoke `enforce(vaultId)`, which returns `false` cleanly if already ahead, and otherwise freezes the curator and deploys 100% of funds into full-range benchmark LP.
- **Liveness-Guaranteed Settlement**: `settle(vaultId)` concludes the epoch. If spot price is temporarily volatile, it reverts to prevent manipulation. If deviation persists beyond `SETTLEMENT_GRACE_PERIOD` (1 hour), it falls back to TWAP valuation, guaranteeing liveness.

---

## 3. Testing & Verification

The suite includes **47 automated tests** (39 in `contracts/`, 8 in `contracts/reactive/`):

```bash
# Run core contracts test suite (39 tests)
forge test

# Run stateful invariant fuzz testing (512 calls across all actors)
forge test --match-test invariant

# Run isolated Reactive subproject suite (8 tests)
cd reactive && forge test
```

### Test Suite Breakdown:
- **`CadraHookTest` (17 tests)**: Full Uniswap v4 lifecycle, anti-sandwich deposit locking, dual-token withdrawals, spot deviation grace fallback, and `signalEpochReady` triggers.
- **`CadraHookInvariantTest` (1 test suite / 512 calls)**: Invariants proven: idle token solvency, mandate confinement, multiplier clamping $[2, 20]$, and share conservation.
- **`MandateLibTest` (10 tests)**: Range alignment, minimum width, boundary containment, and concentration caps.
- **`SettlementLibTest` (6 tests)**: Ahead/behind settlement, bond coverage, deficit recovery, and follower protection invariant fuzzing.
- **`PaceLibTest` (5 tests)**: Geometric benchmark liquidity derivation, fee growth tracking, and reference model invariant fuzzing.
- **`CadraReactiveSubprojectTest` (8 tests)**: Cross-chain end-to-end simulation, system contract authentication, proxy authorization, and topic encoding.

---

## 4. Deployment

### Automated Multi-Chain Broadcast
To deploy across both Unichain Sepolia (1301) and Reactive Lasna (5318007) in a single run:
```bash
./script/deploy_all.sh
```

### Manual Unichain Deployment:
```bash
forge script script/Deploy.s.sol --rpc-url https://sepolia.unichain.org --broadcast
```
