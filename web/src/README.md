# Cadra Web Application Source Code (`web/src`)

This directory contains the user interface for Cadra built with Next.js (App Router), TypeScript, and Tailwind CSS. The interface implements a phone-first, high-contrast black-and-white visual identity (`#000000`, `#FFFFFF`, `#171717`) using official Cadra vector assets.

## Directory Structure

```
src/
├── app/
│   ├── globals.css         # Minimalist monochrome design tokens & Tailwind utilities
│   ├── layout.tsx          # Root HTML layout, metadata, favicon, and font definitions
│   └── page.tsx            # Main state controller, tab switcher, wallet management
├── components/
│   ├── LandingPage.tsx     # Clean, friendly overview explaining Follower vs. Curator
│   ├── FollowerDashboard.tsx # Follower Portal: "You vs The Pace", bond coverage, deposits
│   ├── Leaderboard.tsx     # Curators & The Pace benchmark ranking, capacity multipliers
│   ├── CuratorStudio.tsx   # Curator Studio: Rule checker, mandate proposer, vault deployer
│   ├── LiveSimulator.tsx   # Mechanism Demo: Interactive swap, parking & settlement replay
│   ├── Header.tsx          # Top navigation bar, mode switcher, wallet connect/disconnect
│   ├── Navigation.tsx      # Tab bar navigation with active indicators
│   └── Icons.tsx           # Inline SVG icons (no external icon dependencies)
├── lib/
│   └── mockData.ts         # Initial empty state definitions (0 dummy data)
└── types/
    └── cadra.ts            # TypeScript interfaces for Vaults, Mandates, Positions
```

## Zero Dummy Data Policy
All components initialize from an empty state (`INITIAL_VAULTS = []`, `INITIAL_USER_POSITIONS = {}`).
- **Followers**: See an empty state prompting them to discover active curators.
- **Curators**: Can deploy new vaults directly from the Curator Studio with custom mandate parameters and bond commitments.
- **Persistence**: User positions and deployed vaults are saved to the browser's `localStorage` for seamless local testing.
