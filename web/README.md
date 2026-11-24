# Cadra Web Application

A minimalist, high-contrast black & white web interface for **Cadra** built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Design System & Philosophy

- **Minimalist Palette**: Built exclusively around `#000000` (deep void black), `#FFFFFF` (pure white), and architectural grayscale borders (`#171717`, `#262626`, `#A1A1AA`).
- **High-Contrast Geometry**: Razor-sharp borders (`border border-neutral-800`, `border-white/20`), clean rectangular cards, and zero distracting gradients.
- **Typography**: Clean Satoshi typography hierarchy with tabular figures for real-time financial counters.
- **No Emojis**: 100% SVG vector iconography throughout all navigation, indicators, and alerts.
- **Strict Terminology**: Designed for clarity—uses intuitive language (*"curator"*, *"the Pace"*, *"ahead"*, *"behind"*, *"bond"*, *"rules"*) rather than low-level Uniswap jargon (*"LP"*, *"tick"*, *"sqrtPriceX96"*) on user-facing screens.
- **Testnet Notice**: Persistent header indicator marking the application as **"UNAUDITED / TESTNET ONLY · UHI11 HOOKATHON"**.

---

## 2. Core Views & Architecture

### 1. Platform Landing Page (`LandingPage.tsx`)
- **Product Overview & Pitch**: Explains the core problem (paying fees for passive market beta) and Cadra's solution (The Pace benchmark and on-chain mandate enforcement).
- **Separation of Dashboards**: Clarifies the distinct separation between the **Follower Dashboard** (portfolio benchmarking, bond protection, zero fees on market beta) and the **Curator Studio** (mandate configuration, live rule validation, capacity scaling, hook-owned liquidity rebalancing).
- **Three-Step Mechanism**: Explains how Cadra operates from queued deposits to active epoch parking and honest settlement.

### 2. Follower Portal (`FollowerDashboard.tsx`)
- **"You vs the Pace" Hero Card**: The centerpiece card comparing the follower's current balance directly against the passive Pace benchmark in real-time. Highlights net outperformance (Ahead $+g$ or Behind $-g$).
- **Protection Gauge**: Displays the curator's posted USDC bond protecting follower capital.
- **Reactive Proof Chain**: Displays the 3-transaction proof chain (`Origin Tx` on Unichain $\to$ `Reactive Tx` on Lasna $\to$ `Callback Tx` on Unichain).
- **Settlement Countdown**: Live countdown timer tracking remaining time in the current epoch.
- **Queued Deposit & Exit Modals**: Clear interfaces for queuing deposits or redemptions with transparent explanations of why epoch boundary settlement prevents front-running.

### 3. Curator Leaderboard (`Leaderboard.tsx`)
- Ranks curators based on verified on-chain track records against the Pace.
- Shows Ahead/Behind epoch record pills (e.g., `6 Ahead / 0 Behind`).
- Displays cumulative outperformance, capacity multiplier ($m \times \text{Bond}$), and capacity utilization percentage.
- Sortable by record, multiplier, cumulative outperformance, and total capacity.

### 4. Curator Profile & Mandate Inspector (`CuratorProfile.tsx`)
- **Interactive Price Band Visualizer**: A visual bar displaying the curator's allowed mandate corridor ($[\text{minPrice}, \text{maxPrice}]$), active concentrated ranges, and the current pool spot price.
- **Mandate Rules**: Summarizes the on-chain enforced constraints (Max Concentration, Min Range Width, Shortfall Threshold before Parking).
- **Epoch History Table**: Complete historical settlement log showing vault values, Pace benchmark, outperformance gaps, and fee/bond payouts.

### 5. Curator Studio (`CuratorStudio.tsx`)
- **Interactive Rebalancer**: Allows curators to configure multiple range positions and liquidity allocations.
- **Live Mandate Rule Validator**: Replicates `MandateLib.sol` directly in the frontend, providing instant real-time feedback:
  - Validates if ranges stay within the published price band.
  - Checks if range widths meet the required tick minimum.
  - Ensures no range exceeds the maximum concentration cap.
  - Reverts invalid configurations with detailed error explanations before submitting on-chain.
- **Propose New Mandate**: Allows curators to propose rule updates that take effect at the next settlement epoch.
- **Bond Management**: Interface to post additional USDC bond and immediately scale managing capacity.

