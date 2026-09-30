# Aura — Week 03 Theme Mode System

A true Theme Mode implementation. Not a simple dark/light color swap.

## Purpose

Week 03 of the Freelancer 100-week development program.  
Roadmap requirement: **Dark/Light Mode Toggle — theme switcher using CSS variables and localStorage**.

This project elevates the requirement into a complete design-language system. Switching themes changes geometry, typography, surfaces, atmosphere, and accent character — not just colors.

## Features

- Two complete design languages:
  - **Noir** — cinematic dark, glass surfaces, tight geometry, teal accent
  - **Lumen** — warm editorial light, solid paper-like surfaces, soft radii, terracotta accent
- Theme preference persisted in `localStorage`
- First-visit respects `prefers-color-scheme`
- Signature physical-feeling theme switch (track + thumb + icon morph)
- Live component preview (buttons, inputs, cards, toggles, badges) that transform in real time
- Smooth global transitions on every themed property
- Fully keyboard accessible
- `prefers-reduced-motion` supported
- Clean, modular vanilla JS

## Design Philosophy

Theme Mode ≠ Dark Mode.

A proper Theme Mode changes:

| Layer        | Noir                          | Lumen                          |
|--------------|-------------------------------|--------------------------------|
| Surfaces     | Glass + blur                  | Solid, paper-like              |
| Geometry     | Tighter radii                 | Soft, generous / pill buttons  |
| Typography   | Tight tracking, heavy display | Open tracking, medium weight   |
| Accent       | Teal                          | Terracotta                     |
| Atmosphere  | Cinematic orbs, deep shadows  | Warm soft light                |

## Technologies

- Semantic HTML
- CSS custom properties (the entire theme system)
- Vanilla JavaScript (IIFE, no dependencies)
- Google Fonts: DM Sans + Syne

## How to Run

Open `index.html` in a browser, or:

```bash
npx serve .
```

No build step required.

## Controls

| Action                    | Result                          |
|---------------------------|---------------------------------|
| Click the theme switch    | Toggles Noir ↔ Lumen            |
| Click “Try the switch”    | Same toggle                     |
| Arrow keys on the switch  | Also toggles                    |
| Refresh the page          | Theme is restored from storage  |

## Accessibility

- `role="switch"` + `aria-checked` on the theme control
- Clear `aria-label` that updates with state
- Visible focus rings
- Skip link
- Reduced motion respected

## Interesting Details

- Almost every visual property is driven by CSS custom properties on `[data-theme]`
- JavaScript only toggles the attribute and writes to `localStorage`
- Button border-radius, input radius, tracking, and font-weight all change with the theme
- The switch thumb uses a spring-like easing for a tactile feel

## Project Structure

```
week-03-theme-mode/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

## Known Limitations

- Only two themes (intentionally focused)
- Demo content is static (by design)

## Possible Extensions

- Add a third theme (e.g. high-contrast or brand)
- Theme transition with a brief “wipe” or shared-element effect
- Export current theme as CSS variables

---

**Freelancer Development Program · Phase 1 · Week 03**
