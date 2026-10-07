# Auralis — Sonic Spatial Browser

**Project 19 · Advanced Creative Series**

Navigate a knowledge field primarily through spatialized sound. Visual map is secondary; structure is meant to be heard.

---

## Purpose

Push non-visual information interfaces: azimuth, distance, pitch, and pulse encode topic, relevance, category, and connection density.

---

## Features

- **Web Audio HRTF panning** — nodes in a 3D-ish field  
- **Listener movement** — WASD / arrows or click-to-place  
- **Scan** — sequential spatial signatures left→right  
- **Select nearest** — Enter; optional speech of label  
- **Distance filtering** — farther = darker, quieter  
- **Themes**: Void · Depth · Signal  
- Headphones recommended  
- Zero build step  

---

## How to Run

1. Open `index.html`.  
2. Click **Listen** (starts AudioContext).  
3. Move with WASD; **Space** to scan; **Enter** to select nearest.  
4. Click nodes or empty field to select or reposition.

---

## Technical Notes

- Oscillator + LFO pulse + lowpass per node  
- PannerNode with inverse distance model  
- No frameworks  

---

Built to Freelancer God-Tier standards. Portfolio-ready.
