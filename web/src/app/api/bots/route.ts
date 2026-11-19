import { NextResponse } from "next/server";
import { getConfig } from "@/bots/config";

// In-memory state for API endpoint queries
let isRunning = false;
let spotPrice = 3120;
let totalSwaps = 0;
let totalVolumeUsdc = 0;
let totalRebalances = 0;
let totalEnforcements = 0;
let totalSettlements = 0;

export async function GET() {
  const config = getConfig();

  return NextResponse.json({
    status: "ok",
    isRunning,
    spotPrice,
    metrics: {
      totalSwaps,
      totalVolumeUsdc,
      totalRebalances,
      totalEnforcements,
      totalSettlements,
    },
    network: {
      rpcUrl: config.rpcUrl,
      hookAddress: config.hookAddress,
      poolManagerAddress: config.poolManagerAddress,
    },
    bots: [
      { id: "swapper", name: "Uniswap v4 Swapper", frequencyMs: 2400, active: isRunning },
      { id: "curators", name: "Curator Swarm (4 Archetypes)", frequencyMs: 3600, active: isRunning },
      { id: "keeper", name: "Cadra Keeper Daemon", frequencyMs: 4800, active: isRunning },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "start") {
      isRunning = true;
      return NextResponse.json({ success: true, message: "Autonomous bots started", isRunning: true });
    }

    if (action === "stop") {
      isRunning = false;
      return NextResponse.json({ success: true, message: "Autonomous bots paused", isRunning: false });
    }

    if (action === "shock") {
      spotPrice = Math.round(spotPrice * 0.85);
      totalSwaps += 1;
      totalVolumeUsdc += 155000;
      totalEnforcements += 2;
      return NextResponse.json({
        success: true,
        action: "shock",
        droppedPrice: spotPrice,
        enforcementsTriggered: 2,
        message: "Mandate breach simulated. TWAP shortfall parking triggered.",
      });
    }

    if (action === "rebalance") {
      totalRebalances += 1;
      return NextResponse.json({ success: true, action: "rebalance", totalRebalances });
    }

    if (action === "settle") {
      totalSettlements += 1;
      return NextResponse.json({ success: true, action: "settle", totalSettlements });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
