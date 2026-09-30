# Helix — Week 06 FAQ Accordion

An accessible, animated FAQ accordion with smooth height transitions and true Theme Mode.

## Purpose

Week 06 of the Freelancer 100-week development program.  
Roadmap requirement: **Accordion/FAQ Component — expandable/collapsible FAQ section with smooth CSS transitions.**

## Features

- Smooth expand/collapse using CSS `grid-template-rows` (no JS height calculation)
- Plus icon rotates to × when open
- Multiple items can be open at once (better for FAQs)
- Full keyboard support (native button behavior)
- Proper ARIA (`aria-expanded`, `aria-controls`, `role="region"`)
- True Theme Mode (Noir / Lumen)
- Theme preference in `localStorage`
- `prefers-reduced-motion` respected
- Zero dependencies

## Design Languages

| Aspect     | Noir                        | Lumen                          |
|------------|-----------------------------|--------------------------------|
| Surfaces   | Deep solid cards            | Clean white cards              |
| Geometry   | Tighter radii               | Soft / pill icon buttons       |
| Accent     | Teal                        | Terracotta                     |
| Open state | Accent border + shadow      | Accent border + soft shadow    |

## Technologies

- Semantic HTML + ARIA accordion pattern
- CSS custom properties + grid height animation
- Vanilla JavaScript
- Google Fonts: DM Sans + Syne

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Accessibility

- Each trigger is a real `<button>`
- `aria-expanded` reflects state
- Panels linked via `aria-controls` / `aria-labelledby`
- Focus styles visible
- Reduced motion disables transitions

## Interesting Details

- Uses the modern `grid-template-rows: 0fr → 1fr` technique for height animation without measuring content
- Icon rotation provides clear open/closed feedback
- Multiple panels can stay open (common and preferred for FAQ pages)

## Project Structure

```
week-06-accordion-faq/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 1 · Week 06**
