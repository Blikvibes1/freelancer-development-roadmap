# Dream Archive — Collective Subconscious

**Project 4 · Advanced Creative Series**

An intimate, anonymous archive for dreams. Users offer written dreams; the system extracts symbols, clusters related entries, maps them as a constellation, and surfaces recurring motifs as lineages.

---

## Purpose

Treat dreams as shared material. No names are stored. Patterns emerge when symbols recur across sleepers. The interface is quiet, respectful, slightly mysterious.

---

## Features

- **Archive** — Browse seed + user dreams as cards with feeling and symbols  
- **Search & symbol filters** — Find by text or recurring motif  
- **Submit** — Offer a dream anonymously (localStorage persistence)  
- **Symbol extraction** — Lexicon-based detection of recurring dream imagery  
- **Constellation** — Force-linked map of dreams connected by shared symbols; drag nodes, click to read  
- **Lineages** — Motifs that appear in two or more dreams, ranked by frequency  
- **True theme modes**
  - Nocturne — deep violet night  
  - Mist — pale daylight archive  
  - Ember — warm earth dusk  
- Responsive layout, keyboard-accessible cards, reduced-motion friendly  
- Zero build step — open `index.html`

---

## How to Run

1. Open `index.html` in a modern browser.  
2. Explore the Archive; filter by symbol chips.  
3. Submit a dream — it is saved locally and joins the constellation.  
4. Open Constellation to drag and inspect linked dreams.  
5. Open Lineages to see motifs traveling between sleepers.

---

## Technical Notes

- Client-side only (no backend)  
- Seed dreams + `localStorage` for user submissions  
- Symbol lexicon + shared-edge graph for constellation links  
- Canvas 2D constellation renderer with pointer interaction  
- No frameworks

---

## File Structure

```
dream-archive/
├── index.html
├── css/style.css
├── js/main.js
├── README.md
└── assets/
```

---

Built to Freelancer God-Tier standards. Portfolio-ready.
