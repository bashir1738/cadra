<p align="center">
  <img src="web/public/cadra/logo/cadra-logo-horizontal-white.svg" alt="Cadra Logo" width="400" />
</p>

<p align="center">
  <strong>Follow a curator. Pay only when they beat the Pace.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black.svg" alt="License: MIT" /></a>
  <a href="https://uniswap.org"><img src="https://img.shields.io/badge/Uniswap-v4%20Hook-black.svg" alt="Uniswap v4 Hook" /></a>
  <a href="https://unichain.org"><img src="https://img.shields.io/badge/Unichain-Sepolia%201301-black.svg" alt="Unichain Sepolia" /></a>
  <a href="https://reactive.network"><img src="https://img.shields.io/badge/Reactive-Network%20Lasna-black.svg" alt="Reactive Network" /></a>
  <a href="https://soliditylang.org/"><img src="https://img.shields.io/badge/Solidity-0.8.26-black.svg" alt="Solidity 0.8.26" /></a>
  <a href="contracts/"><img src="https://img.shields.io/badge/Foundry-47%2F47%20Passing-black.svg" alt="Foundry Tests" /></a>
  <a href="web/"><img src="https://img.shields.io/badge/Frontend-Next.js%2016-black.svg" alt="Next.js 16" /></a>
</p>

---

> **TESTNET ONLY**  
> Cadra is built for **Atrium Academy’s UHI11 Hookathon** (Theme: *Active Management and Curation*). The smart contracts and frontend operate live on **Unichain Sepolia (Chain ID: 1301)** and **Reactive Lasna (Chain ID: 5318007)**.

### Cadra

Cadra lets users follow a curator who manages Uniswap v4 liquidity for them. Followers deposit USDC into a vault, the curator manages the liquidity within published rules, and fees are charged only when the vault beats a passive benchmark called the Pace. The curator also posts a USDC bond to help cover losses. Uniswap v4 holds and executes the liquidity; Reactive Network watches for rule breaches and sends the safety action back to the v4 hook.

---

## 1. Live Testnet Deployments (Unichain Sepolia & Reactive Lasna Omni)

Cadra contracts are deployed and verified live across **Unichain Sepolia (1301)** and **Reactive Lasna Omni (5318007)**:

| Contract / Entity | Network | Address / Identifier | Explorer Link |
| :--- | :--- | :--- | :--- |
| **CadraHook** | Unichain Sepolia (1301) | `0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0) |
| **Uniswap v4 PoolManager** | Unichain Sepolia (1301) | `0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C) |
| **Official Circle USDC (token0 / bondToken)** | Unichain Sepolia (1301) | `0x31d0220469e10c4E71834a79b1f276d740d3768F` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0x31d0220469e10c4E71834a79b1f276d740d3768F) |
| **Mock WETH (token1)** | Unichain Sepolia (1301) | `0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6) |
| **CadraCallback** | Unichain Sepolia (1301) | `0x2687c7c2EDC5401C515C7364AB506cA9ecE55fE8` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0x2687c7c2EDC5401C515C7364AB506cA9ecE55fE8) |
| **Reactive Callback Proxy** | Unichain Sepolia (1301) | `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4` | [View on Uniscan](https://sepolia.uniscan.xyz/address/0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4) |
| **CadraReactive (Omni RSC)** | Reactive Lasna Omni (5318007) | `0xf937aee2e988557ba3774a8a41af349ef7112680` | [View on Reactscan](https://lasna.reactscan.net/address/0xf937aee2e988557ba3774a8a41af349ef7112680) |
| **Reactive Omni System Contract** | Reactive Lasna Omni (5318007) | `0x8888888888888888888888888888888888888888` | [View on Reactscan](https://lasna.reactscan.net/address/0x8888888888888888888888888888888888888888) |

> Read-only checks confirm that the Reactive contract subscribes to the current hook and has this callback recipient configured; the callback's immutable hook also matches. A live `BandLeft` emission from the current hook is confirmed on-chain (see below); delivery of that event to `CadraReactive.react()` and the return callback into `CadraCallback.enforce()` have not yet been observed, so the full loop is not verified end-to-end.

### Reactive Omni Architecture & Verification

1. **Omni Lasna Network Confirmation**:
   - **Network**: Reactive Lasna (Chain ID: `5318007`). Lasna completed the official migration to the **Omni fork** (CometBFT consensus, instant finality, ~1s block time, elimination of the legacy RVM).
   - **RPC Endpoint**: `https://lasna-rpc.rnk.dev/`
   - **Explorer**: `https://lasna.reactscan.net/`
   - **System Contract**: `0x8888888888888888888888888888888888888888` (Omni System Contract handling native event subscriptions and `requestCallbackV_1_0`).

