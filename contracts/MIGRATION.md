# Cadra Protocol Migration & Incident Runbook

This runbook outlines the operational lifecycle, emergency exit procedures, and standard Uniswap v4 pool migration runbook for **Cadra**.

---

## 1. Why Immutability by Design

In Uniswap v4, hooks are architected as immutable singletons:
* **Cryptographic Security**: Hook permissions are encoded in the address prefix flags (`BEFORE_SWAP`, `AFTER_SWAP`).
* **Follower Trust Guarantee**: Depositors have mathematical certainty that an admin key or compromised multi-sig cannot upgrade hook logic to seize idle funds or rewrite fee calculations.
* **Zero Gas Tax**: Eliminates proxy `DELEGATECALL` overhead on every swap.

---

## 2. Risk Mitigation & Emergency Exits

Because the hook is immutable, risks of unintended behavior or market shifts are mitigated through non-upgradeable emergency exits:

### A. Autonomous Circuit Breaker (Parking)
* If a curator's vault underperforms the Pace by more than `maxShortfallBps` (or leaves its price band), the autonomous safety loop invokes `enforce(vaultId)`.
* This freezes the curator and deploys 100% of the vault's assets into the full-range Pace benchmark position ($[-\infty, +\infty]$), neutralizing active directional risk.

### B. Follower Queued Redemptions
* Followers can call `requestWithdraw(vaultId, shares)` at any time.
* At the epoch boundary (or after `SETTLEMENT_GRACE_PERIOD`), `settle(vaultId)` executes and releases pro-rata `token0` and `token1` assets directly to followers.

### C. Curator Bond Cooldown
* Curators can withdraw excess bond via `withdrawBond(vaultId, amount)` after `BOND_WITHDRAW_COOLDOWN` (1 day), provided the vault's active value remains covered by the required multiplier ratio.

---

## 3. Protocol Migration Procedure (v1 $\to$ v2)

If a new feature set or bytecode enhancement is required in a future release:

```
Step 1: Deploy CadraHook v2 (mine address with HookMiner flags)
Step 2: Deploy CadraReactive v2 on Reactive Lasna
Step 3: Update Cadra Frontend to direct new deposits to v2
Step 4: Curators trigger epoch roll & orderly withdrawal on v1
Step 5: Liquidity re-deposited into v2 vaults
```

### Detailed Steps:
1. **Deploy v2 Hook**:
   - Run `Deploy.s.sol` with the new logic, mining a new salt for the required Uniswap v4 hook flags.
2. **Initialize Pools with v2 Hook**:
   - Call `poolManager.initialize(key_v2, sqrtPriceX96)`.
3. **Graceful Liquidity Migration**:
   - Followers and curators submit withdrawals on v1.
   - Upon `settle()`, idle `token0` and `token1` are claimed by followers.
   - The Cadra web application surfaces a one-click **"Migrate to Cadra v2"** workflow that claims from v1 and queues into the corresponding v2 vault.
4. **Reactive Subproject Decommissioning**:
   - Once all vaults on v1 have completed their final epoch, call `clearCallbackRecipient()` on the v1 `CadraReactive` contract to halt further callbacks.