### 6. Mechanism Demo Sandbox (`LiveSimulator.tsx`)
An interactive sandbox designed for judges and users to test Cadra's unique mechanisms:
- **Slide Pool Price**: Push the ETH/USDC spot price to observe the hook's `afterSwap` callback detect and flag `bandLeft = true`.
- **Observe Reactive Cross-Chain Defense**: Watch the simulated cross-chain event loop freeze the curator and park 100% of follower funds into the Pace full-range position.
- **Trigger `settle(vaultId)`**: Settle an epoch to observe fee minting for outperformance or bond reimbursement for shortfalls, accompanied by dynamic multiplier adjustments.
- **Live Event Stream**: Real-time contract event execution log.

---

## 3. Account Switcher

The header includes a built-in role switcher allowing instant testing across different perspectives:
- **Follower (Alice)** (`0x71C...4391`): Experiences portfolio tracking, protection guarantees, and queued deposits/exits.
- **Aura Capital (Tight Curator)** (`0x709...79C8`): High-performing active curator (11× multiplier, \$110,000 capacity).
- **Vortex Alpha (Reckless Curator)** (`0x15d...6A65`): Demonstrates the mandate rejection rules and the keeper parking safety net.

---

## 4. Autonomous Bot Fleet & Simulation

The web workspace includes a self-contained simulation fleet to drive realistic trading volume and automated epoch lifecycle triggers:

* **Swapper Bot (`web/bots/swapper.ts`)**: Generates continuous Uniswap v4 volume. Supports `--sharp` to execute a sudden -15% price crash for testing cross-chain Reactive defense.
* **Curator Swarm (`web/bots/curators.ts`)**: Simulates 4 distinct curator strategies (Tight +/-1%, Wide +/-10%, Lazy inactive, and Reckless mandate-breaching).
* **Thin Epoch Alarm (`web/src/bots/epochAlarm.ts`)**: Reads on-chain epoch timers and triggers `signalEpochReady(vaultId)` when an epoch ends, prompting the Reactive network to settle.

### Running the Bots:
```bash
# Run all simulation bots concurrently:
pnpm run bots

# Run individual bots:
pnpm run bots:swapper
pnpm run bots:curators
pnpm run bots:sharp
```

---

## 5. Live On-Chain Integration (Unichain Sepolia)

The web application interacts directly with deployed contracts on **Unichain Sepolia (Chain ID: 1301)**:

- **Wired via Privy & Wagmi**: Supports MetaMask, Coinbase Wallet, Rainbow, and Privy embedded wallets.
- **Hook Contract**: `0x3515ffDABa1A7c16d5b217013EA6589DAaBA50c0`
- **Uniswap v4 PoolManager**: `0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C`
- **Mock USDC (Token0 / BondToken)**: `0x688Cfa2501c44CB6B3886f4C5662c55b73f36e8D`
- **Mock WETH (Token1)**: `0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6`
- **CadraCallback**: `0xdcff832e039c3793bc16f419cca13258e2203b25` (Unichain Sepolia)
- **CadraReactive (Omni RSC)**: `0xf937aee2e988557ba3774a8a41af349ef7112680` (Reactive Lasna Omni 5318007)
- **Reactive Callback Proxy**: `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4` (Unichain Sepolia)

### Key On-Chain Features:
- **No Dummy Data**: All vaults, positions, Pace values, and follower shares are read directly from `CadraHook` via RPC.
- **On-Chain Vault Creation**: Deploy new curator vaults on-chain with validated mandates (`minTick`, `maxTick`, concentration limits, and shortfall limits).
- **Collateral Bond Posting**: Post USDC skin-in-the-game collateral directly to `CadraHook.postBond()`.
- **Follower Deposits & Withdrawals**: Full pro-rata liquidity accounting with automatic token approvals and anti-sandwich share locking.
- **Range Rebalancer**: Atomic rebalancing with tick-spacing alignment (`tickSpacing = 60`).
- **Landing Page Direct Routing**: Connecting any wallet on the landing page immediately redirects to the active dashboard.
- **1-Click Testnet Faucet**: A built-in header button allowing connected wallets to mint 10,000 mock USDC on Unichain Sepolia with 1 click.

---

## 6. Getting Started

### Installation
```bash
cd web
pnpm install
```

### Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build
```bash
pnpm run build
```
Compiles all 18 routes statically with zero build errors.
