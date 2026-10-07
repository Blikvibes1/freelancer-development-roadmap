# Living Type — Organism Typography System

**Project 3 · Advanced Creative Series**

An interactive typography system where letterforms behave like living organisms: they breathe, drift, mutate, and react to pointer and sound while remaining legible.

---

## Purpose

Explore the boundary between written language and living form. Users type freely; each glyph becomes an independent agent with spring physics, mode-driven motion, and environmental response.

---

## Features

- **Real-time compose** — Type and watch letters wake, layout, and live
- **Four behavioral modes**
  - Calm — slow breath, soft drift
  - Curious — lean toward pointer, exploratory motion
  - Aggressive — sharp pulse, high tension
  - Decaying — fade, fragment, rest
- **Pointer influence** — Proximity field pushes or pulls glyphs
- **Microphone energy** (optional) — Audio level injects kinetic energy
- **Tracking & scale** controls
- **True theme modes** (design language change)
  - Vital — organic teal/green
  - Spectral — cool violet, ghostly
  - Mineral — stone, warm weight
- `prefers-reduced-motion` support (static layout)
- Fully responsive side-panel UI
- Zero build step — open `index.html`

---

## How to Run

1. Open `index.html` in a modern browser.
2. Type in the Compose panel.
3. Switch Modes to change organism behavior.
4. Enable pointer / mic reaction under React.
5. Switch themes (top right).

---

## Controls

| Input | Effect |
|-------|--------|
| Textarea | Live text |
| Tracking slider | Letter spacing |
| Scale slider | Base glyph size |
| Mode radios | Behavior profile |
| Pointer influence | Glyphs react to cursor |
| Microphone energy | Requires permission; reacts to volume |
| Sensitivity | Strength of reactions |

---

## Technical Notes

- Canvas 2D renderer with per-letter spring physics
- Mode parameter table (breath, drift, jitter, mutate, stiffness)
- Deterministic home layout with velocity preservation on edit
- Web Audio analyser for optional mic input
- No frameworks, no build tools

---

## File Structure

```
living-typography-system/
├── index.html
├── css/style.css
├── js/main.js
├── README.md
└── assets/
```

---

Built to Freelancer God-Tier standards. Portfolio-ready.
