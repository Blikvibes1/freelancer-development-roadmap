# Aperture — Week 04 Image Carousel

A premium, accessible, custom-built image carousel with autoplay, keyboard control, touch swipe, progress indicator, and true Theme Mode.

## Purpose

Week 04 of the Freelancer 100-week development program.  
Roadmap requirement: **Image Carousel/Slider — custom image slider with auto-play, next/prev buttons, and dot indicators (no libraries).**

This is not a minimal demo. The carousel is treated as a polished product component.

## Features

- Autoplay with configurable interval (5s)
- Pause on hover and focus
- Pause when browser tab is hidden
- Previous / Next buttons
- Accessible dot navigation (`role="tablist"`)
- Progress bar that resets with each slide
- Keyboard support (← →)
- Touch swipe on mobile
- Live region announcements for screen readers
- True Theme Mode (Noir / Lumen) that changes geometry, surfaces, and atmosphere
- Theme preference saved in `localStorage`
- `prefers-reduced-motion` respected
- Zero dependencies

## Design Languages

| Aspect       | Noir                              | Lumen                              |
|--------------|-----------------------------------|------------------------------------|
| Mood         | Cinematic, focused                | Editorial, warm                    |
| Surfaces     | Deep gradients + glass controls   | Soft paper-like gradients          |
| Geometry     | Tighter radii                     | Soft / pill controls               |
| Accent       | Teal                              | Terracotta                         |
| Typography   | Tight tracking, heavy display     | Open tracking                      |

## Technologies

- Semantic HTML + ARIA carousel pattern
- CSS custom properties for theming
- Vanilla JavaScript (IIFE, modular functions)
- Google Fonts: DM Sans + Syne

## How to Run

Open `index.html` in a modern browser, or:

```bash
npx serve .
```

No build step. No external image dependencies (gradient-based slides for reliability).

## Controls

| Input                     | Action                        |
|---------------------------|-------------------------------|
| Next / Prev buttons       | Change slide                  |
| Dots                      | Jump to specific slide        |
| ← → keys                  | Navigate                      |
| Swipe left / right        | Navigate (touch)              |
| Play / Pause button       | Toggle autoplay               |
| Hover or focus carousel   | Pause autoplay                |
| Theme switch              | Toggle Noir ↔ Lumen           |

## Accessibility

- `role="region"` + `aria-roledescription="carousel"`
- Each slide: `role="group"` + `aria-roledescription="slide"`
- Dots use `role="tablist"` / `aria-selected`
- Live region announces current slide
- Clear button labels
- Visible focus styles
- Reduced motion support

## Interesting Implementation Details

- Progress bar uses `requestAnimationFrame` for smooth updates
- Autoplay is fully restarted on manual navigation
- Touch handling is passive and lightweight
- Theme changes affect control geometry (sharp vs pill) in addition to color
- No external images — pure CSS gradients keep the project self-contained and fast

## Project Structure

```
week-04-image-carousel/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── images/
```

## Known Limitations

- Slides use CSS gradients instead of photos (intentional for reliability and performance)
- No infinite cloning / seamless loop (simple index wrapping instead)

## Possible Future Improvements

- Optional real image support via data attributes
- Fade transition mode in addition to slide
- Thumbnail strip variant
- Reduced-motion alternative (instant cut + opacity)

---

**Freelancer Development Program · Phase 1 · Week 04**
