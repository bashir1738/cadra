<p align="center">
  <img src="web/public/cadra/logo/cadra-logo-horizontal-white.svg" alt="Cadra Logo" width="400" />
</p>

<p align="center">
  <strong>Follow a curator. Pay only when they beat the Pace.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black.svg" alt="License: MIT" /></a>
  <a href="https://uniswap.org"><img src="https://img.shields.io/badge/Uniswap-v4%20Hook-black.svg" alt="Uniswap v4 Hook" /></a>
  <a href="https://reactive.network"><img src="https://img.shields.io/badge/Reactive-Network%20Lasna-black.svg" alt="Reactive Network" /></a>
  <a href="https://soliditylang.org/"><img src="https://img.shields.io/badge/Solidity-0.8.26-black.svg" alt="Solidity 0.8.26" /></a>
  <a href="contracts/"><img src="https://img.shields.io/badge/Foundry-47%2F47%20Passing-black.svg" alt="Foundry Tests" /></a>
  <a href="web/"><img src="https://img.shields.io/badge/Frontend-Next.js%2016-black.svg" alt="Next.js 16" /></a>
</p>

---

> **TESTNET ONLY**  
> Cadra is built for **Atrium Academy’s UHI11 Hookathon** (Theme: *Active Management and Curation*). The smart contracts and frontend are designed for testnet demonstration and experimentation on Unichain Sepolia (1301) and Reactive Lasna (5318007).

---

## 1. Overview & Pitch

### The Problem
Managing concentrated liquidity on Uniswap v3/v4 is too complex for passive users, so LPs delegate capital to active vault managers. However, traditional vault managers charge performance fees (typically 10–20%) on **any profit**—including market beta (token appreciation) and baseline swap fees that a passive full-range LP would have earned automatically without paying anyone. 

Followers pay fees for market luck, and when a curator makes bad concentrated bets or gets picked off by toxic flow, followers absorb 100% of the downside while the curator loses nothing.

### The Solution: Cadra
**Cadra** is a Uniswap v4 hook that introduces an honest, on-chain benchmark: **The Pace**, guarded autonomously by **Reactive Network**.

1. **Honest Benchmark**: The Pace calculates exactly what followers' capital would have earned in a plain, full-range $(-\infty, +\infty)$ position in the same pool, including passive fee accrual.
2. **True Outperformance Fees**: Curators earn performance fees **only on the surplus value above the Pace**. If they simply match or lag the passive benchmark, they earn \$0.
3. **On-Chain Mandate Enforcement**: Curators publish immutable mandates (price corridors, minimum range widths, concentration limits). The hook **reverts any rebalancing transaction** that breaches these bounds.
4. **Autonomous Cross-Chain Safety Loop**: Powered by Reactive Network, when pool spot price breaches a mandate band, `BandLeft` triggers cross-chain execution from Reactive Lasna to Unichain Sepolia via `CadraCallback`, automatically parking the vault into the full-range Pace without human keepers.
5. **Anti-Sandwich Share Locking**: Follower shares are locked at deposit time based on TWAP sqrt price (`depositWithSlippage`), completely preventing front-running and settle-time sandwich attacks.
6. **Skin in the Game & Dynamic Capacity**: Curators post a USDC bond. If an epoch ends behind the Pace, the bond reimburses followers for the shortfall. A curator's capacity multiplier ($m \times \text{Bond}$) rises when they beat the Pace and drops when they fall behind.

---

## 2. Core Concepts

| Term | What It Means in Cadra |
| :--- | :--- |
| **Curator** | The liquidity strategist who manages active concentrated ranges within the pool. Posts a USDC bond and publishes a mandate. Cannot withdraw follower funds. |
| **Follower** | The depositor who supplies liquidity into a curator's vault and receives internal accounting shares. Pays a fee only when the curator beats the benchmark. |
| **Vault** | One curator's pooled capital. All follower deposits sit in hook-owned liquidity, so every curator rebalance applies to all followers in one atomic transaction. |
| **The Pace** | The on-chain benchmark: what the same initial capital would be worth right now in a plain full-range position in the same pool, fees included. |
| **Mandate** | The enforceable rules published for a vault: allowed price band $[\text{minTick}, \text{maxTick}]$, max concentration per range, min range width, and max shortfall before parking. |
| **Parking** | The automated circuit breaker. If a vault lags the Pace or leaves its band, funds are deployed 100% into the full-range Pace position until settlement. |
| **Epoch** | The settlement cycle: 1 hour on testnet demo (7 days in production). |
| **Bond** | The curator's USDC collateral. Pays followers immediately if the vault finishes an epoch behind the Pace. |
| **Capacity** | The maximum capital a curator may manage: $\text{Bond} \times m$. Multiplier $m$ scales with verified track record (from $2\times$ to $20\times$). |
| **Deficit Carry** | Any shortfall exceeding the bond. Curators must make up this deficit in future epochs before earning fees again. |

---

## 3. Mathematical Specifications

### The Pace Benchmark Math
All valuations are denominated in `token1` (e.g., USDC), and $P$ represents the time-weighted price of `token0` in `token1` derived from the hook's TWAP oracle.

At epoch start $t = 0$, with vault value $V_0$, the Pace's benchmark liquidity is fixed:
$$L_{\text{pace}} = \frac{V_0}{2\sqrt{P_0}}$$

At any subsequent time $t$ during the epoch, the Pace is worth:
$$V_{\text{pace}}(t) = 2 L_{\text{pace}}\sqrt{P_t} + L_{\text{pace}}\left(\Delta f_0 \, P_t + \Delta f_1\right)$$

