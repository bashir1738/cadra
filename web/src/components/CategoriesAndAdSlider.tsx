"use client";

import React from "react";
import {
  ArrowRightIcon,
  ShieldIcon,
  ZapIcon,
  LockIcon,
} from "./Icons";

export interface StrategyStackCard {
  id: number;
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  categoryLink: string;
  surface: string;
  stickyTop: string;
  zIndex: string;
}

export const AD_SLIDES: StrategyStackCard[] = [
  {
    id: 1,
    num: "01",
    tag: "The Pace Benchmark",
    title: "Pay fees only on true outperformance",
    subtitle:
      "The Pace tracks passive full-range returns, fees included. Curators earn $0 unless they beat it.",
    ctaText: "Discover Curators",
    categoryLink: "tight",
    surface: "bg-[#F5F5F7]",
    stickyTop: "top-[96px]",
    zIndex: "z-10",
  },
  {
    id: 2,
    num: "02",
    tag: "Curator USDC Bonds",
    title: "Real collateral covering follower shortfalls",
    subtitle:
      "Every curator posts a USDC bond up front. Finish behind The Pace and followers are reimbursed automatically.",
    ctaText: "Inspect Vault Bonds",
    categoryLink: "bonded",
    surface: "bg-[#EFEFF2]",
    stickyTop: "top-[132px]",
    zIndex: "z-20",
  },
  {
    id: 3,
    num: "03",
    tag: "Automated Parking",
    title: "On-chain mandates that cap relative downside",
    subtitle:
      "CadraHook reverts invalid ticks inline and parks lagging vaults into the passive Pace automatically.",
    ctaText: "Launch Simulator",
    categoryLink: "parking",
    surface: "bg-[#EAEAEF]",
    stickyTop: "top-[168px]",
    zIndex: "z-30",
  },
];

function renderCardIcon(categoryLink: string) {
  switch (categoryLink) {
    case "tight":
      return <ZapIcon className="w-4 h-4 text-neutral-900" />;
    case "bonded":
      return <ShieldIcon className="w-4 h-4 text-neutral-900" />;
    case "parking":
      return <LockIcon className="w-4 h-4 text-neutral-900" />;
    default:
      return <ZapIcon className="w-4 h-4 text-neutral-900" />;
  }
}

interface CategoriesAndAdSliderProps {
  onSelectCategory?: (categoryId: string) => void;
  onExploreProducts?: (categoryId: string) => void;
}

export function CategoriesAndAdSlider({
  onExploreProducts,
}: CategoriesAndAdSliderProps) {
  return (
    <div className="relative w-full space-y-8 sm:space-y-10 pb-6">
      {AD_SLIDES.map((card) => (
        <div
          key={card.id}
          className={`sticky ${card.stickyTop} ${card.zIndex} ${card.surface} border border-neutral-200/90 rounded-[32px] p-8 sm:p-12 shadow-[0_-12px_36px_-14px_rgba(0,0,0,0.08),0_20px_50px_-28px_rgba(0,0,0,0.08)] min-h-[290px] sm:min-h-[320px] flex flex-col justify-between transition-transform duration-300`}
        >
          {/* Top Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[12px] font-medium text-neutral-800">
              {renderCardIcon(card.categoryLink)}
              <span>{card.tag}</span>
            </div>

            <span className="text-[12px] font-mono font-medium text-neutral-400">
              {card.num} / 0{AD_SLIDES.length}
            </span>
          </div>

          {/* Bottom Content & CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pt-10">
            <div className="lg:col-span-8 space-y-3">
              <h3 className="text-2xl sm:text-[36px] font-bold tracking-[-0.035em] leading-[1.1] text-neutral-950">
                {card.title}
              </h3>
              <p className="text-[15px] text-neutral-600 leading-relaxed max-w-xl">
                {card.subtitle}
              </p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                type="button"
                onClick={() => onExploreProducts && onExploreProducts(card.categoryLink)}
                className="px-6 py-3 rounded-full bg-neutral-950 text-white font-semibold text-[13px] hover:bg-neutral-800 transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{card.ctaText}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
