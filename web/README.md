# Cadra Web Application

A minimalist, high-contrast black & white web interface for **Cadra** built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Design System & Philosophy

- **Minimalist Palette**: Built exclusively around `#000000` (deep void black), `#FFFFFF` (pure white), and architectural grayscale borders (`#171717`, `#262626`, `#A1A1AA`).
- **High-Contrast Geometry**: Razor-sharp borders (`border border-neutral-800`, `border-white/20`), clean rectangular cards, and zero distracting gradients.
- **Phone-First Layout**: Fully responsive interface optimized for mobile viewport navigation as well as wide desktop screens.
- **Strict Terminology**: Designed for clarity—uses intuitive language (*"curator"*, *"the Pace"*, *"ahead"*, *"behind"*, *"bond"*, *"rules"*) rather than low-level Uniswap jargon (*"LP"*, *"tick"*, *"sqrtPriceX96"*) on user-facing screens.
- **Testnet Notice**: Persistent header indicator marking the application as **"UNAUDITED / TESTNET ONLY · UHI11 HOOKATHON"**.

---

## 2. Core Views & Features

### 1. Platform Landing Page (`LandingPage.tsx`)
- **Product Overview & Pitch**: Explains the core problem (paying fees for passive market beta) and Cadra's solution (The Pace benchmark and on-chain mandate enforcement).
- **Separation of Dashboards**: Clarifies the distinct separation between the **Follower Dashboard** (portfolio benchmarking, bond protection, zero fees on market beta) and the **Curator Studio** (mandate configuration, live rule validation, capacity scaling, hook-owned liquidity rebalancing).
- **Three-Step Mechanism**: Explains how Cadra operates from queued deposits to active epoch parking and honest settlement.
- **Roadmap & Next Up**: Displays the progression through smart contracts, frontend, bot fleet, and real-time indexer.

### 2. Follower Dashboard (`FollowerDashboard.tsx`)
- **"You vs the Pace" Hero Card**: The centerpiece card comparing the follower's current balance directly against the passive Pace benchmark in real-time. Highlights net outperformance (Ahead $+g$ or Behind $-g$).
- **Protection Gauge**: Displays the curator's posted USDC bond protecting follower capital.
- **Settlement Countdown**: Live countdown timer tracking remaining time in the current epoch.
- **Queued Deposit & Exit Modals**: Clear interfaces for queuing deposits or redemptions with transparent explanations of why epoch boundary settlement prevents front-running.

### 2. Curator Leaderboard (`Leaderboard.tsx`)
- Ranks curators based on verified on-chain track records against the Pace.
- Shows Ahead/Behind epoch record pills (e.g., `6 Ahead / 0 Behind`).
- Displays cumulative outperformance, capacity multiplier ($m \times \text{Bond}$), and capacity utilization percentage.
- Sortable by record, multiplier, cumulative outperformance, and total capacity.

### 3. Curator Profile & Mandate Inspector (`CuratorProfile.tsx`)
- **Interactive Price Band Visualizer**: A visual bar displaying the curator's allowed mandate corridor ($[\text{minPrice}, \text{maxPrice}]$), active concentrated ranges, and the current pool spot price.
- **Mandate Rules**: Summarizes the on-chain enforced constraints (Max Concentration, Min Range Width, Shortfall Threshold before Parking).
- **Epoch History Table**: Complete historical settlement log showing vault values, Pace benchmark, outperformance gaps, and fee/bond payouts.

### 4. Curator Studio (`CuratorStudio.tsx`)
- **Interactive Rebalancer**: Allows curators to configure multiple range positions and liquidity allocations.
- **Live Mandate Rule Validator**: Replicates `MandateLib.sol` directly in the frontend, providing instant real-time feedback:
  - Validates if ranges stay within the published price band.
  - Checks if range widths meet the required tick minimum.
  - Ensures no range exceeds the maximum concentration cap.
  - Reverts invalid configurations with detailed error explanations before submitting on-chain.
- **Propose New Mandate**: Allows curators to propose rule updates that take effect at the next settlement epoch.
- **Bond Management**: Interface to post additional USDC bond and immediately scale managing capacity.

### 5. Mechanism Demo Sandbox (`LiveSimulator.tsx`)
An interactive sandbox designed for judges and users to test Cadra's unique mechanisms:
- **Slide Pool Price**: Push the ETH/USDC spot price to observe the hook's `afterSwap` callback detect and flag `bandLeft = true`.
- **Trigger Keeper `enforce(vaultId)`**: Simulate a shortfall breach to watch the vault automatically freeze the curator and park 100% of follower funds into the Pace full-range position.
- **Trigger Keeper `settle(vaultId)`**: Settle an epoch to observe fee minting for outperformance or bond reimbursement for shortfalls, accompanied by dynamic multiplier adjustments.
- **Live Event Stream**: Real-time contract event execution log.

---

## 3. Account Switcher

The header includes a built-in role switcher allowing instant testing across different perspectives:
- **Follower (Alice)** (`0x71C...4391`): Experiences portfolio tracking, protection guarantees, and queued deposits/exits.
- **Aura Capital (Tight Curator)** (`0x709...79C8`): High-performing active curator (11× multiplier, \$110,000 capacity).
- **Vortex Alpha (Reckless Curator)** (`0x15d...6A65`): Demonstrates the mandate rejection rules and the keeper parking safety net.

---

## 4. Getting Started

### Installation
```bash
# From the web/ directory
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
The application compiles completely offline with zero external network dependencies during static page generation.
