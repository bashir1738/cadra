# Cadra Official Brand Assets

Official vector SVG brand kit and design resources for **Cadra**.

---

## 1. Brand Concept & Symbology

The Cadra logo mark consists of two interlocking, dynamic arcs:
- **The Lower Arc**: Represents concentrated liquidity within bounded ranges and the active curator's management.
- **The Upper Arc**: Represents **The Pace**—the passive full-range benchmark against which all outperformance is measured.
- Together, they form the letter **C** (Cadra), symbolizing accountability, benchmark-aligned curation, and downside protection.

---

## 2. Directory Structure

```text
web/public/cadra/
├── logo/
│   ├── cadra-logo-horizontal-white.svg    # Primary horizontal logo (white for dark backgrounds)
│   ├── cadra-logo-horizontal-black.svg    # Primary horizontal logo (black for light backgrounds)
│   ├── cadra-logo-stacked-white.svg       # Stacked vertical logo (white)
│   ├── cadra-logo-stacked-black.svg       # Stacked vertical logo (black)
│   ├── cadra-mark-white.svg               # Standalone C mark icon (white)
│   ├── cadra-mark-black.svg               # Standalone C mark icon (black)
│   ├── cadra-wordmark-white.svg           # Standalone CADRA typography (white)
│   └── cadra-wordmark-black.svg           # Standalone CADRA typography (black)
├── icons/
│   ├── cadra-favicon.svg                  # Web favicon
│   ├── cadra-favicon-tile.svg             # Pinned browser tab tile
│   ├── cadra-app-icon.svg                 # Square mobile app icon
│   ├── cadra-app-icon-rounded.svg         # iOS rounded dark app icon
│   └── cadra-app-icon-rounded-light.svg   # iOS rounded light app icon
└── social/
    ├── cadra-og-image.svg                 # OpenGraph social share card (1200x630)
    ├── cadra-avatar.svg                   # Profile avatar (Twitter / GitHub / Discord)
    └── cadra-x-header.svg                 # Twitter / X banner header (1500x500)
```

---

## 3. Brand Colors

| Swatch | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Pure Void Black** | `#000000` | Primary app canvas background, high-contrast dark theme |
| **Pure Stark White** | `#FFFFFF` | Primary brand logos, headers, key metric values |
| **Deep Surface** | `#0A0A0A` / `#171717` | Card backgrounds, elevated components |
| **Subtle Border** | `#262626` / `#333333` | Structural dividers, container borders |
| **Technical Gray** | `#A1A1AA` | Body copy, secondary metadata, monospace labels |
| **Emerald Ahead** | `#34D399` / `#10B981` | Accent indicating vault is ahead of the Pace |
| **Rose Behind** | `#F87171` / `#EF4444` | Accent indicating shortfall or parked safety net |

---

## 4. Usage Guidelines

- Always maintain minimum clear space around the mark equal to the width of the inner arc.
- Do not skew, rotate, or modify the geometry of the interlocking arcs.
- In dark interfaces, use `cadra-logo-horizontal-white.svg` or `cadra-mark-white.svg`.
- In light interfaces, use `cadra-logo-horizontal-black.svg` or `cadra-mark-black.svg`.
