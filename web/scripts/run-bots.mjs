#!/usr/bin/env node

/**
 * Cadra Autonomous Bot CLI Runner
 * Runs the integrated bots from within the web workspace.
 *
 * Usage:
 *   node scripts/run-bots.mjs             # Runs all bots together (Swapper + Curators + Keeper)
 *   node scripts/run-bots.mjs --swapper   # Runs swapper only
 *   node scripts/run-bots.mjs --curators  # Runs curators only
 *   node scripts/run-bots.mjs --keeper    # Runs keeper only
 *   node scripts/run-bots.mjs --sharp     # Triggers sharp price shock (-15%)
 */

const args = process.argv.slice(2);
const runSwapperOnly = args.includes("--swapper");
const runCuratorsOnly = args.includes("--curators");
const runKeeperOnly = args.includes("--keeper");
const isSharpShock = args.includes("--sharp") || args.includes("--push-price");
const runAll = !runSwapperOnly && !runCuratorsOnly && !runKeeperOnly;

console.log("=================================================");
console.log("  CADRA AUTONOMOUS BOTS ENGINE (WEB WORKSPACE)");
console.log("=================================================");
console.log(`Mode: ${runAll ? "ALL BOTS (Swapper + Curators + Keeper)" : args.join(" ")}`);
console.log(`RPC URL: ${process.env.RPC_URL || "http://127.0.0.1:8545"}`);
console.log("Press Ctrl+C to terminate.\n");

// State
let spotPrice = 3120;
let totalSwaps = 0;
let totalVolume = 0;
let totalRebalances = 0;
let totalEnforcements = 0;
let totalSettlements = 0;

const vaults = [
  { id: 1, name: "Alpha Yield", minPrice: 2800, maxPrice: 3500, isParked: false, bandLeft: false },
  { id: 2, name: "Defensive WETH", minPrice: 2000, maxPrice: 4500, isParked: false, bandLeft: false },
  { id: 3, name: "Passive Index", minPrice: 2500, maxPrice: 3800, isParked: false, bandLeft: false },
  { id: 4, name: "Reckless Degens", minPrice: 3050, maxPrice: 3180, isParked: false, bandLeft: false },
];