2. **Callback Proxy & Multi-Layer Authorization**:
   - On Unichain Sepolia, cross-chain execution is invoked directly by the official Reactive **Callback Proxy** at `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4` (`msg.sender`).
   - `CadraCallback` enforces strict dual authentication:
     - `onlyServiceProvider`: Verifies that `msg.sender == callbackProxy` (`0x9299...7FC4`).
     - `onlyCallbackSender`: Verifies that the injected leading argument matches the authorized RSC address `0xf937aee2e988557ba3774a8a41af349ef7112680`. Calls from unauthorized proxies or unexpected reactive senders instantly revert (`NotAuthorized` / `CallbackNotAuthorized`).

3. **Contract Funding & Reserves**:
   - **`CadraReactive` (Lasna)**:
     - Contract balance: **`0.1 lREACT`** (funded at deployment).
     - System Contract gas reserve: **`1.3 lREACT`** deposited via `SYSTEM.depositTo(rscAddress)`:
       - Initial deposit (0.5 lREACT): [`0x807fbb22a6fe24da903482607fd2bb62fc6b4684da223467d6be539a2dce9fe1`](https://lasna.reactscan.net/tx/0x807fbb22a6fe24da903482607fd2bb62fc6b4684da223467d6be539a2dce9fe1)
       - Top-up deposit (0.8 lREACT): [`0xd2e519fac1102c5e967a46033e54af5ef2f89fa99f4870e2d5b6162c03b689e1`](https://lasna.reactscan.net/tx/0xd2e519fac1102c5e967a46033e54af5ef2f89fa99f4870e2d5b6162c03b689e1)
   - **`CadraCallback` (Unichain Sepolia)**:
     - Funded with **`0.003 ETH`** gas reserve in contract balance to cover any execution debt on the callback proxy via `_coverDebt()`.

### Live Reactive Cross-Chain Safety Transactions

**Confirmed with the current deployment:**

- **Live Uniswap v4 Swap Emitting `BandLeft` (Unichain Sepolia)**:
  - **Transaction Hash**: [`0x752896f65d3f096777263aa2645fd200142a812fecea532469f2e41c27c6a0b9`](https://sepolia.uniscan.xyz/tx/0x752896f65d3f096777263aa2645fd200142a812fecea532469f2e41c27c6a0b9)
  - **Block**: `68788251`
  - **Emitted Event**: `BandLeft(vaultId: 1, tick: -887272)` (Topic0: `0x6c356a6957ccf065fc59d3c74724e228c51994b9e42ae4c08e230a1918e8ddd0`) from `CadraHook` `0x6f01d91B4BA3D5d5f97Fe955D5a0536ce97710C0`
  - **Result**: Hook set `Vault 1.bandLeft = true` and cleared the active band mask; the flag is still set on-chain.
- **Omni `CadraReactive` Deployment on Lasna (5318007)**:
  - **Transaction Hash**: [`0xc229c642051e028ed5c4a2ea3516f9418f18e3895b5d229dff63805f461e63db`](https://lasna.reactscan.net/tx/0xc229c642051e028ed5c4a2ea3516f9418f18e3895b5d229dff63805f461e63db)
  - **Contract Address**: `0xf937aee2e988557ba3774a8a41af349ef7112680`
  - **Subscribed Events**: `BandLeft(uint256,int24)` and `EpochReady(uint256,uint256)` on Unichain Sepolia (Chain ID: `1301`) via Omni System Contract `0x8888888888888888888888888888888888888888`.

**Not yet confirmed:**

- Delivery of the `BandLeft` event above to `CadraReactive.react()` on Reactive Lasna, and the return callback into `CadraCallback.enforce()` on Unichain, have not been observed (`lastEnforceResult(1) = false`, `lastEnforceTimestamp(1) = 0` at time of writing). The end-to-end safety loop therefore remains unverified; only the origin event and the read-only wiring (listed above) are confirmed.

**Historical (earlier deployments, superseded — retained for reference):**

- **Earlier Swap Emitting `BandLeft` (Unichain Sepolia)**:
  - **Pool Liquidity Seeding Tx**: [`0x1f752a2dcfae5c09d4b4316b6b28e7a296b51a938132a7554f3429943c646a40`](https://sepolia.uniscan.xyz/tx/0x1f752a2dcfae5c09d4b4316b6b28e7a296b51a938132a7554f3429943c646a40)
  - **Live Swap Execution Tx**: [`0xbd90334f32e57cec739b548f9f7e5d3cb29acaaac1cb6f23373d26c3ffd24825`](https://sepolia.uniscan.xyz/tx/0xbd90334f32e57cec739b548f9f7e5d3cb29acaaac1cb6f23373d26c3ffd24825)
  - **Block**: `68360030`
  - **Emitted Event**: `BandLeft(vaultId: 1, tick: -198080)` (Topic0: `0x6c356a6957ccf065fc59d3c74724e228c51994b9e42ae4c08e230a1918e8ddd0`)
  - **Result**: Hook updated `Vault 1` (`bandLeft = true`), cleared active band mask, and notified Reactive Network via subscription.
- **`CadraCallback` Deployment on Unichain Sepolia (1301)**:
  - **Transaction Hash**: [`0x7835463a99ce65d0cbacc6fd3bd2b18f0015e705e6e0e7aac1375dd5d508dcf9`](https://sepolia.uniscan.xyz/tx/0x7835463a99ce65d0cbacc6fd3bd2b18f0015e705e6e0e7aac1375dd5d508dcf9)
  - **Contract Address**: `0xdcff832e039c3793bc16f419cca13258e2203b25` (historical callback; superseded by `0x2687c7c2EDC5401C515C7364AB506cA9ecE55fE8`)
  - **Authorized Proxy**: `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`
  - **Authorized Sender (RSC)**: `0xf937aee2e988557ba3774a8a41af349ef7112680`
- **Reactive Callback Recipient Linked on Lasna Omni**:
  - **Transaction Hash**: [`0x6ef362402205a8de616c9c6ea29fc5cfdfeec8f5ce2a25993f8200beb2fa8b22`](https://lasna-omni.reactscan.net/tx/0x6ef362402205a8de616c9c6ea29fc5cfdfeec8f5ce2a25993f8200beb2fa8b22)
  - **Recipient Configured**: `0xdcff832e039c3793bc16f419cca13258e2203b25` (historical recipient; superseded by `0x2687c7c2EDC5401C515C7364AB506cA9ecE55fE8`)

### Live On-Chain Vault State & Transactions

- **Vault #1 Initialization**:
  - **Transaction Hash**: [`0xc3d2eb5619198640bfd17ae25bb924d34f8ada1faba475336f7fcbb4c661f0fa`](https://sepolia.uniscan.xyz/tx/0xc3d2eb5619198640bfd17ae25bb924d34f8ada1faba475336f7fcbb4c661f0fa)
  - **Block**: `68352027`
  - **Pool Configuration**: USDC / WETH, 3000 fee tier (0.30%), tickSpacing `60`.
  - **Mandate**: Allowed price band `[-69060, -46080]`, max concentration `5000` (50%), min range width `120`, max shortfall `500` (5%).
- **Collateral Bond Deposit**:
  - **USDC Approval Tx**: [`0x3b944a06d40c9c1d43ca7be850e9178a4e9f13f1ad3bbfd68c2d2ce3ade89a3d`](https://sepolia.uniscan.xyz/tx/0x3b944a06d40c9c1d43ca7be850e9178a4e9f13f1ad3bbfd68c2d2ce3ade89a3d)
  - **postBond Tx**: [`0xe6ae92fadf1738ef29416284bb351a91f2e96fd84d690dc9ac11d606f08ffeb7`](https://sepolia.uniscan.xyz/tx/0xe6ae92fadf1738ef29416284bb351a91f2e96fd84d690dc9ac11d606f08ffeb7)
  - **Bond Amount**: $5,000 USDC posted, unlocking $25,000 USDC follower managing capacity at the initial 5× multiplier.

---

## 2. Overview & Pitch

### The Problem
Managing concentrated liquidity on Uniswap v4 is too complex for passive users, so LPs delegate capital to active vault managers. However, traditional vault managers charge performance fees (typically 10–20%) on **any profit**—including market beta (token appreciation) and baseline swap fees that a passive full-range LP would have earned automatically without paying anyone.

Followers pay fees for market luck, and when a curator makes bad concentrated bets or gets picked off by toxic flow, followers absorb 100% of the downside while the curator loses nothing.

### The Solution: Cadra
**Cadra** is a Uniswap v4 hook that introduces an honest, on-chain benchmark: **The Pace**, guarded autonomously by **Reactive Network**.

1. **Honest Benchmark**: The Pace calculates exactly what followers' capital would have earned in a plain, full-range $(-\infty, +\infty)$ position in the same pool, including passive fee accrual.
2. **True Outperformance Fees**: Curators earn performance fees **only on the surplus value above the Pace**. If they simply match or lag the passive benchmark, they earn \$0.
3. **On-Chain Mandate Enforcement**: Curators publish immutable mandates (price corridors, minimum range widths, concentration limits). The hook **reverts any rebalancing transaction** that breaches these bounds.
4. **Autonomous Cross-Chain Safety Loop**: Powered by Reactive Network, when pool spot price breaches a mandate band, `BandLeft` triggers cross-chain execution from Reactive Lasna to Unichain Sepolia via `CadraCallback`, automatically parking the vault into the full-range Pace without human keepers.
5. **Anti-Sandwich Share Locking**: Follower shares are locked at deposit time based on TWAP sqrt price (`depositWithSlippage`), preventing front-running and settle-time sandwich attacks.
6. **Skin in the Game & Dynamic Capacity**: Curators post a USDC bond. If an epoch ends behind the Pace, the bond reimburses followers for the shortfall. A curator's capacity multiplier ($m \times \text{Bond}$) rises when they beat the Pace and drops when they fall behind.

### Why Reactive Network is Essential (Autonomous Execution vs. Keepers)

A natural question arises: *If `CadraHook.enforce()` is permissionless and callable by anyone, why is Reactive Network required?*

1. **Zero Off-Chain Keeper Dependencies**: Traditional keeper networks (e.g., Gelato, Chainlink Automation, custom bots) require continuous off-chain infrastructure, RPC subscriptions, relayer key management, balance monitoring, and economic profit incentives (paying keepers extra bounty fees). If keeper servers stall, gas spikes, or bounty margins disappear, vaults remain unprotected.
2. **Sub-Second Deterministic Latency**: Reactive Network operates with CometBFT consensus on Reactive Lasna (~0.7s–1.0s block times) with direct validator event ingestion. As soon as a toxic swap pushes price outside the curator's mandate band, Reactive processes `react()` and dispatches the callback proxy on Unichain Sepolia within ~1 second—preventing toxic orderflow from exploiting unhedged liquidity.
3. **Guaranteed Execution without MEV Extortion**: Keepers only execute when profitable. In market crashes, keeper gas auctions can delay critical parking transactions by blocks or minutes. Reactive Network guarantees autonomous callback delivery directly through the protocol's system contract and authorized callback proxy (`0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`).

### How Uniswap v4 and Reactive Network Work Together

Cadra separates liquidity control from event-driven automation. **Uniswap v4 is the execution layer**: `CadraHook` owns the vault accounting and concentrated liquidity, validates curator mandates, maintains the Pace benchmark, and emits canonical events from the pool lifecycle. **Reactive Network is the observation and dispatch layer**: `CadraReactive` listens to those events on Reactive Lasna and requests an authenticated callback back to Unichain Sepolia.

The handoff works as follows:

1. A swap enters the Uniswap v4 `PoolManager`. CadraHook's `afterSwap` hook compares the observed price with each vault's permitted corridor.
2. When a vault leaves its corridor, CadraHook emits `BandLeft(vaultId, tick)`. At epoch boundaries, a permissionless signal emits `EpochReady(vaultId, epoch)`.
3. CadraReactive is subscribed to those two event topics through Reactive's system contract. Its `react()` function accepts only system-delivered logs from chain `1301` and the pinned hook address.
4. CadraReactive requests a callback to Unichain Sepolia. The callback payload is `enforce(address,uint256)` for a band breach or `settle(address,uint256)` for an epoch boundary; Reactive replaces the zero-address placeholder with the RSC identity.
5. CadraCallback accepts the request only from the authorized callback proxy and the pinned CadraReactive sender, then calls the hook. The hook performs the final state transition atomically: parking liquidity, settling the Pace result, processing withdrawals, and updating bond coverage.

This division keeps funds and protocol rules on Uniswap v4 while allowing Reactive Network to provide deterministic cross-chain monitoring and execution. Reactive never holds follower funds and cannot choose arbitrary vault actions; the hook remains the final authority over every state change.

---

## 3. Core Concepts

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
| **Reactive Contracts** | `CadraReactive` watches the Uniswap v4 hook for rule breaches and epoch events. `CadraCallback` receives the authenticated request on Unichain and calls the hook to enforce safety or settle the vault. They automate actions; they never hold follower funds. |

---

## 4. Live On-Chain Frontend (No Dummy Data)

The Next.js 16 web application is wired directly to the live Unichain Sepolia smart contracts via **Privy** and **Wagmi**:

- **Real-Time On-Chain State**:
  The application reads `nextVaultId`, `getVault(id)`, `getVaultPositions(id)`, `getVaultValue(id)`, `getPaceValue(id)`, and `vaultFollowerShares(id, userAddress)` directly from `CadraHook` via RPC (`https://sepolia.unichain.org`).
- **Live Contract Execution**:
  Every button triggers real on-chain contract transactions with automated ERC-20 token approvals:
  - **Vault Creation**: `CadraHook.createVault(poolKey, perfFeeBps, mandate)`
  - **Bond Posting**: `USDC.approve(...)` + `CadraHook.postBond(vaultId, amount)`
  - **Follower Deposits**: `USDC.approve(...)` + `CadraHook.deposit(vaultId, amount0, 0)`
  - **Follower Withdrawals**: `CadraHook.requestWithdraw(vaultId, shares)`
  - **Curator Vault Closure**: `CadraHook.closeVault(vaultId)` permanently stops new deposits/rebalances and unwinds active liquidity.
  - **Curator Bond Withdrawal**: `CadraHook.withdrawBond(vaultId, amount)` returns excess bond collateral after cooldown and follower claims.
  - **Rebalance**: `CadraHook.rebalance(vaultId, ranges)`
  - **Mandate Proposals**: `CadraHook.proposeMandate(vaultId, mandate)`
  - **Safety Triggers**: `CadraHook.enforce(vaultId)` and `CadraHook.settle(vaultId)`
- **Landing Page Direct-to-Dashboard Navigation**:
  Connecting any wallet (MetaMask, Coinbase, Rainbow, or Privy embedded wallet) on the landing page immediately routes the user to the active dashboard (`/follower/portfolio` or `/curator/overview`).
- **1-Click Testnet Faucet**:
  A built-in **"Faucet +10k USDC"** button in the header enables connected users to mint 10,000 mock USDC on Unichain Sepolia with 1 click to test vaults, deposits, and bonds without third-party dependencies.
- **Autonomous Event Subscription**:
  `createPublicClient` listens to on-chain `BandLeft`, `VaultCreated`, `BondChanged`, and `Settled` events in real-time, automatically synchronizing UI counters.

---

## 5. Mathematical Specifications

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

## 6. Multi-Chain Autonomous Architecture

```text
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
   - If spot price leaves the mandate corridor, `BandLeft` is emitted.
   - `CadraReactive` on Lasna picks up the event and requests a callback.
   - `CadraCallback` on Unichain executes `enforce()`, freezing the curator and parking funds into full range.
2. **Autonomous Settlement Loop**:
   - When an epoch ends, an alarm triggers `signalEpochReady(vaultId)`.
   - `CadraReactive` receives the `EpochReady` log and dispatches a callback to `CadraCallback.settle(vaultId)`.
   - Pro-rata dual-token withdrawals (`token0` and `token1`) are executed, and fees or bond reimbursements settle.

---

## 7. Repository Structure

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

## 8. Getting Started

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
To deploy across both Unichain Sepolia (1301) and Reactive Lasna (5318007):
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

## 9. License

Distributed under the [MIT License](LICENSE).
