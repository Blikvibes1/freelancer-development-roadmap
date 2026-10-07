# Celestial Codex — Generative Mythology Engine

**Project 1 · Advanced Creative Series**

A portfolio-quality generative system that creates coherent, original mythological worlds from cultural parameters. Includes a living interactive constellation map of divine relationships.

---

## Purpose

Users define high-level cultural seeds (climate, social structure, core values, relationship with nature, technological level, pantheon scale). The engine procedurally generates:

- A consistent pantheon of deities with names, titles, domains, personalities, and descriptions
- Cosmological structure and origin myth
- Rituals, symbols, and sacred places
- Moral codes derived from the chosen values
- An interactive force-style constellation visualization of relationships

The generation is deterministic (seeded) so the same parameters always produce the same mythology, while variations can be requested.

---

## Features

- **Parameter Forge** — Clean multi-group form for cultural inputs
- **Procedural Mythology Engine** — Rule-based generation with internal consistency
- **Myth Codex** — Structured, readable output of the full mythology
- **Living Constellation** — Interactive canvas map (drag nodes, click for details)
- **Evolution Chamber** — Generate variations or return to the Forge
- **True Theme Modes** — Three distinct design languages (not just color swaps):
  - **Astral** — Deep cosmic void, gold & silver light, organic curves
  - **Primordial** — Earthy ochre, stone geometry, heavier forms
  - **Ethereal** — High-key soft light, delicate lines, floating weightlessness
- Fully responsive (desktop → small mobile)
- Keyboard accessible + reduced-motion support
- Zero external runtime dependencies (vanilla HTML/CSS/JS)

---

## Design Concept

**“Celestial Codex”** — A living astronomical manuscript.  
The interface feels sacred, mysterious, and intelligent. Typography pairs Cormorant Garamond (display) with Outfit (UI). Motion is purposeful and restrained.

---

## How to Run

1. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).
2. No build step or server required.
3. Select cultural parameters → click **Weave Mythology**.
4. Explore the Codex, drag nodes in the Constellation, switch themes, generate variations.

---

## Controls & Interactions

| Action | Result |
|--------|--------|
| Select parameters | Sets the cultural seeds |
| Weave Mythology | Runs the generation ritual |
| Theme swatches (top right) | Instantly changes design language |
| Nav: Codex / Constellation / Evolve | Switch views (enabled after generation) |
| Drag constellation nodes | Reposition deities |
| Click a node | Open detailed god panel (includes relationships) |
| Click a Codex god card | Jumps to Constellation + opens that god |
| Click empty constellation space | Closes detail panel |
| Generate Variation | Creates a true new mythology from the same parameters |

**Constellation legend** (bottom-left) explains relationship line styles:
- Solid — Ally / Kin
- Dashed — Rival / Conflict
- Dotted — Lover / Mentor

---

## Responsive Behavior

- Desktop: Full multi-column parameter grid + wide constellation
- Tablet: Adjusted grid, touch-friendly targets
- Mobile: Stacked parameters, compact navigation, reduced constellation height, bottom-sheet style detail panel

---

## Accessibility Notes

- Semantic HTML structure
- Skip link
- Focus-visible styles
- ARIA labels on theme switcher, progress bar, and interactive regions
- `prefers-reduced-motion` respected
- Keyboard-operable form controls and navigation

---

## Theme Modes

Each theme changes more than color:

- Typography weight & letter-spacing
- Border radius language
- Surface material feel
- Shadow character
- Accent treatment
- Starfield palette
- Constellation node & link colors

---

## Technical Notes

- Seeded PRNG for reproducible generation
- Domain pools modulated by cultural parameters
- Relationship graph generated with controlled density
- Canvas-based starfield and constellation (devicePixelRatio aware)
- No frameworks, no build tools, no network requests at runtime

---

## Possible Future Improvements

- Force-directed physics simulation for the constellation
- Export mythology as Markdown / JSON
- Audio atmosphere (optional, with mute)
- More granular evolution controls (mutate single domain, add/remove gods)
- Local storage of past mythologies

---

## File Structure

```
generative-mythology-engine/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── images/
    └── icons/
```

---

Built according to the Freelancer God-Tier Master Instruction.  
Portfolio-ready. No spaghetti. Every major path tested.
