"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightIcon } from "./Icons";

export interface CategoryItem {
  id: string;
  name: string;
  count: string;
  icon: string;
  tagline: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", name: "All categories", count: "1,420+ Items", icon: "✨", tagline: "Curated Web3 Commerce & Yields" },
  { id: "food", name: "Food & groceries", count: "480+ Stores", icon: "🥑", tagline: "Fresh groceries & daily essentials with 0% swap fees" },
  { id: "fashion", name: "Fashion", count: "320+ Brands", icon: "👕", tagline: "Luxury & street style settled with crypto virtual card" },
  { id: "beauty", name: "Beauty", count: "190+ Outlets", icon: "💄", tagline: "Skincare, cosmetics & wellness checkout in seconds" },
  { id: "electronics", name: "Electronics", count: "260+ Gadgets", icon: "⚡", tagline: "Smartphones, laptops & hardware with instant escrow" },
  { id: "office", name: "Home & office", count: "170+ Spaces", icon: "🛋️", tagline: "Workstations, decor & home essentials paid via crypto" },
];

export interface SlideItem {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  accentBg: string;
  accentBorder: string;
  badgeColor: string;
  ctaText: string;
  categoryLink: string;
  visualIcon: string;
}

export const AD_SLIDES: SlideItem[] = [
  {
    id: 1,
    tag: "FEATURED CAMPAIGN",
    title: "Spend Crypto on Food & Daily Groceries",
    subtitle: "Use your Cadra Uniswap v4 earnings for fresh meals and supermarket orders. Zero P2P delays, instant checkout.",
    accentBg: "from-emerald-950 via-neutral-900 to-black",
    accentBorder: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    ctaText: "Shop Groceries Now",
    categoryLink: "food",
    visualIcon: "🥑",
  },
  {
    id: 2,
    tag: "VIRTUAL CARD POWER",
    title: "Global Fashion & Luxury Brands",
    subtitle: "Fund your digital Visa card directly from your curator vault. Spend at Zara, ASOS, Nike, and 40M+ merchants.",
    accentBg: "from-sky-950 via-neutral-900 to-black",
    accentBorder: "border-sky-500/30",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    ctaText: "Explore Fashion Perks",
    categoryLink: "fashion",
    visualIcon: "💎",
  },
  {
    id: 3,
    tag: "HARDWARE & TECH",
    title: "Electronics & Smart Home Essentials",
    subtitle: "Upgrade your workstation with crypto yields. Laptops, monitors, and audio gear with buyer-protection escrow.",
    accentBg: "from-amber-950 via-neutral-900 to-black",
    accentBorder: "border-amber-500/30",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    ctaText: "Discover Tech Gear",
    categoryLink: "electronics",
    visualIcon: "⚡",
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

  // Auto-slide every 5 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % AD_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    // Also jump to matching slide if applicable
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

  return (
    <div className="w-full space-y-6">
      {/* 1. Top Working Categories Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-sm font-semibold"
                    : "bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/70"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 shrink-0 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time Off-Ramp</span>
        </div>
      </div>

      {/* 2. Side-by-Side: Categories Panel on Left + 3-Slide Ad Carousel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Side Category Quick-Navigation Menu (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-neutral-400 tracking-wider">
                  BROWSE BY
                </span>
                <h3 className="text-lg font-bold text-neutral-950 tracking-tight">
                  Everyday Spending
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                6 Sectors
              </span>
            </div>

            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "hover:bg-neutral-100/80 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-neutral-900"}`}>
                          {cat.name}
                        </p>
                        <p className={`text-xs truncate ${isActive ? "text-neutral-300" : "text-neutral-500"}`}>
                          {cat.count}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? "text-emerald-400 translate-x-0.5" : "text-neutral-400"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Instant Crypto Settlement</span>
            <span className="font-mono text-emerald-600 font-semibold">0% P2P Fee</span>
          </div>
        </div>

        {/* Right Side 3-Slide Ad Carousel (8 cols) */}
        <div
          className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-neutral-950 text-white border border-neutral-800 shadow-xl flex flex-col justify-between p-6 sm:p-10 min-h-[340px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Background Gradient Mesh */}
          <div className={`absolute inset-0 bg-gradient-to-br ${activeSlide.accentBg} opacity-90 transition-all duration-700`} />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Slide Top HUD */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium backdrop-blur-md">
              <span className={`px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider ${activeSlide.badgeColor}`}>
                {activeSlide.tag}
              </span>
              <span className="text-neutral-400 text-xs">Slide {currentSlide + 1} of 3</span>
            </div>

            {/* Slide Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-700/80 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ←
              </button>
              <button
                onClick={handleNextSlide}
                aria-label="Next slide"
                className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-700/80 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                →
              </button>
            </div>
          </div>

          {/* Slide Content Body */}
          <div className="relative z-10 space-y-4 my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-700 flex items-center justify-center text-3xl shadow-lg">
              {activeSlide.visualIcon}
            </div>

            <div className="space-y-2 max-w-xl">
              <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {activeSlide.title}
              </h4>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
                {activeSlide.subtitle}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onExploreProducts && onExploreProducts(activeSlide.categoryLink)}
                className="px-6 py-3 rounded-full bg-white text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>

              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Instant settlement via Cadra Hook</span>
              </div>
            </div>
          </div>

          {/* Bottom Indicators */}
          <div className="relative z-10 flex items-center justify-between border-t border-neutral-800/80 pt-4 text-xs">
            <div className="flex items-center gap-2">
              {AD_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Jump to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? "w-8 bg-emerald-400" : "w-2 bg-neutral-700 hover:bg-neutral-500"
                  }`}
                />
              ))}
            </div>

            <span className="text-neutral-400 font-mono text-xs">
              Powered by Uniswap v4 Liquidity Rails
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
