# Nimbus — Week 05 Pricing Table

A polished 3-tier pricing table with monthly/yearly billing toggle and true Theme Mode.

## Purpose

Week 05 of the Freelancer 100-week development program.  
Roadmap requirement: **Pricing Table Component — 3-tier pricing table with a toggle to switch between Monthly and Yearly billing.**

Elevated into a production-minded SaaS pricing section.

## Features

- Three clear tiers: Starter, Pro (featured), Enterprise
- Monthly / Yearly billing toggle with 20% savings badge
- Prices update smoothly when toggling
- Featured plan visually elevated
- True Theme Mode (Noir / Lumen) — geometry, surfaces, accent all change
- Preferences persisted in `localStorage`
- Fully responsive (stacks on mobile, 3-column on desktop)
- Accessible switches and structure
- `prefers-reduced-motion` supported
- Zero dependencies

## Design Languages

| Aspect     | Noir                          | Lumen                          |
|------------|-------------------------------|--------------------------------|
| Mood       | Cinematic, focused            | Editorial, warm                |
| Surfaces   | Deep solid + subtle border    | Clean paper-like               |
| Geometry   | Tighter radii                 | Soft / pill buttons            |
| Accent     | Teal                          | Terracotta                     |
| Featured   | Accent border + soft glow     | Accent border + warm shadow    |

## Technologies

- Semantic HTML
- CSS custom properties
- Vanilla JavaScript (IIFE)
- Google Fonts: DM Sans + Syne

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Controls

| Action                    | Result                          |
|---------------------------|---------------------------------|
| Billing switch            | Toggle Monthly ↔ Yearly prices  |
| Theme switch              | Toggle Noir ↔ Lumen             |
| Arrow keys on switches    | Also toggle                     |

## Accessibility

- `role="switch"` + `aria-checked` on both toggles
- Clear labels and grouping
- Visible focus styles
- Semantic headings and lists
- Reduced motion support

## Project Structure

```
week-05-pricing-table/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

## Known Limitations

- Static demo (no real checkout)
- Prices are illustrative

---

**Freelancer Development Program · Phase 1 · Week 05**
