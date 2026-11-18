"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { TrendUpIcon, ShieldIcon, ActivityIcon } from "./Icons";

export type ScenarioId = "ahead" | "behind" | "parked";

interface DataPoint {
  step: number;
  label: string;
  pace: number;
  curator: number;
  youKeep: number;
  parked?: boolean;
}

const TOTAL_POINTS = 60;

function generateSeries(scenario: ScenarioId): DataPoint[] {
  const points: DataPoint[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = i / (TOTAL_POINTS - 1);
    const minute = Math.round(t * 60);
    const waveA = Math.sin(i * 0.28) * 1.9 + Math.cos(i * 0.14) * 1.1;
    const waveB = Math.cos(i * 0.2) * 0.9;

    if (scenario === "ahead") {
      const pace = 1000 + t * 10 + waveB * 0.6;
      const curator = 1000 + t * 30 + waveA * 1.1 + Math.sin(t * Math.PI) * 3.2;
      const surplus = Math.max(0, curator - pace);
      const youKeep = curator - surplus * 0.2;

      points.push({
        step: i,
        label: `${minute}m`,
        pace: Number(pace.toFixed(2)),
        curator: Number(curator.toFixed(2)),
        youKeep: Number(youKeep.toFixed(2)),
      });
    } else if (scenario === "behind") {
      const pace = 1000 + t * 10 + waveB * 0.5;
      const curator = 1000 - t * 5 + waveA * 1.1 - Math.sin(t * Math.PI) * 4.0;
      const youKeep = Math.max(curator, pace);

      points.push({
        step: i,
        label: `${minute}m`,
        pace: Number(pace.toFixed(2)),
        curator: Number(curator.toFixed(2)),
        youKeep: Number(youKeep.toFixed(2)),
      });
    } else {
      const pace = 1000 - t * 50 + waveB * 1.1;
      const parkThreshold = 0.46;
      let curator: number;
      let parked = false;
      if (t < parkThreshold) {
        const localT = t / parkThreshold;
        curator = 1000 - localT * 74 + waveA * 1.2;
      } else {
        parked = true;
        const paceAtPark = 1000 - parkThreshold * 50;
        const dropSincePark = pace - paceAtPark;
        curator = 926 + dropSincePark * 0.55;
      }
      const youKeep = parked ? Math.max(curator, pace) : Math.max(curator, pace - 10);

      points.push({
        step: i,
        label: `${minute}m`,
        pace: Number(pace.toFixed(2)),
        curator: Number(curator.toFixed(2)),
        youKeep: Number(youKeep.toFixed(2)),
        parked,
      });
    }
  }

  return points;
}

