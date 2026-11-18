"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightIcon,
  SparklesIcon,
  ShieldIcon,
  ZapIcon,
  ScaleIcon,
  ActivityIcon,
  LockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./Icons";

export interface CategoryItem {
  id: string;
  name: string;
  count: string;
  tagline: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "all",
    name: "All strategies",
    count: "4 active vaults",
    tagline: "Verified Uniswap v4 curated vaults benchmarked on-chain against The Pace",
  },
  {
    id: "tight",
    name: "Tight-range alpha",
    count: "High fee capture",
    tagline: "Narrow concentrated tick bands actively rebalanced around spot price",
  },
  {
    id: "wide",
    name: "Wide-range steady",
    count: "Lower rebalance drag",
    tagline: "Broad liquidity corridors designed to minimize out-of-range impermanent loss",
  },
  {
    id: "bonded",
    name: "Bond-protected",
    count: "USDC collateralized",
    tagline: "Curators posting deep USDC bonds to reimburse follower shortfalls automatically",
  },
  {
    id: "capacity",
    name: "High-capacity",
    count: "Up to 20x multiplier",
    tagline: "Top curators whose capacity scales automatically as they beat The Pace",
  },
  {
    id: "parking",
    name: "TWAP-guarded",
    count: "Automated parking",
    tagline: "Vaults guarded by O(1) swap checks and automated full-range Pace parking",
  },
];

function renderCategoryIcon(id: string, className = "w-4 h-4") {
  switch (id) {
    case "all":
      return <SparklesIcon className={className} />;
    case "tight":
      return <ZapIcon className={className} />;
    case "wide":
      return <ScaleIcon className={className} />;
    case "bonded":
      return <ShieldIcon className={className} />;
    case "capacity":
      return <ActivityIcon className={className} />;
    case "parking":
      return <LockIcon className={className} />;
    default:
      return <SparklesIcon className={className} />;
  }
}

export interface SlideItem {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  surface: string;
  glow: string;
  ctaText: string;
  categoryLink: string;
}

export const AD_SLIDES: SlideItem[] = [
  {
    id: 1,
    eyebrow: "The Pace Benchmark",
    title: "Pay performance fees only on true outperformance",
    subtitle:
      "The Pace measures what your capital would have earned in a passive full-range position, fees included. Curators earn $0 unless they beat it.",
    surface: "from-[#0A1F18] via-[#0B0F0E] to-[#09090B]",
    glow: "bg-emerald-500/15",
    ctaText: "Discover Curators",
    categoryLink: "tight",
  },
  {
    id: 2,
    eyebrow: "Curator USDC Bonds",
    title: "Real skin in the game covering follower shortfalls",
    subtitle:
      "Every curator posts a USDC bond before managing funds. If an epoch finishes behind The Pace, the hook pays followers directly from the bond.",
    surface: "from-[#0C1829] via-[#0B0E14] to-[#09090B]",
    glow: "bg-blue-500/15",
    ctaText: "Inspect Vault Bonds",
    categoryLink: "bonded",
  },
  {
    id: 3,
    eyebrow: "Automated Parking",
    title: "On-chain mandates and TWAP parking cap relative loss",
    subtitle:
      "CadraHook reverts invalid rebalances inline and freezes lagging curators—redeploying 100% of vault capital safely into The Pace.",
    surface: "from-[#1A1424] via-[#100D16] to-[#09090B]",
    glow: "bg-indigo-500/15",
    ctaText: "Launch Live Simulator",
    categoryLink: "parking",
  },
];

interface CategoriesAndAdSliderProps {
  onSelectCategory?: (categoryId: string) => void;
  onExploreProducts?: (categoryId: string) => void;
}

export function CategoriesAndAdSlider({
  onSelectCategory,
  onExploreProducts,
}: CategoriesAndAdSliderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % AD_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (onSelectCategory) onSelectCategory(catId);
    const slideIdx = AD_SLIDES.findIndex((s) => s.categoryLink === catId);
    if (slideIdx !== -1) {
      setCurrentSlide(slideIdx);
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + AD_SLIDES.length) % AD_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % AD_SLIDES.length);
  };

  const activeSlide = AD_SLIDES[currentSlide];
  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <div className="w-full space-y-6">
      {/* Top Horizontal Strategy Pill Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950"
              }`}
            >
              <span className={isActive ? "text-white" : "text-neutral-400"}>
                {renderCategoryIcon(cat.id, "w-3.5 h-3.5")}
              </span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Side-by-Side: Strategy Panel (Left) + 3-Slide Cadra Showcase (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Clean Strategy List (4 cols) */}
        <div className="lg:col-span-4 bg-[#FAFAFA] border border-neutral-200/70 rounded-[28px] p-5 flex flex-col justify-between">
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-150 cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? "bg-white text-neutral-950 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-neutral-200/70"
                      : "text-neutral-600 hover:bg-white/60 hover:text-neutral-950 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-200/60 text-neutral-600 group-hover:bg-neutral-200"
                      }`}
                    >
                      {renderCategoryIcon(cat.id, "w-4 h-4")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{cat.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{cat.count}</p>
                    </div>
                  </div>
                  <ChevronRightIcon
                    className={`w-4 h-4 shrink-0 transition-all ${
                      isActive
                        ? "text-neutral-950 translate-x-0.5"
                        : "text-neutral-300 group-hover:text-neutral-500"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200/60 px-2">
            <p className="text-[12px] text-neutral-500 leading-relaxed">
              {activeCategoryObj.tagline}
            </p>
          </div>
        </div>

        {/* Right: Editorial 3-Slide Cadra Showcase (8 cols) */}
        <div
          className="lg:col-span-8 relative rounded-[28px] overflow-hidden bg-[#09090B] text-white flex flex-col justify-between p-8 sm:p-12 min-h-[380px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${activeSlide.surface} transition-all duration-700`}
          />
          <div
            className={`absolute -top-24 -right-24 w-96 h-96 rounded-full ${activeSlide.glow} blur-3xl pointer-events-none transition-colors duration-700`}
          />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-neutral-300 bg-white/[0.06] border border-white/[0.08] px-3.5 py-1.5 rounded-full">
              {renderCategoryIcon(activeSlide.categoryLink, "w-3.5 h-3.5 text-white")}
              <span>{activeSlide.eyebrow}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Editorial Copy */}
          <div className="relative z-10 space-y-5 my-auto py-8 max-w-xl">
            <h3 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em] leading-[1.12] text-white">
              {activeSlide.title}
            </h3>
            <p className="text-[15px] text-neutral-400 leading-relaxed">
              {activeSlide.subtitle}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onExploreProducts && onExploreProducts(activeSlide.categoryLink)}
                className="px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-[13px] hover:bg-neutral-100 transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Clean Progress Indicators */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              {AD_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? "w-8 bg-white" : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] text-neutral-500 font-medium">
              0{currentSlide + 1} / 0{AD_SLIDES.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
