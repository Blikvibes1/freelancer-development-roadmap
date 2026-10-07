# Synesthete — Cross-Sense Instrument

**Project 5 · Advanced Creative Series**

A real-time synesthetic instrument that maps text, voice energy, and pointer gesture into tightly coupled visual and sonic output.

---

## Purpose

Discover relationships between senses. Type to hear harmony; move to bend space and pitch; speak to drive amplitude. Exploratory and performative modes change attack, contrast, and particle behavior.

---

## Features

- **Text → tone & form** — Characters map to scale frequencies; text appears as a living ribbon  
- **Voice energy** — Optional microphone drives amplitude rings and particle density  
- **Pointer gesture** — Position controls spatial color field and pitch bend  
- **Strike chord** — Instant multi-note gesture  
- **Modes**
  - Exploratory — soft attack, sustained, discover  
  - Performative — sharp attack, high contrast  
- **Sensitivity mapping** — Independent gain for voice, text, pointer  
- **Themes**: Chroma · Mono · Infra  
- Low-latency Web Audio + Canvas 2D  
- `prefers-reduced-motion` support  
- Zero build step

---

## How to Run

1. Open `index.html` in a modern browser.  
2. Click **Strike chord** or type in the text field (audio starts on user gesture).  
3. Enable microphone for voice-reactive visuals (permission required).  
4. Move pointer over the stage to shift the color field and pitch bend.  
5. Switch Mapping / Modes panels to refine behavior.

---

## Technical Notes

- Web Audio API (oscillators, gain envelopes, analyser)  
- Canvas particle system + radial fields  
- Character → frequency mapping (scale-like)  
- No frameworks, no build tools

---

## File Structure

```
synesthetic-instrument/
├── index.html
├── css/style.css
├── js/main.js
├── README.md
└── assets/
```

---

Built to Freelancer God-Tier standards. Portfolio-ready.
