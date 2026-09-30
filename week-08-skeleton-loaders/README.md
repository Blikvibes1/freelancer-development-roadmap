# Pulse — Week 08 Skeleton Loaders

Creative CSS-only pulsing skeleton loaders for cards, text, avatars, and media, with true Theme Mode and a live loading/loaded toggle.

## Purpose

Week 08 of the Freelancer 100-week development program.  
Roadmap requirement: **Skeleton Loading Screens — CSS-only pulsing skeleton loaders for cards, text, and images.**

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Loading / skeleton patterns (shimmer, pulse)
- Card skeletons + media placeholders
- Avatar / profile skeletons
- Text-line skeletons (title, body, short)
- List row skeletons
- Theme-aware surfaces and geometry
- Micro-interaction: toggle between loading ↔ loaded states
- Reduced-motion support (shimmer disabled)

## Features

- Pure CSS shimmer animation (no JS animation loops)
- Card grid, profile block, activity list, and article skeletons
- One-click toggle to reveal real content
- True Theme Mode (Noir / Lumen) changes skeleton contrast, radii, and atmosphere
- Theme preference saved in `localStorage`
- Fully responsive
- Accessible toggle button (`aria-pressed`)
- Zero dependencies

## Design Languages

| Aspect        | Noir                              | Lumen                              |
|---------------|-----------------------------------|------------------------------------|
| Skeleton base | Soft light-on-dark                | Soft dark-on-light                 |
| Geometry      | Tighter radii                     | Softer radii                       |
| Accent        | Teal                              | Terracotta                         |
| Atmosphere   | Cinematic deep                    | Warm editorial                     |

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Controls

| Action                | Result                              |
|-----------------------|-------------------------------------|
| “Show skeletons / content” | Toggle loading ↔ loaded state  |
| Theme switch          | Toggle Noir ↔ Lumen                 |

## Project Structure

```
week-08-skeleton-loaders/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 1 · Week 08**
