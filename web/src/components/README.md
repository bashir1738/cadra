# Cadra Web UI Components (`web/src/components`)

This directory contains reusable React components for the Cadra web application. Built for Next.js App Router with TypeScript and Tailwind CSS.

## Components List

## Design System (Modern Glassmorphic Monochrome)

The UI has been redesigned around an ultra-modern, frosted-glass minimalist aesthetic:
- **Atmospheric Glow & Obsidian Canvas**: Deep obsidian space (`#08080a`) with subtle white radial ambient light and frosted glass panels (`backdrop-blur-xl bg-neutral-950/70 border border-white/10`).
- **Floating Island Dock Navigation**: Pinned floating pill navbar with rounded tabs, segmented role switcher, and live testnet status.
- **Organic Geometry**: Soft radiuses (`rounded-3xl`, `rounded-2xl`, `rounded-full`) contrasting with crisp micro-hairline borders.
- **Interactive Visualizers**: SVG Pace vs. Curator dynamic curves, real-time rebalancing rule validators, and interactive mechanism simulation sandboxes.

## Components List

- `LandingPage.tsx`: Luxury minimalist landing page featuring the interactive SVG Pace vs. Curator benchmark curve visualizer, high-contrast role portals, and the 3 architectural invariants.
- `FollowerDashboard.tsx`: Follower Portal featuring the primary "You vs The Pace" benchmark hero card, dynamic portfolio totals, bond safety coverage, available testnet curator discovery, and deposit/withdrawal queue modals.
- `Leaderboard.tsx`: Curator directory ranking strategists by verifiable on-chain outperformance against The Pace, capacity multipliers ($m \in [2, 20]$), and posted bond collateral.
- `CuratorStudio.tsx`: Strategist workstation featuring 1-click strategy presets (Tight Alpha, Defensive Wide, Reckless Test), visual rebalancing range builder, and real-time on-chain mandate compliance validation.
- `LiveSimulator.tsx`: Interactive test harness enabling users to simulate swaps, trigger out-of-band detection, trigger keeper parking (`enforce()`), and simulate epoch settlement (`settle()`).
- `CuratorProfile.tsx`: Deep-dive curator profile showing mandate corridor boundaries, visual price band progress bars, and historical epoch settlements.
- `Header.tsx`: Floating island frosted-glass dock navigation bar combining official Cadra vector marks, desktop & mobile pill navigation, quick Follow/Curate mode toggle, testnet badge, and wallet connectivity.
- `Navigation.tsx`: Tab-based section switcher with indicators and role badges.
- `Icons.tsx`: Standalone SVG icons designed for the monochrome visual aesthetic.
