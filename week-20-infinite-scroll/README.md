# Feed — Week 20 Infinite Scroll

Instagram-style feed that loads more mock posts as you scroll. Built with the Intersection Observer API — no libraries.

## Purpose

Week 20 of the Freelancer 100-week development program.  
Roadmap requirement: **Infinite Scroll Feed — load more mock data as the user scrolls down.**

This completes **Phase 2: Interactive JavaScript & APIs**.

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Social feed / post cards
- Avatar + meta header
- Skeleton loaders with shimmer
- Loading spinner + end-of-feed message
- Intersection Observer sentinel
- Theme-aware surfaces and geometry

## Features

- Infinite scroll via Intersection Observer
- Mock posts (name, caption, likes, colored media)
- Skeleton placeholders on first load
- Loading indicator while fetching
- “You’re all caught up” end state
- True Theme Mode (Noir / Lumen)
- Zero dependencies

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Project Structure

```
week-20-infinite-scroll/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 2 · Week 20**  
Phase 2 complete.
