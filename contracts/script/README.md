# Cadra Deployment & Demo Scripts

This directory contains Foundry scripts for deploying the Cadra protocol on local nodes (Anvil), Sepolia/Unichain testnets, or live environments, and seeding initial mock vaults for demonstration purposes.

## Scripts Overview

### 1. `Deploy.s.sol` (`DeployScript`)
Deploys core infrastructure:
- **Mock Tokens**: Deploys `MockERC20` instances for WETH and USDC (sorted canonically as `Currency0` and `Currency1`).
- **Uniswap v4 PoolManager**: Deploys a new `PoolManager` instance.
- **CadraHook with Mined Salt**: Uses `HookMiner` to find an address with the required flag bits (`AFTER_INITIALIZE_FLAG`, `BEFORE_SWAP_FLAG`, `AFTER_SWAP_FLAG`).
- **Initializes Pool**: Initializes the primary WETH/USDC pool with tick spacing 60 and starting price of $2,500.

**Execution:**
```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

### 2. `SeedDemo.s.sol` (`SeedDemoScript`)
Seeds the test environment with four distinct curator personas:
1. **Alpha Curator (Tight Range)**: Narrow tick range ($2,400 to $2,600), $20k bond, max concentration 50%.
2. **Defensive Curator (Wide Range)**: Wide tick range ($2,000 to $3,200), $15k bond, max concentration 35%.
3. **Lazy Curator (Outdated Range)**: Static range that does not rebalance as price moves.
4. **Reckless Curator (Over-concentrated)**: Narrow range with high concentration threshold, testing breach/parking mechanics.

**Execution:**
```bash
forge script script/SeedDemo.s.sol --rpc-url <RPC_URL> --broadcast
```
