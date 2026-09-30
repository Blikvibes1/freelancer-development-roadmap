# Vespera Nav — Week 02 Responsive Navigation System

Portfolio-quality sticky navigation with a working mobile hamburger menu, dual design languages, and full accessibility.

## Purpose

Week 02 of the Freelancer 100-week development program.  
Roadmap requirement: **Responsive Navbar — sticky navigation bar with working mobile hamburger menu**.

This is not a minimal demo. The navigation *is* the product. Demo page sections exist only so you can experience real sticky behavior, scroll compaction, and theme switching.

## Features

- Sticky header that compacts and gains a blurred surface on scroll
- Animated hamburger that morphs into an X
- Slide-in mobile menu with staggered link reveal and backdrop
- Focus trap + Escape to close + focus restoration
- Two fully distinct **Theme Modes** (not just color swaps):
  - **Noir** — dark, glass surfaces, sharp geometry, teal accent, precise tracking
  - **Lumen** — light, soft editorial feel, warm terracotta accent, rounded shapes
- Theme preference saved in `localStorage` and respects `prefers-color-scheme` on first visit
- Active link indicator with animated underline
- Keyboard accessible throughout
- `prefers-reduced-motion` respected
- Skip-to-content link
- Clean, modular vanilla JS (no frameworks, no spaghetti)

## Design Concept

**Vespera** is a fictional creative studio. The navigation system demonstrates how the same information architecture can live in two different visual universes.

| Aspect          | Noir                          | Lumen                          |
|-----------------|-------------------------------|--------------------------------|
| Surface         | Glass + blur                  | Solid soft white               |
| Geometry        | Tighter radii                 | Soft, pill-like buttons        |
| Typography      | Tight tracking, heavy display | Slightly open, medium weight   |
| Accent          | Teal (`#5eead4`)              | Terracotta (`#c45c26`)         |
| Atmosphere      | Cinematic dark                | Editorial warm paper           |

## Technologies

- HTML5 (semantic)
- CSS3 (custom properties, container-free responsive, backdrop-filter)
- Vanilla JavaScript (IIFE module pattern)
- Google Fonts: Instrument Sans + Syne

## How to Run

1. Open `index.html` in a modern browser, **or**
2. Serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

No build step. No dependencies.

## Controls & Interactions

| Action                    | Result                                      |
|---------------------------|---------------------------------------------|
| Scroll down               | Header compacts + gains surface             |
| Click theme toggle        | Switches Noir ↔ Lumen                       |
| Click hamburger (mobile)  | Opens slide-in menu                         |
| Click backdrop / close / Esc | Closes menu                              |
| Tab while menu open       | Focus stays trapped inside menu             |
| Click any nav link        | Sets active state + closes mobile menu      |

## Responsive Behavior

- **≥ 900px**: Full horizontal nav + CTA button visible, hamburger hidden
- **< 900px**: Hamburger appears, CTA moves into mobile menu, desktop links hidden
- Header height reduces on scroll at every breakpoint
- Touch-friendly targets (≥ 44px)

## Accessibility Notes

- Semantic `<header>`, `<nav>`, `role="dialog"` + `aria-modal` on mobile menu
- `aria-expanded` / `aria-controls` / `aria-label` on controls
- Visible focus rings via `:focus-visible`
- Skip link
- Focus trap when mobile menu is open
- Focus returned to the hamburger button on close
- `prefers-reduced-motion` disables transitions/animations

## Theme System

Themes are driven entirely by CSS custom properties on `[data-theme]`.  
JavaScript only toggles the attribute and persists the choice.  
This is the required “Theme Mode changes design language” pattern from the master instructions.

## Interesting Implementation Details

- Hamburger lines use pure CSS transforms to morph into an X (no extra DOM icons)
- Mobile menu links use CSS custom property `--i` for staggered delay
- Scroll listener is passive
- Transitionend is used to properly hide the menu after the slide-out animation
- No external icon libraries — inline SVGs only

## Known Limitations

- Demo page content is static placeholder (intentional)
- No real routing — hash links only
- Backdrop-filter may be limited on very old browsers (graceful solid fallback exists via `--bg-elevated-solid`)

## Possible Future Improvements

- Add a third theme (e.g. high-contrast or brand)
- Scroll-spy that updates active link based on section in view
- Optional hide-on-scroll-down / reveal-on-scroll-up
- Mega-menu variant for desktop

## Project Structure

```
week-02-responsive-navbar/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── icons/          (reserved)
```

---

**Freelancer Development Program · Phase 1 · Week 02**
