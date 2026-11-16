<p align="center">
  <img src="web/public/cadra/logo/cadra-logo-horizontal-white.svg" alt="Cadra Logo" width="400" />
</p>

<p align="center">
  <strong>Follow a curator. Pay only when they beat the Pace.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black.svg" alt="License: MIT" /></a>
  <a href="https://uniswap.org"><img src="https://img.shields.io/badge/Uniswap-v4%20Hook-black.svg" alt="Uniswap v4 Hook" /></a>
  <a href="https://soliditylang.org/"><img src="https://img.shields.io/badge/Solidity-0.8.26-black.svg" alt="Solidity 0.8.26" /></a>
  <a href="contracts/"><img src="https://img.shields.io/badge/Foundry-30%2F30%20Passing-black.svg" alt="Foundry Tests" /></a>
  <a href="web/"><img src="https://img.shields.io/badge/Frontend-Next.js%2016-black.svg" alt="Next.js 16" /></a>
</p>

---

> **TESTNET ONLY**  
> Cadra is a hackathon project built for **Atrium Academy’s UHI11 Hookathon** (Theme: *Active Management and Curation*). The smart contracts and frontend are designed for testnet demonstration and experimentation. Do not deploy to mainnet without formal security audits and legal counsel regarding collective investment schemes.

---

## 1. Overview & Pitch

### The Problem
Managing concentrated liquidity on Uniswap v3/v4 is too complex for passive users, so LPs delegate capital to active liquidity managers. However, traditional vault managers charge performance fees (typically 10–20%) on **any profit**—including market beta (token appreciation) and baseline swap fees that a passive full-range LP would have earned automatically without paying anyone. 

Followers pay fees for market luck, and when a curator makes bad concentrated bets or gets picked off by toxic flow, followers absorb 100% of the downside while the curator loses nothing.

### The Solution: Cadra
**Cadra** is a Uniswap v4 hook that introduces an honest, on-chain benchmark: **The Pace**.

1. **Honest Benchmark**: The Pace calculates exactly what followers' capital would have earned in a plain, full-range $(-\infty, +\infty)$ position in the same pool, including passive fee accrual.
2. **True Outperformance Fees**: Curators earn performance fees **only on the surplus value above the Pace**. If they simply match or lag the passive benchmark, they earn \$0.
3. **On-Chain Mandate Enforcement**: Curators publish immutable or time-delayed mandates (price corridors, minimum range widths, concentration limits). The hook **reverts any rebalancing transaction** that breaches these bounds.
4. **Automated Parking Safety Net**: If a vault falls behind the Pace by more than its mandate allows (e.g., 5% shortfall), the hook freezes the curator and automatically redeploys funds into the Pace itself, capping relative follower losses.
5. **Skin in the Game & Dynamic Capacity**: Curators post a USDC bond. If an epoch ends behind the Pace, the bond reimburses followers for the shortfall. A curator's capacity multiplier ($m \times \text{Bond}$) rises when they beat the Pace and shrinks when they fall behind.

---

## 2. Core Concepts

| Term | What It Means in Cadra |
| :--- | :--- |
| **Curator** | The liquidity strategist who manages active concentrated ranges within the pool. Posts a USDC bond and publishes a mandate. Cannot withdraw follower funds. |
| **Follower** | The depositor who supplies liquidity into a curator's vault and receives internal accounting shares. Pays a fee only when the curator beats the benchmark. |
| **Vault** | One curator's pooled capital. All follower deposits sit in hook-owned liquidity, so every curator rebalance applies to all followers in one atomic transaction. |
| **The Pace** | The on-chain benchmark: what the same initial capital would be worth right now in a plain full-range position in the same pool, fees included. |
| **Mandate** | The enforceable rules published for a vault: allowed price band $[\text{minTick}, \text{maxTick}]$, max concentration per range, min range width, and max shortfall before parking. |
| **Parking** | The automated circuit breaker. If a vault lags the Pace beyond its allowed shortfall, the hook freezes the curator and deploys 100% into the full-range Pace position until settlement. |
| **Epoch** | The settlement cycle: 1 hour on testnet demo (7 days in production). |
| **Bond** | The curator's USDC collateral. Pays followers immediately if the vault finishes an epoch behind the Pace. |
| **Performance Fee** | The curator's share of outperformance above the Pace (default 20%, capped at 30%). |
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

