# Tempo — Week 13 Pomodoro Timer

Customizable Pomodoro timer with work/break modes, circular progress, audio notifications, and task tracking.

## Purpose

Week 13 of the Freelancer 100-week development program.  
Roadmap requirement: **Pomodoro Timer — customizable work/break timer with audio notifications and task tracking.**

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Circular progress ring (SVG)
- Mode tabs (Focus / Short / Long)
- Large timer display
- Start / Pause / Reset controls
- Collapsible settings panel
- Task list with complete / remove
- Session counter
- Theme-aware surfaces, geometry, and accent colors
- Micro-interactions on buttons and tabs

## Features

- Focus, short break, and long break modes
- Customizable durations (saved in `localStorage`)
- SVG progress ring that counts down
- Start / Pause / Reset
- Audio notification (Web Audio API beeps) when a cycle ends
- Auto-switch: focus → short break (or long every 4th session)
- Daily focus session counter
- Task list (add, complete, remove) persisted in `localStorage`
- True Theme Mode (Noir / Lumen)
- Keyboard: Space to start/pause
- Zero dependencies

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Project Structure

```
week-13-pomodoro-timer/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 2 · Week 13**