Where:
- $\Delta f_0$ and $\Delta f_1$ represent the global fee growth since epoch start:
  $$\Delta f_0 = \frac{\text{feeGrowthGlobal0X128}(t) - \text{feeGrowthGlobal0X128}(0)}{2^{128}}$$
  $$\Delta f_1 = \frac{\text{feeGrowthGlobal1X128}(t) - \text{feeGrowthGlobal1X128}(0)}{2^{128}}$$
- $2 L_{\text{pace}}\sqrt{P_t}$ reflects the principal value of a full-range position under geometric mean pricing.

### Asymmetric Settlement Math
Let gap $g = V_{\text{vault}} - V_{\text{pace}}$, carried deficit $D$, curator fee rate $f$, bond $B$, and multiplier $m$:

#### Case 1: Ahead ($g \ge 0$)
The curator outperformed the passive benchmark. Carried deficits are recovered first before new fees are minted:
$$\text{fee} = f \cdot \max(0,\, g - D)$$
$$D \leftarrow \max(0,\, D - g)$$
$$m \leftarrow \min(20,\, m + 1)$$

#### Case 2: Behind ($g < 0$)
The curator underperformed the benchmark. The bond covers the shortfall directly to followers:
$$\text{payout} = \min(-g,\, B)$$
$$B \leftarrow B - \text{payout}$$
$$D \leftarrow D + (-g - \text{payout})$$
$$m \leftarrow \max(2,\, m - 2)$$

---

## 4. Multi-Chain Autonomous Architecture

```
Unichain Sepolia (1301)                             Reactive Lasna (5318007)
┌──────────────────────────────────────────┐        ┌─────────────────────────────┐
│ CadraHook (Uniswap v4 Hook)              │        │ CadraReactive               │
│  - Hook-Owned Concentrated Liquidity     │───────►│  - SYSTEM.subscribe(...)    │
│  - Ring Buffer TWAP Oracle               │ logs   │  - react()                  │
│  - Emits: BandLeft, EpochReady           │        │  - SYSTEM.requestCallback() │
├──────────────────────────────────────────┤        └──────────────┬──────────────┘
│ CadraCallback                            │                       │
│  - Authenticated cross-chain executor    │◄──────────────────────┘
│  - enforce(vaultId) / settle(vaultId)    │ callback proxy
└──────────────────────────────────────────┘
```

1. **Autonomous Guard Loop**:
   - Swaps on Uniswap v4 are monitored in `afterSwap`.
   - If spot leaves the mandate corridor, `BandLeft` is emitted.
   - `CadraReactive` on Lasna picks up the event and requests a callback.
   - `CadraCallback` on Unichain executes `enforce()`, freezing the curator and parking funds into full range.
2. **Autonomous Settlement Loop**:
   - When an epoch ends, a thin alarm triggers `signalEpochReady(vaultId)`.
   - `CadraReactive` receives the `EpochReady` log and dispatches a callback to `CadraCallback.settle(vaultId)`.
   - Pro-rata dual-token withdrawals (`token0` and `token1`) are executed, and fees or bond reimbursements settle.

---

## 5. Repository Structure

```text
cadra/
├── contracts/                   # Foundry Smart Contract Suite (Solidity 0.8.26)
│   ├── src/                     # CadraHook.sol, PaceLib, SettlementLib, MandateLib
│   ├── test/                    # 39 Unit, Invariant, and Fuzzing Tests (512 calls)
│   ├── script/                  # Deploy.s.sol, SeedDemo.s.sol, deploy_all.sh
│   ├── reactive/                # Reactive Network Subproject (Lasna 5318007)
│   │   ├── src/                 # CadraReactive.sol, CadraCallback.sol
│   │   ├── test/                # 8 Reactive & Cross-Chain Integration Tests
│   │   └── script/              # DeployReactive.s.sol
│   ├── AUDIT.md                 # Formal Security & Threat Model Report
│   ├── AUDIT_PACKAGE.md         # Audit Firm Engagement Scope (889 nSLOC)
│   ├── MIGRATION.md             # Protocol Migration & Incident Runbook
│   └── README.md                # Contracts documentation
├── web/                         # Next.js 16 Web Application (TypeScript, Tailwind)
│   ├── src/                     # Follower Portal, Curator Studio, Profile, Leaderboard, Simulator
│   ├── bots/                    # Swapper bot, curator swarm, epochAlarm.ts
│   └── README.md                # Frontend documentation
├── foundry.toml                 # Root Foundry configuration (Cancun, via-ir, optimizer)
└── README.md                    # Root Documentation (This file)
```

---

## 6. Getting Started

### Prerequisites
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
- [Node.js](https://nodejs.org/) (v20+ or v24)
- [pnpm](https://pnpm.io/) (v10+)

### 1. Smart Contract Verification (47 Tests)
Run the core contracts test suite (39 tests):
```bash
cd contracts
forge test
```

Run the stateful invariant fuzzing suite (512 multi-actor calls):
```bash
forge test --match-test invariant
```

Run the Reactive cross-chain subproject suite (8 tests):
```bash
cd reactive
forge test
```

### 2. Multi-Chain Testnet Deployment
Ensure your deployer address holds testnet ETH on Unichain Sepolia (1301) and testnet REACT on Reactive Lasna (5318007), then execute the automated multi-chain deployer:
```bash
./contracts/script/deploy_all.sh
```

### 3. Launch the Web Application
```bash
cd web
pnpm install
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. License

Distributed under the [MIT License](LICENSE).
