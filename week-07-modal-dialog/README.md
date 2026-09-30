# Portal — Week 07 Modal Dialog

An accessible modal system with focus trap, Escape key, backdrop click, focus restoration, and true Theme Mode.

## Purpose

Week 07 of the Freelancer 100-week development program.  
Roadmap requirement: **Modal/Popup Dialog — accessible modal that traps focus, closes on outside click, and handles ESC key presses.**

## Features

- Focus trap (Tab / Shift+Tab cycle inside the modal)
- Escape key closes the modal
- Click on backdrop closes the modal
- Focus returns to the trigger that opened it
- Body scroll locked while open
- Smooth scale + fade enter/exit
- Two demo variants: form modal + confirm dialog
- True Theme Mode (Noir / Lumen)
- `localStorage` theme preference
- `prefers-reduced-motion` supported
- Zero dependencies

## Accessibility Checklist

- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` pointing to the title
- Focus moved into the modal on open
- Focus trapped while open
- Focus restored on close
- Close button has clear accessible name
- Keyboard fully operable

## Technologies

- Semantic HTML + ARIA dialog pattern
- CSS custom properties + transitions
- Vanilla JavaScript (IIFE)
- Google Fonts: DM Sans + Syne

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Controls

| Action                    | Result                          |
|---------------------------|---------------------------------|
| Open buttons              | Open the corresponding modal    |
| Escape                    | Close active modal              |
| Click backdrop / × / Cancel | Close                         |
| Tab / Shift+Tab           | Cycle focus inside modal        |

## Project Structure

```
week-07-modal-dialog/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 1 · Week 07**