export function PaceLiveChart() {
  const [scenario, setScenario] = useState<ScenarioId>("ahead");
  // Normalized progress [0 .. 1] for smooth autonomous glide
  const [autoProgress, setAutoProgress] = useState<number>(0.15);
  // When user hovers/drags, manualProgress overrides autoProgress cleanly
  const [manualProgress, setManualProgress] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const series = useMemo(() => generateSeries(scenario), [scenario]);

  // Autonomous smooth 60fps cursor glide across the epoch chart
  useEffect(() => {
    if (manualProgress !== null) return;
    let rafId: number;
    const cycleMs = 9000; // 9 seconds for a calm, readable full sweep & return

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) % cycleMs;
      const u = elapsed / cycleMs;

      // Smooth forward sweep (0 -> 1 in first 62%), brief hold at settlement (62% -> 78%), gentle return (78% -> 100%)
      let p: number;
      if (u < 0.62) {
        const x = u / 0.62;
        p = 0.5 - 0.5 * Math.cos(Math.PI * x);
      } else if (u < 0.78) {
        p = 1;
      } else {
        const x = (u - 0.78) / 0.22;
        p = 1 - (0.5 - 0.5 * Math.cos(Math.PI * x));
      }

      setAutoProgress(p);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [manualProgress, scenario]);

  // SVG dimensions
  const width = 820;
  const height = 240;
  const padLeft = 50;
  const padRight = 18;
  const padTop = 26;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { minVal, maxVal } = useMemo(() => {
    const vals = series.flatMap((d) => [d.pace, d.curator]);
    const min = Math.floor((Math.min(...vals) - 6) / 10) * 10;
    const max = Math.ceil((Math.max(...vals) + 6) / 10) * 10;
    return { minVal: min, maxVal: max };
  }, [series]);

  const getX = (norm: number) => padLeft + norm * plotW;
  const getY = (val: number) =>
    padTop + ((maxVal - val) / Math.max(1, maxVal - minVal)) * plotH;

  const pacePath = useMemo(
    () =>
      series
        .map(
          (d, i) =>
            `${i === 0 ? "M" : "L"} ${getX(i / (TOTAL_POINTS - 1)).toFixed(1)} ${getY(d.pace).toFixed(1)}`
        )
        .join(" "),
    [series, minVal, maxVal]
  );

  const curatorPath = useMemo(
    () =>
      series
        .map(
          (d, i) =>
            `${i === 0 ? "M" : "L"} ${getX(i / (TOTAL_POINTS - 1)).toFixed(1)} ${getY(d.curator).toFixed(1)}`
        )
        .join(" "),
    [series, minVal, maxVal]
  );

  const curatorArea = useMemo(() => {
    const baseY = padTop + plotH;
    return `${curatorPath} L ${getX(1).toFixed(1)} ${baseY} L ${getX(0).toFixed(1)} ${baseY} Z`;
  }, [curatorPath]);

  // Smoothly interpolated point at current progress
  const activeProgress = manualProgress !== null ? manualProgress : autoProgress;
  const floatIdx = activeProgress * (TOTAL_POINTS - 1);
  const lowIdx = Math.floor(floatIdx);
  const highIdx = Math.min(TOTAL_POINTS - 1, lowIdx + 1);
  const frac = floatIdx - lowIdx;

  const pLow = series[lowIdx];
  const pHigh = series[highIdx];
  const activePace = pLow.pace + (pHigh.pace - pLow.pace) * frac;
  const activeCurator = pLow.curator + (pHigh.curator - pLow.curator) * frac;
  const activeYouKeep = pLow.youKeep + (pHigh.youKeep - pLow.youKeep) * frac;
  const activeParked = Boolean(pLow.parked || pHigh.parked);
  const activeMinute = Math.round(activeProgress * 60);

  const spread = activeCurator - activePace;
  const isAhead = spread >= 0;

  const parkStartIndex = series.findIndex((d) => d.parked);

  const handlePointerMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(padLeft, Math.min(width - padRight, relX));
    setManualProgress((clamped - padLeft) / plotW);
  };

  const strokeColor =
    scenario === "ahead"
      ? "#34d399"
      : scenario === "behind"
      ? "#f59e0b"
      : activeParked
      ? "#38bdf8"
      : "#f87171";

  const yTicks = [maxVal, Math.round((maxVal + minVal) / 2), minVal];
  const cursorX = getX(activeProgress);
  const cursorPaceY = getY(activePace);
  const cursorCuratorY = getY(activeCurator);
  const tooltipOnLeft = activeProgress > 0.65;

  return (
    <div className="bg-[#09090B] text-white rounded-[32px] p-6 sm:p-11 space-y-8 border border-white/[0.06]">
      {/* Header + Scenario Pills */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>The Pace Benchmark</span>
          </div>
          <h2 className="text-2xl sm:text-[34px] font-bold tracking-[-0.03em] leading-tight text-white">
            Pay only when your curator beats the market
          </h2>
          <p className="text-[14px] text-neutral-400 leading-relaxed">
            Watch how Cadra settles performance fees, covers shortfalls from USDC bonds, and parks lagging vaults.
          </p>
        </div>

        <div className="inline-flex items-center bg-white/[0.06] p-1 rounded-full self-start lg:self-auto">
          {[
            { id: "ahead" as const, label: "Curator Wins", icon: <TrendUpIcon className="w-3.5 h-3.5" /> },
            { id: "behind" as const, label: "Bond Protects", icon: <ShieldIcon className="w-3.5 h-3.5" /> },
            { id: "parked" as const, label: "Safety Brake", icon: <ActivityIcon className="w-3.5 h-3.5" /> },
          ].map((item) => {
            const active = scenario === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setScenario(item.id);
                  setManualProgress(null);
                  startTimeRef.current = null;
                }}
                className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  active ? "bg-white text-neutral-950 font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Autonomous + Interactive SVG Chart */}
      <div className="relative rounded-[24px] bg-white/[0.02] border border-white/[0.07] p-4 sm:p-6 select-none">
        {/* Clean Minimal Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 text-[12px]">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2 text-neutral-300 font-medium">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: strokeColor }}
              />
              <span>Curator Vault</span>
            </span>
            <span className="inline-flex items-center gap-2 text-neutral-500">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-neutral-500" />
              <span>The Pace</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`font-semibold ${
                isAhead ? "text-emerald-400" : scenario === "parked" ? "text-sky-400" : "text-amber-400"
              }`}
            >
              {isAhead ? "+" : "-"}${Math.abs(spread).toFixed(2)} vs Pace
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">{activeMinute}m / 60m</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="relative w-full h-56 sm:h-64">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full cursor-crosshair touch-none overflow-visible"
            onMouseMove={(e) => handlePointerMove(e.clientX)}
            onMouseLeave={() => setManualProgress(null)}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
            }}
            onTouchEnd={() => setManualProgress(null)}
          >
            <defs>
              <linearGradient id="liveCuratorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
              <clipPath id="scannedClip">
                <rect x={padLeft} y={0} width={Math.max(0, cursorX - padLeft)} height={height} />
              </clipPath>
            </defs>

            {/* Horizontal Grid Lines + Y-Axis Labels */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#ffffff"
                    strokeOpacity="0.05"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#71717a"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    ${tick}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Time Labels */}
            {[0, 0.33, 0.66, 1].map((norm) => (
              <text
                key={norm}
                x={getX(norm)}
                y={height - 4}
                textAnchor={norm === 0 ? "start" : norm === 1 ? "end" : "middle"}
                fill="#52525b"
                fontSize="11"
                fontFamily="monospace"
              >
                {Math.round(norm * 60)}m
              </text>
            ))}

            {/* TWAP Brake Vertical Marker */}
            {scenario === "parked" && parkStartIndex > 0 && (
              <g>
                <line
                  x1={getX(parkStartIndex / (TOTAL_POINTS - 1))}
                  y1={padTop}
                  x2={getX(parkStartIndex / (TOTAL_POINTS - 1))}
                  y2={padTop + plotH}
                  stroke="#38bdf8"
                  strokeOpacity="0.3"
                  strokeDasharray="3 3"
                />
                <text
                  x={getX(parkStartIndex / (TOTAL_POINTS - 1)) + 8}
                  y={padTop + 11}
                  fill="#38bdf8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  TWAP Parking
                </text>
              </g>
            )}

            {/* Full Faint Background Curve */}
            <path
              d={curatorPath}
              fill="none"
              stroke={strokeColor}
              strokeOpacity="0.22"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Passive Pace Benchmark Curve */}
            <path
              d={pacePath}
              fill="none"
              stroke="#71717a"
              strokeWidth="1.75"
              strokeDasharray="6 4"
            />

            {/* Lit Scanned Area + Bright Leading Curve up to Autonomous Scanner */}
            <g clipPath="url(#scannedClip)">
              <path d={curatorArea} fill="url(#liveCuratorGrad)" />
              <path
                d={curatorPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Bond Cover Vertical Bridge when Behind */}
            {!isAhead && (
              <line
                x1={cursorX}
                y1={cursorPaceY}
                x2={cursorX}
                y2={cursorCuratorY}
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}

            {/* Autonomous Gliding Vertical Crosshair */}
            <line
              x1={cursorX}
              y1={padTop}
              x2={cursorX}
              y2={padTop + plotH}
              stroke="#ffffff"
              strokeOpacity="0.22"
              strokeDasharray="3 3"
            />

            {/* Pace Tracker Dot */}
            <circle
              cx={cursorX}
              cy={cursorPaceY}
              r="4"
              fill="#09090b"
              stroke="#a1a1aa"
              strokeWidth="2"
            />

            {/* Active Curator Glow Beacon */}
            <circle
              cx={cursorX}
              cy={cursorCuratorY}
              r="11"
              fill={strokeColor}
              fillOpacity="0.2"
            />
            <circle
              cx={cursorX}
              cy={cursorCuratorY}
              r="5"
              fill={strokeColor}
              stroke="#09090b"
              strokeWidth="2"
            />
          </svg>

          {/* Compact Gliding Live Value Pill */}
          <div
            className="pointer-events-none absolute top-1 z-20"
            style={{
              left: `${(cursorX / width) * 100}%`,
              transform: tooltipOnLeft ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <div className="rounded-xl bg-[#121215]/95 backdrop-blur-md border border-white/[0.12] px-3 py-2 shadow-xl flex items-center gap-3 text-[11px] font-mono whitespace-nowrap">
              <span className="text-white font-semibold">${activeCurator.toFixed(2)}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-emerald-400 font-medium">
                {activeParked ? "Parked" : isAhead ? `+$${spread.toFixed(2)}` : "Bond Cover"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Live-Updating 4-Column Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
          <span className="text-[12px] text-neutral-400 block">Your Deposit</span>
          <div className="text-xl font-bold font-mono text-white">$1,000.00</div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
          <span className="text-[12px] text-neutral-400 block">The Pace</span>
          <div className="text-xl font-bold font-mono text-neutral-200">
            ${activePace.toFixed(2)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
          <span className="text-[12px] text-neutral-400 block">Curator Result</span>
          <div className="text-xl font-bold font-mono text-white">
            ${activeCurator.toFixed(2)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
          <span className="text-[12px] text-emerald-400 font-medium block">You Keep</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${activeYouKeep.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
