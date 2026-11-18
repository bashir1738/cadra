"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrendUpIcon, ShieldIcon, LockIcon } from "./Icons";

export function InteractiveCadraCube() {
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: -22, y: 35 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0.28 });
  const rotRef = useRef<{ x: number; y: number }>({ x: -22, y: 35 });

  // Smooth 60fps autonomous spin + post-drag inertia
  useEffect(() => {
    let rafId: number;

    const loop = () => {
      if (!draggingRef.current) {
        // Apply gentle decay to drag velocity back toward calm idle spin
        velocityRef.current.x *= 0.94;
        velocityRef.current.y = velocityRef.current.y * 0.96 + 0.24 * 0.04;

        rotRef.current.y += velocityRef.current.y;
        // Gently ease X pitch back near a clean isometric angle (-22deg)
        rotRef.current.x += velocityRef.current.x + (-22 - rotRef.current.x) * 0.012;

        setRotation({ x: rotRef.current.x, y: rotRef.current.y });
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setIsDragging(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const nextY = rotRef.current.y + dx * 0.55;
    const nextX = Math.max(-75, Math.min(75, rotRef.current.x - dy * 0.55));
    velocityRef.current = { x: -dy * 0.25, y: dx * 0.35 };
    rotRef.current = { x: nextX, y: nextY };
    setRotation({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingRef.current = false;
      setIsDragging(false);
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className={`cadra-cube-scene touch-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${isHovered || isDragging ? "is-active" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Interactive 3D Cadra cube — drag to rotate"
      >
        <div
          className="cadra-cube-interactive"
          style={{
            transform: `rotateX(${rotation.x.toFixed(2)}deg) rotateY(${rotation.y.toFixed(2)}deg)`,
          }}
        >
          {/* Solid Dark Interior Core Planes + Bevel Shells (Eliminates all white corner gaps) */}
          <div className="cadra-cube-core-plane" style={{ transform: "rotateY(0deg)" }} />
          <div className="cadra-cube-core-plane" style={{ transform: "rotateY(90deg)" }} />
          <div className="cadra-cube-core-plane" style={{ transform: "rotateX(90deg)" }} />

          <div className="cadra-cube-inner cadra-cube-inner-front" />
          <div className="cadra-cube-inner cadra-cube-inner-back" />
          <div className="cadra-cube-inner cadra-cube-inner-right" />
          <div className="cadra-cube-inner cadra-cube-inner-left" />
          <div className="cadra-cube-inner cadra-cube-inner-top" />
          <div className="cadra-cube-inner cadra-cube-inner-bottom" />

          <div className="cadra-cube-bevel cadra-cube-bevel-front" />
          <div className="cadra-cube-bevel cadra-cube-bevel-back" />
          <div className="cadra-cube-bevel cadra-cube-bevel-right" />
          <div className="cadra-cube-bevel cadra-cube-bevel-left" />
          <div className="cadra-cube-bevel cadra-cube-bevel-top" />
          <div className="cadra-cube-bevel cadra-cube-bevel-bottom" />

          {/* Face 1: Front — Cadra Emblem */}
          <div className="cadra-cube-face cadra-cube-front gap-3">
            <img
              src="/cadra/logo/cadra-mark-white.svg"
              alt="Cadra"
              draggable={false}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain pointer-events-none"
            />
            <span className="text-[12px] font-medium tracking-[0.16em] uppercase text-neutral-400">
              cadra
            </span>
          </div>

          {/* Face 2: Right — The Pace */}
          <div className="cadra-cube-face cadra-cube-right gap-3">
            <TrendUpIcon className="w-7 h-7 text-white/90" />
            <span className="text-[12px] font-medium tracking-[0.14em] uppercase text-neutral-400">
              The Pace
            </span>
          </div>

          {/* Face 3: Back — USDC Bond */}
          <div className="cadra-cube-face cadra-cube-back gap-3">
            <ShieldIcon className="w-7 h-7 text-white/90" />
            <span className="text-[12px] font-medium tracking-[0.14em] uppercase text-neutral-400">
              USDC Bond
            </span>
          </div>

          {/* Face 4: Left — Mandates */}
          <div className="cadra-cube-face cadra-cube-left gap-3">
            <LockIcon className="w-7 h-7 text-white/90" />
            <span className="text-[12px] font-medium tracking-[0.14em] uppercase text-neutral-400">
              Mandates
            </span>
          </div>

          {/* Face 5: Top — Precision Emblem */}
          <div className="cadra-cube-face cadra-cube-top">
            <div className="w-16 h-16 rounded-2xl border border-white/[0.12] flex items-center justify-center">
              <img
                src="/cadra/logo/cadra-mark-white.svg"
                alt=""
                draggable={false}
                className="w-8 h-8 object-contain opacity-80 pointer-events-none"
              />
            </div>
          </div>

          {/* Face 6: Bottom */}
          <div className="cadra-cube-face cadra-cube-bottom">
            <span className="text-[11px] font-mono tracking-[0.16em] uppercase text-neutral-600">
              v4 Hook
            </span>
          </div>
        </div>
      </div>

      {/* Soft Studio Ground Shadow */}
      <div
        className={`w-36 sm:w-44 h-5 rounded-full bg-neutral-950/15 blur-xl mt-12 transition-transform duration-300 pointer-events-none ${
          isDragging ? "scale-110 opacity-80" : "scale-100"
        }`}
      />
    </div>
  );
}
