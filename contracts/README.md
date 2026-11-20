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

## 4. Deployed Contracts (Unichain Sepolia & Reactive Lasna)

| Contract | Network | Address | Explorer Link |
| :--- | :--- | :--- | :--- |
| **CadraHook (v2)** | Unichain Sepolia (1301) | `0x728D9b5f428B736A26D07879F55C3982Ddf890C0` | [Uniscan](https://sepolia.uniscan.xyz/address/0x728D9b5f428B736A26D07879F55C3982Ddf890C0) |
| **Uniswap v4 PoolManager** | Unichain Sepolia (1301) | `0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C` | [Uniscan](https://sepolia.uniscan.xyz/address/0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C) |
| **Mock USDC (token0 / bondToken)** | Unichain Sepolia (1301) | `0x688Cfa2501c44CB6B3886f4C5662c55b73f36e8D` | [Uniscan](https://sepolia.uniscan.xyz/address/0x688Cfa2501c44CB6B3886f4C5662c55b73f36e8D) |
| **Mock WETH (token1)** | Unichain Sepolia (1301) | `0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6` | [Uniscan](https://sepolia.uniscan.xyz/address/0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6) |
| **CadraCallback** | Unichain Sepolia (1301) | `0xAcd2f109b03F5014f1F8A6587a075DfF76C7F941` | [Uniscan](https://sepolia.uniscan.xyz/address/0xAcd2f109b03F5014f1F8A6587a075DfF76C7F941) |
| **Reactive Callback Proxy** | Unichain Sepolia (1301) | `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4` | [Uniscan](https://sepolia.uniscan.xyz/address/0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4) |
| **CadraReactive (Omni RSC)** | Reactive Lasna Omni (5318007) | `0x061216db95D483fc0e7e0c43976A62B7E207ba35` | [Reactscan](https://lasna.reactscan.net/address/0x061216db95D483fc0e7e0c43976A62B7E207ba35) |

### On-Chain Transactions:
- **CadraReactive Deployed on Lasna Omni**: [`0x1dfd4e736099a8f03e2df931f1117f196f2277befbb8c5a504b6f896eda57a62`](https://lasna.reactscan.net/tx/0x1dfd4e736099a8f03e2df931f1117f196f2277befbb8c5a504b6f896eda57a62)
- **CadraCallback Deployed on Unichain Sepolia**: [`0xa90b00eb928da0c1312e7483823a38dc533ccf6253543a6cc1724e051ff85beb`](https://sepolia.uniscan.xyz/tx/0xa90b00eb928da0c1312e7483823a38dc533ccf6253543a6cc1724e051ff85beb)
- **Callback Recipient Linked on Lasna**: [`0x965837cecf912af870bb2377f52f67127acf4e16bf64462cdff064e20f6ed05e`](https://lasna.reactscan.net/tx/0x965837cecf912af870bb2377f52f67127acf4e16bf64462cdff064e20f6ed05e)
- **Omni System Contract Reserve Deposit (0.5 lREACT)**: [`0x807fbb22a6fe24da903482607fd2bb62fc6b4684da223467d6be539a2dce9fe1`](https://lasna.reactscan.net/tx/0x807fbb22a6fe24da903482607fd2bb62fc6b4684da223467d6be539a2dce9fe1)
- **Vault #1 Created**: [`0xc3d2eb5619198640bfd17ae25bb924d34f8ada1faba475336f7fcbb4c661f0fa`](https://sepolia.uniscan.xyz/tx/0xc3d2eb5619198640bfd17ae25bb924d34f8ada1faba475336f7fcbb4c661f0fa)
- **Collateral Bond Posted ($5,000 USDC)**: [`0xe6ae92fadf1738ef29416284bb351a91f2e96fd84d690dc9ac11d606f08ffeb7`](https://sepolia.uniscan.xyz/tx/0xe6ae92fadf1738ef29416284bb351a91f2e96fd84d690dc9ac11d606f08ffeb7)

---

## 5. Deployment Guide

### Automated Multi-Chain Broadcast
To deploy across both Unichain Sepolia (1301) and Reactive Lasna (5318007) in a single run:
```bash
./script/deploy_all.sh
```

### Manual Unichain Deployment:
```bash
forge script script/Deploy.s.sol --rpc-url https://sepolia.unichain.org --broadcast
```
