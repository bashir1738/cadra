# Cadra Mathematical & Helper Libraries (`contracts/src/libraries`)

This directory houses the core mathematical models and state-evaluation libraries powering the Cadra Uniswap v4 Hook.

## Libraries Overview

### 1. `PaceLib.sol`
Calculates "The Pace" benchmark:
- At epoch start ($t_0$): Sets benchmark liquidity $L_{pace} = \frac{V_0}{2\sqrt{P_0}}$.
- At time $t$: Values benchmark as $V_{pace}(t) = 2 L_{pace}\sqrt{P_t} + L_{pace}(\Delta f_0 P_t + \Delta f_1)$, factoring in pool fee growth global ($\Delta f_0, \Delta f_1$) division by $2^{128}$.
- Pure passive full-range position invariant against which active curators are judged.

### 2. `SettlementLib.sol`
Calculates epoch settlement math and updates risk parameters:
- **Gap Calculation**: $g = \text{vaultValue} - \text{paceValue}$.
- **Performance Fee**: When $g \ge 0$, fee is $f \cdot \max(0, g - D)$ where $D$ is carried deficit.
- **Shortfall Protection**: When $g < 0$, curator bond covers $\min(-g, B)$; leftover creates new deficit $D$.
- **Dynamic Capacity Multiplier**: Rises by 1 (up to 20×) when outperforming; drops by 2 (down to 2×) when underperforming.

### 3. `MandateLib.sol`
Enforces curator boundaries:
- Validates price corridor bounds: $[\text{minTick}, \text{maxTick}]$.
- Validates maximum concentration threshold (e.g. max 50% in any single tick range).
- Enforces minimum width (e.g. 200 ticks) and verifies parking criteria ($\text{shortfall} \ge \text{maxShortfallBps}$).

### 4. `TwapOracle.sol`
Geometric mean Time-Weighted Average Price (TWAP) observation buffer:
- Records tick accumulators during `beforeSwap` callbacks.
- Resists flash loan manipulations during vault valuation and settlement.

### 5. `LiquidityAmounts.sol`
Calculates token amounts and values from Uniswap v4 liquidity ranges.