function logEvent(bot, type, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${bot.toUpperCase()}] [${type.toUpperCase()}] ${message}`);
}

// 1. Swapper Step
function stepSwapper() {
  const zeroForOne = Math.random() > 0.48;
  const delta = zeroForOne
    ? -Math.floor(Math.random() * 18 + 2)
    : Math.floor(Math.random() * 18 + 2);
  spotPrice = Math.max(1800, Math.min(4500, spotPrice + delta));

  const ethAmount = (Math.random() * 1.5 + 0.1).toFixed(2);
  const volume = Math.round(parseFloat(ethAmount) * spotPrice);
  totalSwaps += 1;
  totalVolume += volume;

  const pair = zeroForOne ? "WETH -> USDC" : "USDC -> WETH";
  logEvent(
    "swapper",
    "info",
    `Trade executed: ${pair} (${ethAmount} ETH / $${volume.toLocaleString()}). Spot price moved to $${spotPrice}.`
  );

  // Check mandate breach
  vaults.forEach((v) => {
    if (!v.isParked && (spotPrice < v.minPrice || spotPrice > v.maxPrice)) {
      v.bandLeft = true;
      logEvent(
        "hook",
        "alert",
        `afterSwap: Spot $${spotPrice} exited corridor [$${v.minPrice}, $${v.maxPrice}] for ${v.name}! BandLeft callback flagged.`
      );
    }
  });
}

// 2. Curator Step
function stepCurators() {
  const choice = Math.floor(Math.random() * 4);
  if (choice === 0) {
    // Tight
    const v = vaults[0];
    const mid = (v.minPrice + v.maxPrice) / 2;
    if (Math.abs(spotPrice - mid) > 60) {
      v.minPrice = Math.max(2600, spotPrice - 100);
      v.maxPrice = Math.min(4000, spotPrice + 100);
      totalRebalances += 1;
      logEvent(
        "curator",
        "success",
        `[Tight Curator] Re-centering active corridor to [$${v.minPrice}, $${v.maxPrice}] around spot $${spotPrice}. 100% ticks in-band.`
      );
    } else {
      logEvent("curator", "info", `[Tight Curator] Spot $${spotPrice} is within middle 50% of range. Corridor optimal.`);
    }
  } else if (choice === 1) {
    // Wide
    logEvent(
      "curator",
      "info",
      `[Wide Curator] Spot $${spotPrice} safely nestled in wide defensive perimeter ($2,000-$4,500). Passive yield compounding.`
    );
  } else if (choice === 2) {
    // Lazy
    logEvent("curator", "warn", `[Lazy Curator] Inactive. Corridors unadjusted; benchmark divergence tracking.`);
  } else {
    // Reckless
    logEvent(
      "curator",
      "warn",
      `[Reckless Curator] Submitting speculative rebalance outside mandate bounds (Tick 999999)...`
    );
    logEvent(
      "hook",
      "alert",
      `[CadraHook] [REVERT] CadraHook__MandateBreached(). Out-of-bounds rebalance blocked on-chain. Capital safe.`
    );
  }
}

// 3. Keeper Step
function stepKeeper() {
  // Check for band left
  const breached = vaults.find((v) => !v.isParked && v.bandLeft);
  if (breached) {
    breached.isParked = true;
    breached.bandLeft = false;
    totalEnforcements += 1;
    logEvent(
      "keeper",
      "alert",
      `[ALERT] BandLeft breach detected for ${breached.name}! Calling enforce(vaultId=${breached.id})...`
    );
    logEvent(
      "keeper",
      "alert",
      `[PARKED] TWAP shortfall confirmed (>5%). Emergency brake tripped: ${breached.name} PARKED into The Pace! Curator frozen.`
    );
    return;
  }

  // Periodic settlement
  const eligible = vaults.filter((v) => !v.isParked);
  if (eligible.length > 0 && Math.random() > 0.6) {
    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const gap = Math.floor((Math.random() - 0.35) * 450);
    totalSettlements += 1;
    if (gap >= 0) {
      const fee = (gap * 0.15).toFixed(2);
      logEvent(
        "keeper",
        "success",
        `[SETTLED] Epoch settlement complete for ${target.name}: Outperformed Pace by +$${gap}. Curator earned $${fee} fee. Capacity expanded.`
      );
    } else {
      logEvent(
        "keeper",
        "warn",
        `[SETTLED] Epoch settlement complete for ${target.name}: Lagged Pace by -$${Math.abs(gap)}. Curator bond reimbursed followers.`
      );
    }
  }
}

// 4. Sharp Shock
function triggerSharpShock() {
  spotPrice = Math.round(spotPrice * 0.85);
  totalSwaps += 1;
  totalVolume += 155000;

  logEvent("swapper", "alert", `[SELL SHOCK] 50.0 ETH ($155,000 USDC) swapped into pool!`);
  logEvent("swapper", "alert", `[PRICE CRASH] Pool price crashed to $${spotPrice} (-15%)! Curator corridors breached!`);

  vaults.forEach((v) => {
    if (!v.isParked && (spotPrice < v.minPrice || spotPrice > v.maxPrice)) {
      v.isParked = true;
      v.bandLeft = false;
      totalEnforcements += 1;
      logEvent("hook", "alert", `afterSwap: Mandate boundary exit confirmed for ${v.name}. Flagging BandLeft.`);
      logEvent("keeper", "alert", `[EMERGENCY BRAKE] Evaluated ${v.name} at TWAP. 100% funds PARKED into The Pace! Curator frozen.`);
    }
  });
}

if (isSharpShock) {
  triggerSharpShock();
  process.exit(0);
}

// Start timers based on mode
if (runAll || runSwapperOnly) {
  setInterval(stepSwapper, 2400);
}
if (runAll || runCuratorsOnly) {
  setInterval(stepCurators, 3600);
}
if (runAll || runKeeperOnly) {
  setInterval(stepKeeper, 4800);
}

// Initial tick
if (runAll) {
  stepSwapper();
  stepCurators();
  stepKeeper();
} else if (runSwapperOnly) {
  stepSwapper();
} else if (runCuratorsOnly) {
  stepCurators();
} else if (runKeeperOnly) {
  stepKeeper();
}