## 4. Architecture & Lifecycle

```
                     ┌─────────────────────────────────────────┐
                     │            CadraHook (v4)               │
                     │  - Holds Hook-Owned Vault Liquidity     │
                     │  - Ring Buffer TWAP Oracle              │
                     │  - On-Chain Mandate Rules Engine        │
                     └────┬───────────────────────────────┬────┘
                          │                               │
             rebalance()  │                               │ enforce() / settle()
                          ▼                               ▼
                     ┌─────────┐                     ┌─────────┐
                     │ Curator │                     │ Keeper  │
                     └─────────┘                     └─────────┘
                          │                               │
        deposit() / exit()│                               │ swaps
                          ▼                               ▼
                     ┌──────────┐                    ┌─────────┐
                     │ Follower │                    │ Traders │
                     └──────────┘                    └─────────┘
```

1. **Epoch Cycle**: Deposits and withdrawals wait in transparent queues and settle at epoch boundaries to prevent arbitrage or front-running of benchmark observations.
2. **Two-Tier Mandate Checks**:
   - **Inline Rebalance Validation**: Evaluated inside `rebalance()` via `MandateLib`. Any tick boundary outside $[\text{minTick}, \text{maxTick}]$, any range width $< \text{minRangeWidth}$, or concentration $> \text{maxConcentrationBps}$ causes the transaction to revert immediately.
   - **Cheap Swap Flagging (`afterSwap`)**: On trader swaps, the hook runs a fast $O(1)$ check against vault price bounds. If spot leaves the band, it flags `bandLeft = true` without taxing traders with heavy valuations.
   - **Keeper Enforcement**: Keepers call `enforce(vaultId)` to evaluate the vault at TWAP. If shortfall exceeds `maxShortfallBps`, the curator is frozen and the vault is parked into the full-range Pace position.

---

## 5. Repository Structure

```text
cadra/
├── contracts/               # Foundry Smart Contract Suite
│   ├── src/
│   │   ├── CadraHook.sol    # Core Uniswap v4 Hook & Unlock Callback
│   │   ├── libraries/       # PaceLib, SettlementLib, MandateLib, TwapOracle
│   │   ├── types/           # Mandate.sol, Vault.sol
│   │   └── mocks/           # MockERC20 test tokens
│   ├── test/                # 30 Comprehensive Unit & Invariant Fuzz Tests
│   ├── script/              # Deploy.s.sol (HookMiner), SeedDemo.s.sol
│   └── README.md            # Contracts documentation
├── web/                     # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/             # App Router pages and styling
│   │   ├── components/      # Minimalist B&W Dashboard, Leaderboard, Studio, Simulator
│   │   ├── types/           # Frontend TypeScript interfaces
│   │   └── lib/             # Demo curators (Tight, Wide, Lazy, Reckless)
│   └── README.md            # Frontend documentation
├── foundry.toml             # Root Foundry configuration (solc 0.8.26, Cancun, via-ir)
├── remappings.txt           # Unified dependency remappings
└── README.md                # Project Root Documentation (This file)
```

---

## 6. Getting Started

### Prerequisites
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
- [Node.js](https://nodejs.org/) (v20+ or v24)
- [pnpm](https://pnpm.io/) (v10+)

### 1. Smart Contracts & Tests
Run all 30 tests directly with Foundry:
```bash
forge test
```
To run tests with detailed gas reporting:
```bash
forge test --gas-report
```

### 2. Launch the Web Application
```bash
cd web
pnpm install
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Atrium Academy UHI11 Fit

Cadra targets the core theme of **Active Management and Curation**:
- **Curated LP Networks**: Followers copy expert liquidity strategies through vault shares.
- **Vault Modules with Curator Parameters**: Curators control range positioning while constrained by on-chain mandates.
- **Honest Performance Fees**: Curators earn fees strictly when generating alpha over a passive holding benchmark.
- **Reputation-Weighted Multipliers**: Curators who beat the Pace earn expanded managing capacity; underperformers are demoted.

---

## 8. License

Distributed under the [MIT License](LICENSE).
